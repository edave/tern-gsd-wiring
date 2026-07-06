# Tern GSD Gen2 — Interactive Wiring Diagram

An interactive electrical wiring simulator for the **Tern GSD Gen2 (R11)** cargo e-bike's
lighting harness (Bosch Cargo Line Gen 4 / "System 2"). Built to model and **verify** swapping the
stock headlight for a **Supernova Mini 3 Pro** _before_ touching the real bike.

Render the harness as a [React Flow](https://reactflow.dev) diagram, toggle the controls
(system lights, high beam, left/right brake levers) to watch power and signals propagate and lights
illuminate, and run a verification checklist that confirms every function is correctly wired.

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm build        # production build (Turbopack)
pnpm test         # unit tests (Vitest) for the simulate/verify/buildFlow engines
pnpm exec tsc --noEmit   # typecheck
```

## How it works

The wiring is defined in a **WireViz-inspired YAML DSL** — components with named `terminals`
(each carrying an electrical `role`: `pos` / `gnd` / `signal-in` / `signal-out` / `passthrough`),
plus `nets` that join 2+ terminals. Three **pure functions** (no React) turn that into the app:

| Module | Responsibility |
| --- | --- |
| `src/lib/simulate.ts` | Floods the 12V+ and ground rails through a switch-gated conduction graph; derives which lights are on, high-beam/brake modes, and energized wires. Closure-based signal assertion keeps it correct regardless of low-/high-side brake wiring. |
| `src/lib/verify.ts` | Runs the simulator at canonical switch states and checks declarative rules (power, ground continuity, no short, signal delivery, either-lever redundancy, orphan terminals, port power budget). |
| `src/lib/buildFlow.ts` | Turns the netlist into React Flow nodes/edges; 3+ member nets become a junction node. |

The UI (`src/components`) is a thin layer: a Zustand store (`src/state/store.ts`) holds the editor
text + switch positions; everything else is derived and memoized.

## Editing the wiring

Use the in-app **Wiring DSL** tab to edit the YAML live — the diagram, simulation, and checklist
update as you type, with validation errors shown inline (the canvas keeps the last valid wiring).
Three presets live in `src/data/`: **tern-stock** (clean, per the Bosch manual), **as-built** (the
actual spliced harness from the photos), and **supernova-mini3** (the proposed swap). The **Photos**
tab shows the reference harness photos in `public/reference/` to cross-check against the real bike.

Real harnesses join wires at intermediate **connection points**, not just direct port-to-component
runs. The DSL models two kinds, each rendered as its own node: a **`connector`** is a mateable plug
you can unplug (Higo, coaxial barrel); a **`splice`** is a permanent solder/crimp joint (incl. 3-way
and larger). The `as-built` preset uses these to show how the harness is really wired — the tail
light is daisy-chained off the front-lamp feed through a 4-way splice (so it loads **port A**), and
both brake levers join at a 3-way splice before the Higo connector.

> ⚠️ The default pinouts are best-effort (Bosch System 2 light-port details and low-/high-side brake
> switching are not officially documented). Verify against your harness and edit the DSL to match.

## The drive unit

The Bosch Cargo Line Gen 4 (BDU450 CX) is modeled as a `source` with all six ports from the manual —
**A** Front lamp (12V), **B** Speed sensor (3.3V), **C** Battery (36V), **D** Display (12V),
**E** Power Port (12V), **F** Rear light (12V) — plus a common ground. Front and rear lights sit on
**separate** ports (A and F), not a single daisy-chained output.

## The Supernova check

Loading the **Supernova Mini 3 Pro** preset keeps every functional check passing but flips the
**power-budget** check to a warning — in its 21 W high-beam mode the light draws ~21W on the
**front-lamp port A**, over that port's ~17W rating (the tail light stays on the separate rear-light
port F). Per the Supernova manual the 21 W mode targets Shimano/TQ/Alber/Brose ports ≥21 W, so on
Bosch you'd run the 12 W standard high-beam mode (which fits). The Mini 3 Pro also ships with a Bosch
*Smart System* cable while the GSD Gen2 is Bosch *System 2* — a matching cable is required. That
per-port check is exactly the pre-install concern this tool surfaces.

## Stack

Next.js 16 (App Router) · React 19 · `@xyflow/react` v12 · Zustand · Zod · `yaml` ·
`@dagrejs/dagre` · Tailwind CSS v4 · Vitest.
