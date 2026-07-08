import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { WiringNode } from "@/lib/buildFlow";

const overlay: CSSProperties = {
  position: "absolute",
  top: "50%",
  width: 12,
  height: 12,
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
};

/**
 * The mouth of a cable sheath: the bundled trunk enters on the left and the
 * individual conductors fan out on the right toward their splices. Purely
 * visual — the simulator only sees the underlying conductor nets.
 */
export function CableBreakoutNode({ data }: NodeProps<WiringNode>) {
  const color = data.color ?? "#64748b";
  const energized = Boolean(data.energized);
  return (
    <div
      title={data.gauge ? `${data.label} · ${data.gauge}` : data.label}
      style={{ position: "relative", width: 34, height: 34 }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: "#1e293b",
          border: `2px solid ${energized ? "#fde047" : color}`,
          opacity: energized ? 1 : 0.85,
          boxShadow: energized ? "0 0 10px 2px rgba(253,224,71,0.5)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          lineHeight: 1,
        }}
      >
        {/* a small "fan-out" glyph */}
        <span style={{ color: energized ? "#fde047" : "#cbd5e1" }}>⋔</span>
      </div>
      <Handle
        type="target"
        id="in"
        position={Position.Left}
        isConnectable={false}
        style={{ ...overlay, left: 0 }}
      />
      <Handle
        type="source"
        id="out"
        position={Position.Right}
        isConnectable={false}
        style={{ ...overlay, right: 0 }}
      />
    </div>
  );
}
