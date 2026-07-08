"use client";

import { useStore } from "@/state/store";
import type { RuleResult, Severity } from "@/types/verify";

const tone: Record<Severity, string> = {
  pass: "border-emerald-500/30 bg-emerald-500/5",
  fail: "border-rose-500/40 bg-rose-500/10",
  warn: "border-amber-500/40 bg-amber-500/10",
};
const mark: Record<Severity, string> = { pass: "✓", fail: "✕", warn: "!" };
const markColor: Record<Severity, string> = {
  pass: "text-emerald-300",
  fail: "text-rose-300",
  warn: "text-amber-300",
};

export function VerifyPanel({ rules }: { rules: RuleResult[] }) {
  const setHighlightRefs = useStore((s) => s.setHighlightRefs);
  const highlightRefs = useStore((s) => s.highlightRefs);

  const pass = rules.filter((r) => r.severity === "pass").length;
  const fail = rules.filter((r) => r.severity === "fail").length;
  const warn = rules.filter((r) => r.severity === "warn").length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800 px-3 py-2 text-xs">
        <span className="text-emerald-300">{pass} pass</span>
        <span className="text-rose-300">{fail} fail</span>
        <span className="text-amber-300">{warn} warn</span>
        {highlightRefs.length > 0 ? (
          <button
            type="button"
            onClick={() => setHighlightRefs([])}
            className="ml-auto text-slate-400 underline hover:text-slate-200"
          >
            clear highlight
          </button>
        ) : null}
      </div>
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
        {rules.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setHighlightRefs(r.refs ?? [])}
              className={`w-full rounded-md border px-2.5 py-2 text-left transition-colors hover:brightness-125 ${tone[r.severity]}`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                <span className={markColor[r.severity]}>{mark[r.severity]}</span>
                <span>{r.title}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-300/90">{r.message}</p>
            </button>
          </li>
        ))}
      </ul>
      <p className="border-t border-slate-800 p-2 text-[10px] text-slate-500">
        Click a check to highlight the components involved on the diagram.
      </p>
    </div>
  );
}
