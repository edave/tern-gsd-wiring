"use client";

import { PRESETS } from "@/data/presets";
import { useStore } from "@/state/store";
import type { RuleResult } from "@/types/verify";
import { Toggle } from "../ui/Toggle";
import { Legend } from "./Legend";

export function ControlPanel({ rules }: { rules: RuleResult[] }) {
  const activePresetId = useStore((s) => s.activePresetId);
  const loadPreset = useStore((s) => s.loadPreset);
  const masterOn = useStore((s) => s.masterOn);
  const setMaster = useStore((s) => s.setMaster);
  const switchState = useStore((s) => s.switchState);
  const setSwitch = useStore((s) => s.setSwitch);
  const parse = useStore((s) => s.parse);
  const lastGood = useStore((s) => s.lastGood);

  const netlist = parse.ok ? parse.netlist : lastGood;
  const switches = (netlist?.components ?? []).filter(
    (c) => c.type === "switch" && typeof c.props?.controlledBy === "string",
  );

  const fails = rules.filter((r) => r.severity === "fail").length;
  const warns = rules.filter((r) => r.severity === "warn").length;

  return (
    <aside className="flex h-screen flex-col gap-4 overflow-y-auto border-r border-slate-700 bg-slate-900 p-4">
      <div>
        <h1 className="text-base font-semibold">Tern GSD Gen2 — Wiring</h1>
        <p className="text-[11px] text-slate-400">
          Interactive lighting harness simulator
        </p>
      </div>

      <section>
        <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Configuration
        </h2>
        <div className="flex flex-col gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => loadPreset(p.id)}
              className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                activePresetId === p.id
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-200"
                  : "border-slate-700 bg-slate-800 hover:bg-slate-700/60"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Controls
        </h2>
        <div className="flex flex-col gap-1.5">
          <Toggle
            checked={masterOn}
            onChange={setMaster}
            label="System lights"
            hint="Bosch light power"
          />
          {switches.map((sw) => {
            const control = sw.props?.controlledBy as string;
            return (
              <Toggle
                key={sw.id}
                checked={Boolean(switchState[control])}
                onChange={(v) => setSwitch(control, v)}
                label={sw.label}
                hint={control}
              />
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Checks
        </h2>
        <div className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs">
          {fails > 0 ? (
            <span className="text-rose-300">✕ {fails} failing</span>
          ) : (
            <span className="text-emerald-300">✓ All checks pass</span>
          )}
          {warns > 0 ? (
            <span className="ml-2 text-amber-300">
              ! {warns} warning{warns > 1 ? "s" : ""}
            </span>
          ) : null}
          <p className="mt-1 text-[11px] text-slate-400">
            Open the Checks tab for details.
          </p>
        </div>
      </section>

      <div className="mt-auto">
        <Legend />
      </div>
    </aside>
  );
}
