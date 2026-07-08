const WIRES = [
  { label: "12V+", color: "#ef4444" },
  { label: "Front lamp", color: "#3b82f6" },
  { label: "Ground", color: "#4b5563" },
  { label: "High beam", color: "#eab308" },
  { label: "Brake", color: "#22c55e" },
];

export function Legend() {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-800 p-3">
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Legend
      </h3>
      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
        {WIRES.map((w) => (
          <div key={w.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-4 rounded"
              style={{ background: w.color }}
            />
            {w.label}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-slate-500">
        Energized wires brighten and animate. Toggle controls to trace power and
        signals through the harness.
      </p>
    </div>
  );
}
