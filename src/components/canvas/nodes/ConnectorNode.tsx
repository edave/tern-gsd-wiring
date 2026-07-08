import type { NodeProps } from "@xyflow/react";
import type { WiringNode } from "@/lib/buildFlow";
import { BaseNode } from "./BaseNode";

export function ConnectorNode({ data }: NodeProps<WiringNode>) {
  const c = data.component;
  if (!c) return null;
  const kind =
    typeof c.props?.connectorKind === "string" ? c.props.connectorKind : "plug";
  return (
    <BaseNode
      component={c}
      sim={data.sim}
      accent="#475569"
      badge="Connector"
      highlighted={data.highlighted}
      status={<div className="text-[11px] text-slate-400">🔌 {kind}</div>}
    />
  );
}
