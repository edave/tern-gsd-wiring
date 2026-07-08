import { describe, expect, it } from "vitest";
import ternStock from "@/data/tern-stock";
import { JUNCTION_PREFIX, buildFlow } from "@/lib/buildFlow";
import { parseNetlist } from "@/lib/dsl/parse";
import type { Netlist } from "@/types/dsl";

function load(yaml: string): Netlist {
  const r = parseNetlist(yaml);
  if (!r.ok) throw new Error(`parse failed: ${JSON.stringify(r.issues)}`);
  return r.netlist;
}

describe("buildFlow", () => {
  it("creates one node per component plus a junction for each 3+ member net", () => {
    const nl = load(ternStock);
    const { nodes } = buildFlow(nl);

    const componentNodes = nodes.filter(
      (n) => !n.id.startsWith(JUNCTION_PREFIX),
    );
    expect(componentNodes).toHaveLength(nl.components.length);

    const junctions = nodes
      .filter((n) => n.id.startsWith(JUNCTION_PREFIX))
      .map((n) => n.id)
      .sort();
    // n_12v (3), n_gnd (4), n_brake_levers (3) are the multi-point nets
    expect(junctions).toEqual(
      [
        `${JUNCTION_PREFIX}n_front_12v`,
        `${JUNCTION_PREFIX}n_gnd`,
        `${JUNCTION_PREFIX}n_brake_levers`,
      ].sort(),
    );
  });

  it("a 2-member net is one direct edge; a 3-member net is a star of edges", () => {
    const { edges } = buildFlow(load(ternStock));
    expect(edges.filter((e) => e.data?.netId === "n_hb")).toHaveLength(1);
    expect(edges.filter((e) => e.data?.netId === "n_front_12v")).toHaveLength(3);
  });

  it("every edge endpoint references an existing node", () => {
    const { nodes, edges } = buildFlow(load(ternStock));
    const ids = new Set(nodes.map((n) => n.id));
    for (const e of edges) {
      expect(ids.has(e.source)).toBe(true);
      expect(ids.has(e.target)).toBe(true);
    }
  });
});
