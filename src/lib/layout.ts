import * as dagre from "@dagrejs/dagre";
import type { WiringEdge, WiringNode } from "./buildFlow";

const NODE_W = 210;
const NODE_H = 120;
const JUNCTION_SIZE = 22;

function sizeOf(node: WiringNode): { width: number; height: number } {
  if (node.type === "junction") {
    return { width: JUNCTION_SIZE, height: JUNCTION_SIZE };
  }
  if (node.type === "splice") {
    return { width: 176, height: 100 };
  }
  return { width: node.width ?? NODE_W, height: node.height ?? NODE_H };
}

/**
 * Position nodes left-to-right (power source -> loads) with dagre. Nodes that
 * declared a `position` in the DSL keep it; everything else is auto-placed.
 */
export function autoLayout(
  nodes: WiringNode[],
  edges: WiringEdge[],
): WiringNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 96, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const { width, height } = sizeOf(node);
    g.setNode(node.id, { width, height });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    if (node.data?.fixedPosition) return node;
    const placed = g.node(node.id);
    if (!placed) return node;
    return {
      ...node,
      position: {
        x: placed.x - placed.width / 2,
        y: placed.y - placed.height / 2,
      },
    };
  });
}
