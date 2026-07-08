import type { Component, Netlist } from "@/types/dsl";
import type { ComponentSimState, SimResult, SwitchState } from "@/types/sim";
import { refOf } from "./dsl/refs";

/**
 * Pure electrical simulator. Deterministic: same inputs -> same output, no React,
 * no time, no randomness. Models presence-of-power (not current magnitude) by
 * flooding the 12V+ and ground rails through a switch-gated conduction graph, then
 * deriving light/switch/signal state.
 *
 * Signal semantics (HIGHBEAM / BRAKE) use closure-based assertion so the result is
 * correct whether a switch is wired low-side or high-side — the real-world pinout is
 * uncertain, and the DSL lets the user re-route it without changing this logic.
 */

const NET = (id: string) => `net:${id}`;
const UNION = (id: string) => `u:${id}`; // pseudo-node unioning a component's terminals

function isTermRef(node: string): boolean {
  // terminal refs look like "comp.term"; pseudo-nodes use a ":" prefix
  return node.includes(".") && !node.includes(":");
}

/** Is this switch conducting given the current control state? */
export function switchClosed(component: Component, state: SwitchState): boolean {
  const kind = component.props?.switchKind ?? "NO";
  const control = component.props?.controlledBy;
  const engaged = control ? Boolean(state[control]) : false;
  return kind === "NC" ? !engaged : engaged;
}

function addEdge(adj: Map<string, Set<string>>, a: string, b: string): void {
  let sa = adj.get(a);
  if (!sa) {
    sa = new Set();
    adj.set(a, sa);
  }
  sa.add(b);
  let sb = adj.get(b);
  if (!sb) {
    sb = new Set();
    adj.set(b, sb);
  }
  sb.add(a);
}

/** Build the conduction graph for the current switch state (nodes: terminal refs + pseudo-nodes). */
function buildGraph(
  netlist: Netlist,
  state: SwitchState,
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();

  // nets: connect each member to a shared net pseudo-node
  for (const net of netlist.nets) {
    const node = NET(net.id);
    for (const member of net.members) addEdge(adj, member, node);
  }

  for (const c of netlist.components) {
    const unionAll = () => {
      for (const t of c.terminals) addEdge(adj, refOf(c.id, t.id), UNION(c.id));
    };
    if (
      c.type === "connector" ||
      c.type === "junction" ||
      c.type === "splice"
    ) {
      unionAll(); // one electrical node: connector pass-through, or a permanent splice
    } else if (c.type === "switch") {
      if (switchClosed(c, state)) unionAll();
    }
    // explicit always-on internal bridges (e.g. a light's daisy-chain pass-through)
    const bridges = c.props?.bridges;
    if (Array.isArray(bridges)) {
      for (const [a, b] of bridges) {
        addEdge(adj, refOf(c.id, a), refOf(c.id, b));
      }
    }
  }

  return adj;
}

/** BFS: all node keys reachable from any seed. */
function reach(adj: Map<string, Set<string>>, seeds: string[]): Set<string> {
  const seen = new Set<string>();
  const queue: string[] = [];
  for (const s of seeds) {
    if (!seen.has(s)) {
      seen.add(s);
      queue.push(s);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    const nbrs = adj.get(node);
    if (!nbrs) continue;
    for (const m of nbrs) {
      if (!seen.has(m)) {
        seen.add(m);
        queue.push(m);
      }
    }
  }
  return seen;
}

export function simulate(
  netlist: Netlist,
  state: SwitchState,
  masterOn: boolean,
): SimResult {
  const adj = buildGraph(netlist, state);

  // Seed the two rails from every source.
  const posSeeds: string[] = [];
  const gndSeeds: string[] = [];
  for (const c of netlist.components) {
    if (c.type !== "source") continue;
    for (const t of c.terminals) {
      if (t.role === "pos") posSeeds.push(refOf(c.id, t.id));
      else if (t.role === "gnd") gndSeeds.push(refOf(c.id, t.id));
    }
  }

  const posReach = masterOn ? reach(adj, posSeeds) : new Set<string>();
  const gndReach = masterOn ? reach(adj, gndSeeds) : new Set<string>();

  const poweredRefs = new Set<string>();
  for (const n of posReach) if (isTermRef(n)) poweredRefs.add(n);
  const groundedRefs = new Set<string>();
  for (const n of gndReach) if (isTermRef(n)) groundedRefs.add(n);

  // Signal drivers: a signal-out is "driving" if its switch is closed (closure-based)
  // or if the terminal is otherwise live (switched-12V / high-side). Sinks are signal-ins.
  const driversBySignal = new Map<string, string[]>();
  const sinksBySignal = new Map<string, string[]>();
  for (const c of netlist.components) {
    for (const t of c.terminals) {
      if (!t.signal) continue;
      const ref = refOf(c.id, t.id);
      if (t.role === "signal-out") {
        const switchDriver =
          c.type === "switch" && masterOn && switchClosed(c, state);
        const liveDriver = masterOn && poweredRefs.has(ref);
        if (switchDriver || liveDriver) {
          const arr = driversBySignal.get(t.signal);
          if (arr) arr.push(ref);
          else driversBySignal.set(t.signal, [ref]);
        }
      } else if (t.role === "signal-in") {
        const arr = sinksBySignal.get(t.signal);
        if (arr) arr.push(ref);
        else sinksBySignal.set(t.signal, [ref]);
      }
    }
  }

  const assertedSignals = new Set<string>();
  const deliveredRefs = new Set<string>();
  const signalNets = new Set<string>();
  for (const [signal, drivers] of driversBySignal) {
    if (drivers.length === 0) continue;
    assertedSignals.add(signal);
    const sReach = reach(adj, drivers);
    for (const sink of sinksBySignal.get(signal) ?? []) {
      if (sReach.has(sink)) deliveredRefs.add(sink);
    }
    for (const net of netlist.nets) {
      if (net.signal === signal && sReach.has(NET(net.id))) signalNets.add(net.id);
    }
  }

  // Per-component derived state.
  const components: Record<string, ComponentSimState> = {};
  let anyLoadOn = false;
  for (const c of netlist.components) {
    const poweredTerminals = new Set<string>();
    const groundedTerminals = new Set<string>();
    for (const t of c.terminals) {
      const ref = refOf(c.id, t.id);
      if (poweredRefs.has(ref)) poweredTerminals.add(t.id);
      if (groundedRefs.has(ref)) groundedTerminals.add(t.id);
    }
    const st: ComponentSimState = {
      poweredTerminals,
      groundedTerminals,
      activeSignals: [],
    };
    if (c.type === "switch") st.closed = switchClosed(c, state);
    if (c.type === "light") {
      const hasPos = c.terminals.some(
        (t) => t.role === "pos" && poweredTerminals.has(t.id),
      );
      const hasGnd = c.terminals.some(
        (t) => t.role === "gnd" && groundedTerminals.has(t.id),
      );
      st.on = masterOn && hasPos && hasGnd;
      if (st.on) {
        anyLoadOn = true;
        const sigs = new Set<string>();
        for (const t of c.terminals) {
          if (
            t.role === "signal-in" &&
            t.signal &&
            deliveredRefs.has(refOf(c.id, t.id))
          ) {
            sigs.add(t.signal);
          }
        }
        st.activeSignals = [...sigs];
      }
    }
    components[c.id] = st;
  }

  // Nets to highlight: live 12V wires; ground return wires when a load is on; asserted signal wires.
  const energizedNets = new Set<string>();
  for (const net of netlist.nets) {
    if (posReach.has(NET(net.id))) energizedNets.add(net.id);
  }
  if (masterOn && anyLoadOn) {
    for (const net of netlist.nets) {
      if (gndReach.has(NET(net.id))) energizedNets.add(net.id);
    }
  }
  for (const id of signalNets) energizedNets.add(id);

  return {
    masterOn,
    poweredRefs,
    groundedRefs,
    energizedNets,
    assertedSignals,
    components,
  };
}

/**
 * Terminal refs reachable from `seeds` through the conduction graph at the given
 * switch state. Used by the verifier (e.g. to find which loads draw from a port).
 */
export function conductionReach(
  netlist: Netlist,
  state: SwitchState,
  seeds: string[],
): Set<string> {
  const adj = buildGraph(netlist, state);
  const out = new Set<string>();
  for (const node of reach(adj, seeds)) {
    if (isTermRef(node)) out.add(node);
  }
  return out;
}
