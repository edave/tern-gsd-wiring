import type { Edge, Node } from "@xyflow/react";
import type { Component, Net, Netlist } from "@/types/dsl";
import type { ComponentSimState } from "@/types/sim";
import { wireColor } from "./colors";
import { parseRef } from "./dsl/refs";

export type FlowNodeData = {
  /** present on component nodes */
  component?: Component;
  /** present on synthesized junction nodes */
  netId?: string;
  /** present on synthesized cable-breakout nodes */
  cableId?: string;
  gauge?: string;
  /** conductor nets carried by a cable breakout (energized if ANY is) */
  netIds?: string[];
  color?: string;
  label?: string;
  /** node position came from the DSL (don't auto-layout it) */
  fixedPosition?: boolean;
  /** merged in by the canvas each sim tick */
  sim?: ComponentSimState;
  energized?: boolean;
  highlighted?: boolean;
};

export type FlowEdgeData = {
  netId: string;
  /** for a cable trunk: the nets it carries (energized if ANY of them is) */
  netIds?: string[];
  color: string;
  energized?: boolean;
  highlighted?: boolean;
};

export type WiringNode = Node<FlowNodeData>;
export type WiringEdge = Edge<FlowEdgeData>;

export const JUNCTION_PREFIX = "_net_";
export const CABLE_PREFIX = "_cable_";

/** The sheath color of a cable trunk (neutral gray; conductors keep real colors). */
const SHEATH_COLOR = "#64748b";

const baseEdgeStyle = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  opacity: 0.45,
});

/** Component ids present in every conductor of a cable (the shared bundle origin). */
function sharedComponents(conductors: Net[]): string[] {
  if (conductors.length === 0) return [];
  const compsOf = (net: Net) =>
    new Set(net.members.map((m) => parseRef(m).componentId));
  let shared = compsOf(conductors[0]);
  for (let i = 1; i < conductors.length; i++) {
    const comps = compsOf(conductors[i]);
    shared = new Set([...shared].filter((c) => comps.has(c)));
  }
  return [...shared];
}

/**
 * Transform a netlist into React Flow nodes + edges (structure only; no sim state).
 * 2-member nets become a single edge; nets joining 3+ terminals get a synthesized
 * junction node with a star of edges. Junction nodes are purely visual — the
 * simulator never reads them.
 */
export function buildFlow(netlist: Netlist): {
  nodes: WiringNode[];
  edges: WiringEdge[];
} {
  const nodes: WiringNode[] = [];
  const edges: WiringEdge[] = [];

  for (const c of netlist.components) {
    nodes.push({
      id: c.id,
      type: c.type,
      position: c.position ?? { x: 0, y: 0 },
      data: { component: c, fixedPosition: Boolean(c.position) },
    });
  }

  // Conductor nets are drawn by the cable pass below, not as plain edges here.
  const conductorNetIds = new Set<string>();
  for (const cable of netlist.cables) {
    for (const id of cable.conductors) conductorNetIds.add(id);
  }

  const pushSimpleEdge = (net: Net) => {
    const color = wireColor(net.color);
    const a = parseRef(net.members[0]);
    const b = parseRef(net.members[1]);
    edges.push({
      id: `e_${net.id}`,
      source: a.componentId,
      sourceHandle: a.terminalId,
      target: b.componentId,
      targetHandle: b.terminalId,
      type: "smoothstep",
      data: { netId: net.id, color },
      style: baseEdgeStyle(color),
    });
  };

  for (const net of netlist.nets) {
    if (conductorNetIds.has(net.id)) continue;
    const color = wireColor(net.color);

    if (net.members.length === 2) {
      pushSimpleEdge(net);
      continue;
    }

    // 3+ members: star them through a junction node.
    const jid = `${JUNCTION_PREFIX}${net.id}`;
    nodes.push({
      id: jid,
      type: "junction",
      position: { x: 0, y: 0 },
      data: { netId: net.id, color, label: net.label ?? net.id },
    });
    net.members.forEach((member, i) => {
      const r = parseRef(member);
      edges.push({
        id: `e_${net.id}_${i}`,
        source: r.componentId,
        sourceHandle: r.terminalId,
        target: jid,
        targetHandle: "j",
        type: "smoothstep",
        data: { netId: net.id, color },
        style: baseEdgeStyle(color),
      });
    });
  }

  // Cables: a thick sheath trunk from the shared origin into a breakout node,
  // then individually-colored conductor wires fanning out to their splices.
  const netById = new Map(netlist.nets.map((n) => [n.id, n]));
  for (const cable of netlist.cables) {
    const conductors = cable.conductors
      .map((id) => netById.get(id))
      .filter((n): n is Net => Boolean(n) && n!.members.length === 2);
    if (conductors.length === 0) continue;

    // A cable bundles wires that leave one component together; find it.
    const origin = sharedComponents(conductors)[0];
    if (!origin) {
      // Not a common-origin bundle — fall back to plain colored wires.
      conductors.forEach(pushSimpleEdge);
      continue;
    }

    const bid = `${CABLE_PREFIX}${cable.id}`;
    nodes.push({
      id: bid,
      type: "cableBreakout",
      position: { x: 0, y: 0 },
      data: {
        cableId: cable.id,
        label: cable.label ?? cable.id,
        gauge: cable.gauge,
        netIds: conductors.map((n) => n.id),
        color: SHEATH_COLOR,
      },
    });

    // Trunk: from the origin component (anchored at the first conductor's origin
    // terminal) to the breakout. Carries all conductor nets for energize checks.
    const firstOrigin = conductors[0].members
      .map(parseRef)
      .find((r) => r.componentId === origin)!;
    edges.push({
      id: `e_${cable.id}_trunk`,
      source: origin,
      sourceHandle: firstOrigin.terminalId,
      target: bid,
      targetHandle: "in",
      type: "cable",
      data: {
        netId: conductors[0].id,
        netIds: conductors.map((n) => n.id),
        color: SHEATH_COLOR,
      },
    });

    // Each conductor is drawn as a colored lead from its origin terminal into the
    // sheath, then a colored wire fanning back out to its far end. The thick trunk
    // above overlays the origin leads so the bundle reads as one cable that splits.
    conductors.forEach((net, i) => {
      const refs = net.members.map(parseRef);
      const src = refs.find((r) => r.componentId === origin) ?? refs[0];
      const dest = refs.find((r) => r.componentId !== origin) ?? refs[1];
      const color = wireColor(net.color);
      edges.push({
        id: `e_${cable.id}_${i}_in`,
        source: src.componentId,
        sourceHandle: src.terminalId,
        target: bid,
        targetHandle: "in",
        type: "smoothstep",
        data: { netId: net.id, color },
        style: baseEdgeStyle(color),
      });
      edges.push({
        id: `e_${cable.id}_${i}_out`,
        source: bid,
        sourceHandle: "out",
        target: dest.componentId,
        targetHandle: dest.terminalId,
        type: "smoothstep",
        data: { netId: net.id, color },
        style: baseEdgeStyle(color),
      });
    });
  }

  return { nodes, edges };
}
