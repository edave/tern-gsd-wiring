import type { NodeProps } from "@xyflow/react";
import type { WiringNode } from "@/lib/buildFlow";
import { terminalSide } from "@/lib/sides";
import type { Terminal } from "@/types/dsl";
import { TerminalDot } from "./BaseNode";

/**
 * A permanent wire joint (solder/crimp + heat-shrink) — electrically one node.
 * Rendered with a dashed amber outline to distinguish it from mateable connectors.
 * Terminals are split evenly left/right since a splice has no real in/out direction.
 */
export function SpliceNode({ data }: NodeProps<WiringNode>) {
  const c = data.component;
  if (!c) return null;
  const sim = data.sim;

  const active = (t: Terminal): boolean =>
    Boolean(
      sim?.poweredTerminals.has(t.id) ||
        sim?.groundedTerminals.has(t.id) ||
        (t.signal && sim?.activeSignals.includes(t.signal)),
    );

  const total = c.terminals.length;
  const left = c.terminals.filter(
    (t, i) => terminalSide(t, c.type, i, total) === "left",
  );
  const right = c.terminals.filter(
    (t, i) => terminalSide(t, c.type, i, total) === "right",
  );
  const live =
    (sim?.poweredTerminals.size ?? 0) > 0 ||
    (sim?.groundedTerminals.size ?? 0) > 0;

  return (
    <div
      title={c.label}
      className={`min-w-[150px] rounded-lg border-2 border-dashed bg-slate-800/95 px-2.5 py-2 shadow-lg ${
        data.highlighted
          ? "border-amber-400 ring-2 ring-amber-400/60"
          : "border-amber-600/70"
      }`}
      style={live ? { boxShadow: "0 0 16px 1px rgba(253,224,71,0.35)" } : undefined}
    >
      <div className="mb-1.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">
        <span>🔗</span>
        <span>{c.label}</span>
        <span className="rounded bg-amber-500/15 px-1 text-[9px] text-amber-200/90">
          {c.terminals.length}-way
        </span>
      </div>
      <div className="flex justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          {left.map((t) => (
            <TerminalDot key={t.id} terminal={t} side="left" active={active(t)} />
          ))}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {right.map((t) => (
            <TerminalDot key={t.id} terminal={t} side="right" active={active(t)} />
          ))}
        </div>
      </div>
    </div>
  );
}
