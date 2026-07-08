import type { NodeProps } from "@xyflow/react";
import type { WiringNode } from "@/lib/buildFlow";
import { BaseNode } from "./BaseNode";

export function SwitchNode({ data }: NodeProps<WiringNode>) {
  const c = data.component;
  if (!c) return null;
  const closed = Boolean(data.sim?.closed);
  const control =
    typeof c.props?.controlledBy === "string" ? c.props.controlledBy : undefined;
  return (
    <BaseNode
      component={c}
      sim={data.sim}
      accent="#7c3aed"
      badge="Switch"
      highlighted={data.highlighted}
      glow={closed}
      status={
        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              closed
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-slate-600/40 text-slate-300"
            }`}
          >
            {closed ? "● CLOSED" : "○ OPEN"}
          </span>
          {control ? <span className="text-slate-400">{control}</span> : null}
        </div>
      }
    />
  );
}
