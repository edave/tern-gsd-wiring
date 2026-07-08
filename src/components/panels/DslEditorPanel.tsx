"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/state/store";

export function DslEditorPanel() {
  const epoch = useStore((s) => s.epoch);
  const parse = useStore((s) => s.parse);
  const setDslText = useStore((s) => s.setDslText);
  const resetToPreset = useStore((s) => s.resetToPreset);

  const [text, setText] = useState(() => useStore.getState().dslText);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh the buffer only when a preset is loaded/reset (not on our own commits).
  useEffect(() => {
    setText(useStore.getState().dslText);
  }, [epoch]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onChange = (value: string) => {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDslText(value), 300);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <span className="text-[11px] text-slate-400">
          WireViz-style YAML · edits apply live
        </span>
        <button
          type="button"
          onClick={resetToPreset}
          className="text-[11px] text-slate-400 underline hover:text-slate-200"
        >
          Reset to preset
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-200 outline-none"
      />
      <div className="max-h-44 overflow-y-auto border-t border-slate-800 p-2 text-[11px]">
        {parse.ok ? (
          <span className="text-emerald-300">✓ Valid wiring</span>
        ) : (
          <div>
            <div className="mb-1 font-semibold text-rose-300">
              ✕ {parse.stage} error{parse.issues.length > 1 ? "s" : ""}
            </div>
            <ul className="space-y-0.5">
              {parse.issues.map((iss, i) => (
                <li key={`${iss.path}-${i}`} className="text-rose-200/90">
                  <span className="text-slate-400">{iss.path}:</span> {iss.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
