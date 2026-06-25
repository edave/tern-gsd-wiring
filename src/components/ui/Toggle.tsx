interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}

export function Toggle({ checked, onChange, label, hint }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-left transition-colors hover:bg-slate-700/60"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm">{label}</span>
        {hint ? (
          <span className="block truncate text-[10px] text-slate-400">{hint}</span>
        ) : null}
      </span>
      <span
        className={`relative h-5 w-9 flex-none rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
