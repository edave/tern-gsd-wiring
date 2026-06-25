import type { NodeProps } from "@xyflow/react";
import type { WiringNode } from "@/lib/buildFlow";
import { BaseNode } from "./BaseNode";

export function LoadNode({ data }: NodeProps<WiringNode>) {
  const c = data.component;
  if (!c) return null;
  const watts = c.props?.powerWatts;
  return (
    <BaseNode
      component={c}
      sim={data.sim}
      accent="#334155"
      badge="Load"
      highlighted={data.highlighted}
      glow={Boolean(data.sim?.on)}
      status={
        <div className="text-[11px] text-slate-400">
          {typeof watts === "number" ? `${watts}W` : "load"}
        </div>
      }
    />
  );
}
