import type { ComponentType, Terminal } from "@/types/dsl";

export type Side = "left" | "right";

/**
 * Which side of a node a terminal's handle sits on, to keep a clean left-to-right
 * flow (power in on the left, out on the right). An explicit `side` in the DSL wins;
 * otherwise: sources output on the right, loads take all inputs on the left, and
 * pass-through parts (switch/connector/splice) split inputs-left / outputs-right by
 * order. Order terminals input-first to get sensible defaults.
 */
export function terminalSide(
  t: Terminal,
  type: ComponentType,
  index: number,
  total: number,
): Side {
  if (t.side === "left" || t.side === "right") return t.side;
  if (type === "source") return "right";
  if (type === "light" || type === "load") return "left";
  return index < Math.ceil(total / 2) ? "left" : "right";
}
