import type { Edge, Node } from "@xyflow/react";
import type { Component, Netlist } from "@/types/dsl";
import type { ComponentSimState } from "@/types/sim";
import { wireColor } from "./colors";
import { parseRef } from "./dsl/refs";

export type FlowNodeData = {
  /** present on component nodes */
  component?: Component;
  /** present on synthesized junction nodes */
  netId?: string;
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
  color: string;
  energized?: boolean;
  highlighted?: boolean;
};

export type WiringNode = Node<FlowNodeData>;
export type WiringEdge = Edge<FlowEdgeData>;

export const JUNCTION_PREFIX = "_net_";

const baseEdgeStyle = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  opacity: 0.45,
});

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

  for (const net of netlist.nets) {
    const color = wireColor(net.color);

    if (net.members.length === 2) {
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

  return { nodes, edges };
}
