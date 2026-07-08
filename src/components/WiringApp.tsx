"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useMemo, useState } from "react";
import { buildFlow } from "@/lib/buildFlow";
import { autoLayout } from "@/lib/layout";
import { simulate } from "@/lib/simulate";
import { verify } from "@/lib/verify";
import { useStore } from "@/state/store";
import { WiringCanvas } from "./canvas/WiringCanvas";
import { ControlPanel } from "./panels/ControlPanel";
import { RightPanel } from "./panels/RightPanel";

/** A slim full-height rail shown in place of a collapsed sidebar. */
function CollapsedRail({
  side,
  label,
  onExpand,
}: {
  side: "left" | "right";
  label: string;
  onExpand: () => void;
}) {
  return (
    <div
      className={`flex h-screen flex-col items-center gap-3 bg-slate-900 py-3 ${
        side === "left" ? "border-r" : "border-l"
      } border-slate-700`}
    >
      <button
        type="button"
        onClick={onExpand}
        title={`Expand ${label}`}
        aria-label={`Expand ${label}`}
        className="rounded border border-slate-700 bg-slate-800 px-1.5 py-1 text-slate-300 hover:bg-slate-700"
      >
        {side === "left" ? "»" : "«"}
      </button>
      <span
        className="text-[10px] uppercase tracking-wide text-slate-500"
        style={{ writingMode: "vertical-rl" }}
      >
        {label}
      </span>
    </div>
  );
}

/** A small chevron pinned to a panel's inner edge that collapses it. */
function CollapseButton({
  side,
  label,
  onCollapse,
}: {
  side: "left" | "right";
  label: string;
  onCollapse: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCollapse}
      title={`Collapse ${label}`}
      aria-label={`Collapse ${label}`}
      className={`absolute top-1/2 z-10 -translate-y-1/2 rounded border border-slate-700 bg-slate-800/90 px-1.5 py-1 text-slate-300 shadow hover:bg-slate-700 ${
        side === "left" ? "right-1" : "left-1"
      }`}
    >
      {side === "left" ? "«" : "»"}
    </button>
  );
}

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

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const gridTemplateColumns = `${leftOpen ? "300px" : "2.5rem"} minmax(0,1fr) ${
    rightOpen ? "390px" : "2.5rem"
  }`;

  return (
    <main
      className="grid h-screen w-screen overflow-hidden bg-slate-900 text-slate-100"
      style={{ gridTemplateColumns }}
    >
      {leftOpen ? (
        <div className="relative min-w-0">
          <ControlPanel rules={rules} />
          <CollapseButton
            side="left"
            label="controls"
            onCollapse={() => setLeftOpen(false)}
          />
        </div>
      ) : (
        <CollapsedRail
          side="left"
          label="Controls"
          onExpand={() => setLeftOpen(true)}
        />
      )}
      <div className="relative h-screen min-w-0">
        <ReactFlowProvider>
          <WiringCanvas nodes={nodes} edges={flow.edges} sim={sim} />
        </ReactFlowProvider>
      </div>
      {rightOpen ? (
        <div className="relative min-w-0">
          <RightPanel rules={rules} />
          <CollapseButton
            side="right"
            label="panel"
            onCollapse={() => setRightOpen(false)}
          />
        </div>
      ) : (
        <CollapsedRail
          side="right"
          label="Wiring · Checks"
          onExpand={() => setRightOpen(true)}
        />
      )}
    </main>
  );
}
