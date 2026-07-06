import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { WiringEdge } from "@/lib/buildFlow";
import { ENERGIZED } from "@/lib/colors";

/**
 * A cable trunk drawn as a thick sheath (the bundled conductors before they fan
 * out at the breakout node). Ignores the thin per-net stroke the canvas applies
 * to ordinary wires; brightens when any conductor it carries is energized.
 */
export function CableEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<WiringEdge>) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });
  const energized = Boolean(data?.energized);
  const color = data?.color ?? "#64748b";
  return (
    <BaseEdge
      path={path}
      markerEnd={markerEnd}
      style={{
        stroke: energized ? ENERGIZED : color,
        strokeWidth: energized ? 9 : 8,
        strokeLinecap: "round",
        opacity: energized ? 0.95 : 0.7,
      }}
    />
  );
}

export const edgeTypes = { cable: CableEdge };
