import type { Component, Netlist } from "@/types/dsl";
import type { SimResult, SwitchState } from "@/types/sim";
import type { RuleResult } from "@/types/verify";
import { buildIndex } from "./dsl/refs";
import { refOf } from "./dsl/refs";
import { conductionReach, simulate } from "./simulate";

/**
 * Pure verification. Runs the simulator at a few canonical switch states and
 * checks declarative rules, so it answers "is this wiring correct?" independent
 * of the live UI toggles. Returns pass/fail/warn results with refs to highlight.
 */
export function verify(netlist: Netlist): RuleResult[] {
  const index = buildIndex(netlist);
  const lights = netlist.components.filter((c) => c.type === "light");
  const sources = netlist.components.filter((c) => c.type === "source");

  const controls = new Set<string>();
  for (const c of netlist.components) {
    const ctrl = c.props?.controlledBy;
    if (c.type === "switch" && typeof ctrl === "string") controls.add(ctrl);
  }

  const simWith = (active: string[]): SimResult => {
    const state: SwitchState = {};
    for (const a of active) state[a] = true;
    return simulate(netlist, state, true);
  };

  const simBaseOn = simWith([]); // system on, all switches open
  const simAllOn = simWith([...controls]); // system on, every switch closed

  // Signals: which switches drive each, which lights consume each.
  const driversBySignal = new Map<string, Component[]>();
  const sinksBySignal = new Map<string, Component[]>();
  for (const c of netlist.components) {
    for (const t of c.terminals) {
      if (!t.signal) continue;
      if (t.role === "signal-out" && c.type === "switch") {
        const arr = driversBySignal.get(t.signal);
        if (arr) arr.push(c);
        else driversBySignal.set(t.signal, [c]);
      } else if (t.role === "signal-in" && c.type === "light") {
        const arr = sinksBySignal.get(t.signal);
        if (arr) arr.push(c);
        else sinksBySignal.set(t.signal, [c]);
      }
    }
  }

  const results: RuleResult[] = [];

  // 1. Every light receives power (covers front 12V + tail daisy-chain).
  {
    const off = lights.filter((l) => !simBaseOn.components[l.id]?.on);
    results.push({
      id: "lights-powered",
      title: "All lights receive power",
      severity: off.length ? "fail" : "pass",
      message: off.length
        ? `Not powered with the system on: ${off.map((l) => l.label).join(", ")}.`
        : `All ${lights.length} light(s) power up (including any daisy-chain).`,
      refs: off.map((l) => l.id),
    });
  }

  // 2. Ground continuity to every light.
  {
    const noGnd = lights.filter(
      (l) =>
        !l.terminals.some(
          (t) =>
            t.role === "gnd" &&
            simBaseOn.groundedRefs.has(refOf(l.id, t.id)),
        ),
    );
    results.push({
      id: "gnd-continuity",
      title: "Ground continuity to all lights",
      severity: noGnd.length ? "fail" : "pass",
      message: noGnd.length
        ? `No ground path to: ${noGnd.map((l) => l.label).join(", ")}.`
        : "Every light has a ground return to the source.",
      refs: noGnd.map((l) => l.id),
    });
  }

  // 3. No direct 12V <-> GND short (checked across open and all-closed states).
  {
    const shortRefs = new Set<string>();
    for (const sim of [simBaseOn, simAllOn]) {
      for (const ref of sim.poweredRefs) {
        if (sim.groundedRefs.has(ref)) shortRefs.add(ref);
      }
    }
    const refs = [...shortRefs];
    results.push({
      id: "no-short",
      title: "No 12V ↔ GND short",
      severity: refs.length ? "fail" : "pass",
      message: refs.length
        ? `12V and ground meet at: ${refs.join(", ")}. This is a short circuit.`
        : "The 12V and ground rails stay isolated.",
      refs,
    });
  }

  // 4. Each consumed signal actually reaches its light(s) when its driver(s) are active.
  for (const [signal, sinks] of sinksBySignal) {
    const drivers = driversBySignal.get(signal) ?? [];
    if (drivers.length === 0) {
      results.push({
        id: `signal-${signal}-driver`,
        title: `${signal} has a driver`,
        severity: "warn",
        message: `${signal} is consumed by ${sinks
          .map((s) => s.label)
          .join(", ")} but no switch drives it.`,
        refs: sinks.map((s) => s.id),
      });
      continue;
    }
    const active = drivers
      .map((d) => d.props?.controlledBy)
      .filter((c): c is string => typeof c === "string");
    const sim = simWith(active);
    const missed = sinks.filter(
      (s) => !sim.components[s.id]?.activeSignals.includes(signal),
    );
    results.push({
      id: `signal-${signal}-reaches`,
      title: `${signal} reaches its light`,
      severity: missed.length ? "fail" : "pass",
      message: missed.length
        ? `${signal} does not reach: ${missed.map((s) => s.label).join(", ")}.`
        : `${signal} reaches ${sinks.map((s) => s.label).join(", ")}.`,
      refs: missed.map((s) => s.id),
    });
  }

  // 5. Redundant drivers (e.g. either brake lever) — each alone must trigger.
  for (const [signal, drivers] of driversBySignal) {
    if (drivers.length < 2) continue;
    const sinks = sinksBySignal.get(signal) ?? [];
    if (sinks.length === 0) continue;
    const failing: Component[] = [];
    for (const d of drivers) {
      const ctrl = d.props?.controlledBy;
      if (typeof ctrl !== "string") continue;
      const sim = simWith([ctrl]);
      const ok = sinks.every((s) =>
        sim.components[s.id]?.activeSignals.includes(signal),
      );
      if (!ok) failing.push(d);
    }
    results.push({
      id: `signal-${signal}-either`,
      title: `${signal}: each source works alone`,
      severity: failing.length ? "fail" : "pass",
      message: failing.length
        ? `These do not trigger ${signal} on their own: ${failing
            .map((d) => d.label)
            .join(", ")}.`
        : `Any of the ${drivers.length} ${signal} sources triggers it independently.`,
      refs: failing.map((d) => d.id),
    });
  }

  // 6. Orphan terminals (warn) — anything not joined by a net.
  {
    const orphans: string[] = [];
    for (const c of netlist.components) {
      if (c.type === "source") continue; // a drive unit may legitimately have spare ports
      for (const t of c.terminals) {
        const ref = refOf(c.id, t.id);
        if (!index.connectedRefs.has(ref)) orphans.push(ref);
      }
    }
    results.push({
      id: "orphan-terminals",
      title: "No unconnected terminals",
      severity: orphans.length ? "warn" : "pass",
      message: orphans.length
        ? `Not wired to anything: ${orphans.join(", ")}.`
        : "Every terminal is wired into a net.",
      refs: orphans,
    });
  }

  // 7. Power budget — per rated output port (terminal maxWatts), else a total fallback.
  {
    const ratedPorts: {
      src: Component;
      termId: string;
      label: string;
      maxWatts: number;
    }[] = [];
    for (const src of sources) {
      for (const t of src.terminals) {
        if (typeof t.maxWatts === "number") {
          ratedPorts.push({
            src,
            termId: t.id,
            label: t.label ?? t.id,
            maxWatts: t.maxWatts,
          });
        }
      }
    }

    if (ratedPorts.length > 0) {
      const violations: string[] = [];
      const refs: string[] = [];
      for (const port of ratedPorts) {
        const reached = conductionReach(netlist, {}, [
          refOf(port.src.id, port.termId),
        ]);
        const draw = lights
          .filter((l) =>
            l.terminals.some(
              (t) => t.role === "pos" && reached.has(refOf(l.id, t.id)),
            ),
          )
          .reduce((sum, l) => sum + (Number(l.props?.powerWatts) || 0), 0);
        if (draw > port.maxWatts) {
          violations.push(
            `${port.label} carries ~${draw}W vs ~${port.maxWatts}W rated`,
          );
          refs.push(port.src.id);
        }
      }
      results.push({
        id: "power-budget",
        title: "Within port power budget",
        severity: violations.length ? "warn" : "pass",
        message: violations.length
          ? `${violations.join("; ")}. Confirm the Bosch system allows this before installing.`
          : "Every powered port stays within its rated budget.",
        refs,
      });
    } else {
      const totalLoad = lights.reduce(
        (sum, l) => sum + (Number(l.props?.powerWatts) || 0),
        0,
      );
      const totalPort = sources.reduce(
        (sum, s) => sum + (Number(s.props?.maxPortWatts) || 0),
        0,
      );
      const over = totalPort > 0 && totalLoad > totalPort;
      results.push({
        id: "power-budget",
        title: "Within port power budget",
        severity: over ? "warn" : "pass",
        message:
          totalPort > 0
            ? over
              ? `Loads draw ~${totalLoad}W but the port is rated ~${totalPort}W. Confirm before installing.`
              : `Loads draw ~${totalLoad}W within the ~${totalPort}W budget.`
            : "No port rating declared.",
        refs: sources.map((s) => s.id),
      });
    }
  }

  return results;
}
