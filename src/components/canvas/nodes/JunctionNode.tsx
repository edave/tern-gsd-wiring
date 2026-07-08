import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { WiringNode } from "@/lib/buildFlow";

const overlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: 18,
  height: 18,
  transform: "none",
  background: "transparent",
  border: "none",
};

/** A splice where 3+ wires of one net meet. Purely visual — the simulator ignores it. */
export function JunctionNode({ data }: NodeProps<WiringNode>) {
  const color = data.color ?? "#64748b";
  const energized = Boolean(data.energized);
  return (
    <div title={data.label} style={{ position: "relative", width: 18, height: 18 }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 9999,
          background: color,
          border: "2px solid #0f172a",
          opacity: energized ? 1 : 0.7,
          boxShadow: energized ? `0 0 10px 2px ${color}` : "none",
        }}
      />
      <Handle type="target" id="j" position={Position.Left} isConnectable={false} style={overlay} />
      <Handle type="source" id="j" position={Position.Right} isConnectable={false} style={overlay} />
    </div>
  );
}
