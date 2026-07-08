import { Handle, Position } from "@xyflow/react";
import type { CSSProperties, ReactNode } from "react";
import { roleColor, wireColor } from "@/lib/colors";
import { terminalSide } from "@/lib/sides";
import type { Component, Terminal } from "@/types/dsl";
import type { ComponentSimState } from "@/types/sim";

/** One terminal = a colored dot with overlapping source+target handles (edges are undirected). */
export function TerminalDot({
  terminal,
  side,
  active,
}: {
  terminal: Terminal;
  side: "left" | "right";
  active: boolean;
}) {
  const pos = side === "left" ? Position.Left : Position.Right;
  const color = terminal.color ? wireColor(terminal.color) : roleColor(terminal.role);
  const handleStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: 12,
    height: 12,
    minWidth: 12,
    minHeight: 12,
    transform: "none",
    background: color,
    borderRadius: 9999,
    border: active ? "2px solid #fde047" : "2px solid #0f172a",
    boxShadow: active ? "0 0 8px #fde047" : "none",
  };
  return (
    <div
      className={`flex items-center gap-1.5 ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      <span
        style={{
          position: "relative",
          display: "inline-block",
          width: 12,
          height: 12,
          flex: "0 0 auto",
        }}
      >
        <Handle
          type="target"
          id={terminal.id}
          position={pos}
          isConnectable={false}
          style={handleStyle}
        />
        <Handle
          type="source"
          id={terminal.id}
          position={pos}
          isConnectable={false}
          style={handleStyle}
        />
      </span>
      <span className="whitespace-nowrap text-[10px] leading-tight text-slate-300">
        {terminal.label ?? terminal.id}
      </span>
    </div>
  );
}

interface BaseNodeProps {
  component: Component;
  sim?: ComponentSimState;
  accent: string;
  badge: string;
  highlighted?: boolean;
  glow?: boolean;
  status?: ReactNode;
}

export function BaseNode({
  component,
  sim,
  accent,
  badge,
  highlighted,
  glow,
  status,
}: BaseNodeProps) {
  const total = component.terminals.length;
  const left = component.terminals.filter(
    (t, i) => terminalSide(t, component.type, i, total) === "left",
  );
  const right = component.terminals.filter(
    (t, i) => terminalSide(t, component.type, i, total) === "right",
  );
  const isActive = (t: Terminal): boolean =>
    Boolean(
      sim?.poweredTerminals.has(t.id) ||
        sim?.groundedTerminals.has(t.id) ||
        (t.signal && sim?.activeSignals.includes(t.signal)),
    );

  return (
    <div
      className={`min-w-[184px] rounded-lg border bg-slate-800/95 shadow-lg ${
        highlighted ? "border-amber-400 ring-2 ring-amber-400/60" : "border-slate-600"
      }`}
      style={glow ? { boxShadow: "0 0 22px 2px rgba(253,224,71,0.45)" } : undefined}
    >
      <div
        className="flex items-center justify-between gap-2 rounded-t-lg px-2.5 py-1.5"
        style={{ background: accent }}
      >
        <span className="text-xs font-semibold text-white drop-shadow-sm">
          {component.label}
        </span>
        <span className="rounded bg-black/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90">
          {badge}
        </span>
      </div>
      {status ? <div className="px-2.5 pt-2">{status}</div> : null}
      <div className="flex justify-between gap-4 px-2.5 pb-2.5 pt-2">
        <div className="flex flex-col gap-1.5">
          {left.map((t) => (
            <TerminalDot key={t.id} terminal={t} side="left" active={isActive(t)} />
          ))}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {right.map((t) => (
            <TerminalDot key={t.id} terminal={t} side="right" active={isActive(t)} />
          ))}
        </div>
      </div>
    </div>
  );
}
