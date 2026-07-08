"use client";

import dynamic from "next/dynamic";

// React Flow measures the DOM and touches `window`, so the whole interactive
// tree must be client-only. Next forbids `ssr: false` in a Server Component,
// hence this small client wrapper.
const WiringApp = dynamic(
  () => import("./WiringApp").then((m) => m.WiringApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-400">
        Loading wiring diagram…
      </div>
    ),
  },
);

export function WiringAppLoader() {
  return <WiringApp />;
}
