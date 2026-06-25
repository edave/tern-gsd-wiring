import type { NodeProps } from "@xyflow/react";
import type { WiringNode } from "@/lib/buildFlow";
import { BaseNode } from "./BaseNode";

export function SourceNode({ data }: NodeProps<WiringNode>) {
  const c = data.component;
  if (!c) return null;
  const live = (data.sim?.poweredTerminals.size ?? 0) > 0;
  const watts = c.props?.maxPortWatts;
  return (
    <BaseNode
      component={c}
      sim={data.sim}
      accent="#b91c1c"
      badge="Source"
      highlighted={data.highlighted}
      glow={live}
      status={
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span
            className={`inline-block h-2 w-2 rounded-full ${live ? "bg-emerald-400" : "bg-slate-500"}`}
          />
          <span>
            ⚡ {live ? "Powered" : "Off"}
            {typeof watts === "number" ? ` · ${watts}W max` : ""}
          </span>
        </div>
      }
    />
  );
}
