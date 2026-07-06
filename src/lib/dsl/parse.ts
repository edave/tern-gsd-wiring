import { parse as parseYaml } from "yaml";
import type { Netlist } from "@/types/dsl";
import { NetlistSchema } from "./schema";
import { parseRef } from "./refs";

export interface ParseIssue {
  /** Human-readable location, e.g. `nets[3].members[1]`. */
  path: string;
  message: string;
}

export type ParseResult =
  | { ok: true; netlist: Netlist }
  | { ok: false; stage: "yaml" | "schema" | "semantic"; issues: ParseIssue[] };

function pathToString(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) return "(root)";
  let out = "";
  for (const seg of path) {
    if (typeof seg === "number") out += `[${seg}]`;
    else out += out ? `.${String(seg)}` : String(seg);
  }
  return out;
}

/**
 * Parse + validate the DSL in three stages (YAML -> Zod shape -> semantic refs).
 * Pure and synchronous; safe to call on every keystroke (debounced upstream).
 */
export function parseNetlist(text: string): ParseResult {
  // 1. YAML syntax
  let raw: unknown;
  try {
    raw = parseYaml(text);
  } catch (e) {
    return {
      ok: false,
      stage: "yaml",
      issues: [{ path: "(root)", message: (e as Error).message }],
    };
  }
  if (raw == null || typeof raw !== "object") {
    return {
      ok: false,
      stage: "yaml",
      issues: [{ path: "(root)", message: "Document is empty or not a mapping." }],
    };
  }

  // 2. Zod shape
  const result = NetlistSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      stage: "schema",
      issues: result.error.issues.map((i) => ({
        path: pathToString(i.path),
        message: i.message,
      })),
    };
  }
  const netlist = result.data;

  // 3. Semantic: unique ids + resolvable refs
  const issues: ParseIssue[] = [];

  const compById = new Map<string, (typeof netlist.components)[number]>();
  netlist.components.forEach((c, ci) => {
    if (compById.has(c.id)) {
      issues.push({
        path: `components[${ci}].id`,
        message: `duplicate component id "${c.id}"`,
      });
    }
    compById.set(c.id, c);
    const seenTerm = new Set<string>();
    c.terminals.forEach((t, ti) => {
      if (seenTerm.has(t.id)) {
        issues.push({
          path: `components[${ci}].terminals[${ti}].id`,
          message: `duplicate terminal "${t.id}" in component "${c.id}"`,
        });
      }
      seenTerm.add(t.id);
    });
  });

  const seenNet = new Set<string>();
  const netById = new Map<string, (typeof netlist.nets)[number]>();
  netlist.nets.forEach((n, ni) => {
    if (seenNet.has(n.id)) {
      issues.push({ path: `nets[${ni}].id`, message: `duplicate net id "${n.id}"` });
    }
    seenNet.add(n.id);
    netById.set(n.id, n);
    n.members.forEach((m, mi) => {
      const { componentId, terminalId } = parseRef(m);
      const comp = compById.get(componentId);
      if (!comp) {
        issues.push({
          path: `nets[${ni}].members[${mi}]`,
          message: `net "${n.id}" references unknown component "${componentId}"`,
        });
      } else if (!comp.terminals.some((t) => t.id === terminalId)) {
        issues.push({
          path: `nets[${ni}].members[${mi}]`,
          message: `component "${componentId}" has no terminal "${terminalId}"`,
        });
      }
    });
  });

  const seenCable = new Set<string>();
  netlist.cables.forEach((c, ci) => {
    if (seenCable.has(c.id)) {
      issues.push({
        path: `cables[${ci}].id`,
        message: `duplicate cable id "${c.id}"`,
      });
    }
    seenCable.add(c.id);
    c.conductors.forEach((netId, wi) => {
      const net = netById.get(netId);
      if (!net) {
        issues.push({
          path: `cables[${ci}].conductors[${wi}]`,
          message: `cable "${c.id}" references unknown net "${netId}"`,
        });
      } else if (net.members.length !== 2) {
        issues.push({
          path: `cables[${ci}].conductors[${wi}]`,
          message: `cable conductor net "${netId}" must join exactly two terminals (has ${net.members.length})`,
        });
      }
    });
  });

  if (issues.length > 0) return { ok: false, stage: "semantic", issues };
  return { ok: true, netlist };
}
