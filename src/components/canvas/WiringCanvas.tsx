"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useMemo } from "react";
import type { WiringEdge, WiringNode } from "@/lib/buildFlow";
import { useStore } from "@/state/store";
import type { SimResult } from "@/types/sim";
import { edgeTypes } from "./edges/CableEdge";
import { nodeTypes } from "./nodeTypes";

interface Props {
  nodes: WiringNode[];
  edges: WiringEdge[];
  sim: SimResult | null;
}

/**
 * Renders the diagram and merges the live simulation into node/edge styling each
 * tick. Layout-bearing `nodes` are memoized upstream; here we only attach sim state.
 */
export function WiringCanvas({ nodes: baseNodes, edges: baseEdges, sim }: Props) {
  const highlightRefs = useStore((s) => s.highlightRefs);
  const highlightSet = useMemo(() => new Set(highlightRefs), [highlightRefs]);

  // Re-fit the view when a preset is loaded/reset — the graph size can change a lot.
  const epoch = useStore((s) => s.epoch);
  const { fitView } = useReactFlow();
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      fitView({ padding: 0.2, duration: 300 }),
    );
    return () => cancelAnimationFrame(id);
  }, [epoch, fitView]);

  const nodes = useMemo<WiringNode[]>(
    () =>
      baseNodes.map((n) => {
        const compId = n.data.component?.id;
        const highlighted = compId
          ? highlightSet.has(compId) ||
            [...highlightSet].some((r) => r.startsWith(`${compId}.`))
          : false;
        const energized = n.data.netId
          ? (sim?.energizedNets.has(n.data.netId) ?? false)
          : n.data.netIds
            ? n.data.netIds.some((id) => sim?.energizedNets.has(id) ?? false)
            : undefined;
        return {
          ...n,
          data: {
            ...n.data,
            sim: compId ? sim?.components[compId] : undefined,
            energized,
            highlighted,
          },
        };
      }),
    [baseNodes, sim, highlightSet],
  );

  const edges = useMemo<WiringEdge[]>(
    () =>
      baseEdges.map((e) => {
        const color = e.data?.color ?? "#9ca3af";
        const netIds = e.data?.netIds ?? (e.data?.netId ? [e.data.netId] : []);
        const energized = netIds.some(
          (id) => sim?.energizedNets.has(id) ?? false,
        );
        // Cable trunks style themselves (thick sheath) via the custom edge; only
        // pass through the energized flag so they can brighten.
        if (e.type === "cable" && e.data) {
          return { ...e, animated: energized, data: { ...e.data, energized } };
        }
        return {
          ...e,
          animated: energized,
          style: {
            stroke: color,
            strokeWidth: energized ? 3.5 : 2.2,
            opacity: energized ? 1 : 0.62,
          },
        };
      }),
    [baseEdges, sim],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.25}
      maxZoom={2}
      nodesConnectable={false}
      nodesDraggable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#334155" />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n) =>
          n.type === "junction" || n.type === "cableBreakout"
            ? "#64748b"
            : "#1e293b"
        }
        nodeStrokeColor="#475569"
        maskColor="rgba(15,23,42,0.72)"
      />
    </ReactFlow>
  );
}
