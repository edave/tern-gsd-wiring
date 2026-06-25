import { describe, expect, it } from "vitest";
import asBuilt from "@/data/as-built";
import ternStock from "@/data/tern-stock";
import { parseNetlist } from "@/lib/dsl/parse";
import { simulate } from "@/lib/simulate";
import type { Netlist } from "@/types/dsl";

function load(yaml: string): Netlist {
  const r = parseNetlist(yaml);
  if (!r.ok) throw new Error(`parse failed: ${JSON.stringify(r.issues)}`);
  return r.netlist;
}

const stock = load(ternStock);

describe("simulate", () => {
  it("everything is off when the master switch is off", () => {
    const sim = simulate(stock, {}, false);
    expect(sim.components.frontLight.on).toBe(false);
    expect(sim.components.tailLight.on).toBe(false);
    expect(sim.energizedNets.size).toBe(0);
  });

  it("master on powers the front light (port A) and the tail light (port F)", () => {
    const sim = simulate(stock, {}, true);
    expect(sim.components.frontLight.on).toBe(true);
    expect(sim.components.tailLight.on).toBe(true);
    expect(sim.energizedNets.has("n_front_12v")).toBe(true);
    expect(sim.energizedNets.has("n_rear_12v")).toBe(true);
  });

  it("high beam asserts and reaches the front light only when closed", () => {
    const off = simulate(stock, {}, true);
    expect(off.components.frontLight.activeSignals).not.toContain("HIGHBEAM");

    const on = simulate(stock, { highbeam: true }, true);
    expect(on.assertedSignals.has("HIGHBEAM")).toBe(true);
    expect(on.components.frontLight.activeSignals).toContain("HIGHBEAM");
  });

  it("either brake lever alone triggers the tail brake light (parallel OR)", () => {
    const left = simulate(stock, { brakeL: true }, true);
    expect(left.components.tailLight.activeSignals).toContain("BRAKE");

    const right = simulate(stock, { brakeR: true }, true);
    expect(right.components.tailLight.activeSignals).toContain("BRAKE");
  });

  it("brake does not assert when the system is off", () => {
    const sim = simulate(stock, { brakeL: true }, false);
    expect(sim.assertedSignals.has("BRAKE")).toBe(false);
    expect(sim.components.tailLight.activeSignals).not.toContain("BRAKE");
  });

  it("breaking the tail's ground connection turns the tail light off (front unaffected)", () => {
    const broken = structuredClone(stock);
    const net = broken.nets.find((n) => n.id === "n_gnd");
    if (!net) throw new Error("missing net");
    net.members = net.members.filter((m) => m !== "tailLight.gnd_in");

    const sim = simulate(broken, {}, true);
    expect(sim.components.tailLight.on).toBe(false);
    expect(sim.components.frontLight.on).toBe(true);
  });

  it("as-built: tail powers via the daisy-chain splice; either lever triggers brake via the 3-way splice", () => {
    const ab = load(asBuilt);

    const on = simulate(ab, {}, true);
    expect(on.components.frontLight.on).toBe(true);
    expect(on.components.tailLight.on).toBe(true);

    expect(simulate(ab, { brakeL: true }, true).components.tailLight.activeSignals).toContain("BRAKE");
    expect(simulate(ab, { brakeR: true }, true).components.tailLight.activeSignals).toContain("BRAKE");
  });
});
