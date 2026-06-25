"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useMemo } from "react";
import { buildFlow } from "@/lib/buildFlow";
import { autoLayout } from "@/lib/layout";
import { simulate } from "@/lib/simulate";
import { verify } from "@/lib/verify";
import { useStore } from "@/state/store";
import { WiringCanvas } from "./canvas/WiringCanvas";
import { ControlPanel } from "./panels/ControlPanel";
import { RightPanel } from "./panels/RightPanel";

export function WiringApp() {
  const parse = useStore((s) => s.parse);
  const lastGood = useStore((s) => s.lastGood);
  const switchState = useStore((s) => s.switchState);
  const masterOn = useStore((s) => s.masterOn);

  // Render the live parse when valid; otherwise keep the last good netlist on screen.
  const netlist = parse.ok ? parse.netlist : lastGood;

  // Structure + layout only depend on the netlist (not on toggles), so they memoize
  // independently of the per-tick simulation.
  const flow = useMemo(
    () => (netlist ? buildFlow(netlist) : { nodes: [], edges: [] }),
    [netlist],
  );
  const nodes = useMemo(() => autoLayout(flow.nodes, flow.edges), [flow]);
  const sim = useMemo(
    () => (netlist ? simulate(netlist, switchState, masterOn) : null),
    [netlist, switchState, masterOn],
  );
  const rules = useMemo(() => (netlist ? verify(netlist) : []), [netlist]);

  return (
    <main className="grid h-screen w-screen grid-cols-[300px_minmax(0,1fr)_390px] overflow-hidden bg-slate-900 text-slate-100">
      <ControlPanel rules={rules} />
      <div className="relative h-screen min-w-0">
        <ReactFlowProvider>
          <WiringCanvas nodes={nodes} edges={flow.edges} sim={sim} />
        </ReactFlowProvider>
      </div>
      <RightPanel rules={rules} />
    </main>
  );
}
