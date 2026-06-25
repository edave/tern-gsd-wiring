import { describe, expect, it } from "vitest";
import asBuilt from "@/data/as-built";
import supernovaM99 from "@/data/supernova-m99";
import ternStock from "@/data/tern-stock";
import { parseNetlist } from "@/lib/dsl/parse";
import { verify } from "@/lib/verify";
import type { Netlist } from "@/types/dsl";
import type { RuleResult } from "@/types/verify";

function load(yaml: string): Netlist {
  const r = parseNetlist(yaml);
  if (!r.ok) throw new Error(`parse failed: ${JSON.stringify(r.issues)}`);
  return r.netlist;
}

const rule = (results: RuleResult[], id: string): RuleResult => {
  const r = results.find((x) => x.id === id);
  if (!r) throw new Error(`no rule ${id}`);
  return r;
};

describe("verify", () => {
  it("stock wiring has zero failures and passes the power budget", () => {
    const results = verify(load(ternStock));
    expect(results.filter((r) => r.severity === "fail")).toEqual([]);
    expect(rule(results, "power-budget").severity).toBe("pass");
    expect(rule(results, "signal-HIGHBEAM-reaches").severity).toBe("pass");
    expect(rule(results, "signal-BRAKE-either").severity).toBe("pass");
  });

  it("supernova swap warns on power budget but keeps all functional checks passing", () => {
    const results = verify(load(supernovaM99));
    expect(rule(results, "power-budget").severity).toBe("warn");
    expect(results.filter((r) => r.severity === "fail")).toEqual([]);
  });

  it("detects a direct 12V <-> GND short", () => {
    const n = load(ternStock);
    n.nets.find((x) => x.id === "n_front_12v")?.members.push("motor.gnd");
    expect(rule(verify(n), "no-short").severity).toBe("fail");
  });

  it("fails the either-lever check when one lever is disconnected", () => {
    const n = load(ternStock);
    const net = n.nets.find((x) => x.id === "n_brake_levers");
    if (!net) throw new Error("missing net");
    net.members = net.members.filter((m) => m !== "brakeR.b");
    expect(rule(verify(n), "signal-BRAKE-either").severity).toBe("fail");
  });

  it("as-built spliced harness passes (lights powered through splices, brake OR via 3-way splice)", () => {
    const results = verify(load(asBuilt));
    expect(results.filter((r) => r.severity === "fail")).toEqual([]);
    expect(rule(results, "signal-BRAKE-either").severity).toBe("pass");
  });
});
