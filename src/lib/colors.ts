import type { TerminalRole } from "@/types/dsl";

/** Human wire-color name -> CSS stroke. Unknown names pass through (allows raw hex). */
const WIRE_COLORS: Record<string, string> = {
  red: "#ef4444",
  black: "#4b5563", // near-black rendered as dark gray so it reads on a dark canvas
  yellow: "#eab308",
  green: "#22c55e",
  teal: "#14b8a6",
  blue: "#3b82f6",
  orange: "#f97316",
  white: "#e5e7eb",
  gray: "#9ca3af",
  grey: "#9ca3af",
  brown: "#b45309",
  purple: "#a855f7",
  pink: "#ec4899",
};

export function wireColor(name?: string): string {
  if (!name) return "#9ca3af";
  return WIRE_COLORS[name.toLowerCase()] ?? name;
}

/** Fallback color for a terminal handle dot, derived from its electrical role. */
const ROLE_COLORS: Record<TerminalRole, string> = {
  pos: "#ef4444",
  gnd: "#4b5563",
  "signal-in": "#eab308",
  "signal-out": "#eab308",
  passthrough: "#3b82f6",
};

export function roleColor(role: TerminalRole): string {
  return ROLE_COLORS[role];
}

/** Glow color used to indicate an energized wire / lit component. */
export const ENERGIZED = "#fde047";
