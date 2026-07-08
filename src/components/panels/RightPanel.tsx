"use client";

import { type ReactNode, useState } from "react";
import type { RuleResult, Severity } from "@/types/verify";
import { DslEditorPanel } from "./DslEditorPanel";
import { ReferencePanel } from "./ReferencePanel";
import { VerifyPanel } from "./VerifyPanel";

type Tab = "checks" | "dsl" | "photos";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-800 text-slate-100"
          : "text-slate-400 hover:bg-slate-800/50"
      }`}
    >
      {children}
    </button>
  );
}

const badgeTone: Record<Severity, string> = {
  pass: "bg-emerald-500/20 text-emerald-300",
  fail: "bg-rose-500/20 text-rose-300",
  warn: "bg-amber-500/20 text-amber-300",
};

function Badge({ tone, children }: { tone: Severity; children: ReactNode }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badgeTone[tone]}`}
    >
      {children}
    </span>
  );
}

export function RightPanel({ rules }: { rules: RuleResult[] }) {
  const [tab, setTab] = useState<Tab>("checks");
  const fails = rules.filter((r) => r.severity === "fail").length;
  const warns = rules.filter((r) => r.severity === "warn").length;

  return (
    <aside className="flex h-screen flex-col border-l border-slate-700 bg-slate-900">
      <div className="flex border-b border-slate-700">
        <TabButton active={tab === "checks"} onClick={() => setTab("checks")}>
          Checks
          {fails > 0 ? (
            <Badge tone="fail">{fails}</Badge>
          ) : warns > 0 ? (
            <Badge tone="warn">{warns}</Badge>
          ) : (
            <Badge tone="pass">✓</Badge>
          )}
        </TabButton>
        <TabButton active={tab === "dsl"} onClick={() => setTab("dsl")}>
          Wiring DSL
        </TabButton>
        <TabButton active={tab === "photos"} onClick={() => setTab("photos")}>
          Photos
        </TabButton>
      </div>
      <div className="min-h-0 flex-1">
        {tab === "checks" ? (
          <VerifyPanel rules={rules} />
        ) : tab === "dsl" ? (
          <DslEditorPanel />
        ) : (
          <ReferencePanel />
        )}
      </div>
    </aside>
  );
}
