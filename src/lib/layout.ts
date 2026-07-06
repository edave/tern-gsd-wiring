import * as dagre from "@dagrejs/dagre";
import type { WiringEdge, WiringNode } from "./buildFlow";
import { terminalSide } from "./sides";

const NODE_W = 210;
const NODE_H = 120;
const JUNCTION_SIZE = 22;

function sizeOf(node: WiringNode): { width: number; height: number } {
  if (node.type === "junction") {
    return { width: JUNCTION_SIZE, height: JUNCTION_SIZE };
  }
  if (node.type === "cableBreakout") {
    return { width: 34, height: 34 };
  }
  const c = node.data?.component;
  if (!c) return { width: NODE_W, height: NODE_H };

  // Estimate real rendered size so dagre spaces nodes without overlap.
  const total = c.terminals.length;
  const leftLabels: number[] = [];
  const rightLabels: number[] = [];
  c.terminals.forEach((t, i) => {
    const len = (t.label ?? t.id).length;
    if (terminalSide(t, c.type, i, total) === "left") leftLabels.push(len);
    else rightLabels.push(len);
  });
  const rows = Math.max(leftLabels.length, rightLabels.length, 1);
  const isSplice = c.type === "splice";

  const height = (isSplice ? 30 : 38 + 26) + rows * 24 + 20;
  const leftMax = leftLabels.length ? Math.max(...leftLabels) : 0;
  const rightMax = rightLabels.length ? Math.max(...rightLabels) : 0;
  const termWidth = (leftMax + rightMax) * 6.8 + 64;
  const headerWidth = c.label.length * 7 + 48;
  const width = Math.min(
    320,
    Math.max(184, Math.round(Math.max(termWidth, headerWidth))),
  );
  return { width, height };
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
  g.setGraph({
    rankdir: "LR",
    nodesep: 50,
    ranksep: 150,
    marginx: 28,
    marginy: 28,
    ranker: "network-simplex",
  });
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
    // Carry the estimated size as initialWidth/initialHeight. React Flow measures
    // real dimensions into its internal store, but because WiringCanvas rebuilds
    // fresh node objects each tick, the minimap (which reads userNode dimensions)
    // never sees them. initialWidth/initialHeight give it a fallback without pinning
    // the rendered node size the way width/height would.
    const { width, height } = sizeOf(node);
    if (node.data?.fixedPosition) {
      return { ...node, initialWidth: width, initialHeight: height };
    }
    const placed = g.node(node.id);
    if (!placed) return { ...node, initialWidth: width, initialHeight: height };
    return {
      ...node,
      initialWidth: width,
      initialHeight: height,
      position: {
        x: placed.x - placed.width / 2,
        y: placed.y - placed.height / 2,
      },
    };
  });
}
