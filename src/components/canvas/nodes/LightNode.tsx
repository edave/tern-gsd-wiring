import type { NodeProps } from "@xyflow/react";
import type { WiringNode } from "@/lib/buildFlow";
import { BaseNode } from "./BaseNode";

export function LightNode({ data }: NodeProps<WiringNode>) {
  const c = data.component;
  if (!c) return null;
  const on = Boolean(data.sim?.on);
  const signals = data.sim?.activeSignals ?? [];
  const mode = signals.includes("HIGHBEAM")
    ? "HIGH"
    : signals.includes("BRAKE")
      ? "BRAKE"
      : signals[0];
  const watts = c.props?.powerWatts;
  return (
    <BaseNode
      component={c}
      sim={data.sim}
      accent="#0e7490"
      badge="Light"
      highlighted={data.highlighted}
      glow={on}
      status={
        <div className="flex items-center gap-2 text-[11px]">
          <span className={`text-base leading-none ${on ? "" : "opacity-30 grayscale"}`}>
            💡
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              on ? "bg-amber-400/20 text-amber-200" : "bg-slate-600/40 text-slate-300"
            }`}
          >
            {on ? `ON${mode ? ` · ${mode}` : ""}` : "OFF"}
          </span>
          {typeof watts === "number" ? (
            <span className="text-slate-400">{watts}W</span>
          ) : null}
        </div>
      }
    />
  );
}
