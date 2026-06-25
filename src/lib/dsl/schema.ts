import { z } from "zod";

/**
 * The wiring DSL. A WireViz-inspired netlist: components own named `terminals`
 * (each carrying an electrical `role`), and `nets` join 2..N terminals by ref.
 *
 * Shape validation lives here (Zod). Cross-reference validation (unique ids,
 * resolvable refs) lives in `parse.ts` so we stay decoupled from Zod's issue API.
 */

/** A net member ref is of the form "componentId.terminalId". */
export const REF_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const RefSchema = z
  .string()
  .regex(REF_RE, 'must be of the form "componentId.terminalId"');

export const TerminalRoleSchema = z.enum([
  "pos", // 12V+ rail
  "gnd", // ground / 0V
  "signal-in", // control input (high-beam in, brake in)
  "signal-out", // control output (a switch's downstream side)
  "passthrough", // daisy-chain pass-through (front light -> tail light)
]);

export const ComponentTypeSchema = z.enum([
  "source", // power origin (the Bosch ~12V light port)
  "switch", // a normally-open / normally-closed contact
  "light", // an illuminating load with on/off + mode states
  "connector", // a mateable plug you can unplug (Higo, coaxial barrel)
  "junction", // an auto/visual junction joining a shared net
  "splice", // a permanent wire joint (solder/crimp + heat-shrink), e.g. a 3-way splice
  "load", // a generic resistive load (fallback)
]);

export const SwitchKindSchema = z.enum(["NO", "NC"]);

export const TerminalSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  role: TerminalRoleSchema,
  color: z.string().optional(),
  signal: z.string().optional(),
  /** optional power rating for a source output port (used by the power-budget check) */
  maxWatts: z.number().nonnegative().optional(),
});

export const ComponentPropsSchema = z
  .object({
    switchKind: SwitchKindSchema.optional(),
    controlledBy: z.string().optional(),
    brightensOnSignal: z.string().optional(),
    powerWatts: z.number().nonnegative().optional(),
    maxPortWatts: z.number().nonnegative().optional(),
    connectorKind: z.string().optional(),
    /** Terminal-id pairs internally bridged (always conducting), e.g. a light's
     *  12V/GND daisy-chain pass-through: [["pos_in","pos_out"],["gnd_in","gnd_out"]]. */
    bridges: z.array(z.tuple([z.string(), z.string()])).optional(),
  })
  .catchall(z.unknown());

export const ComponentSchema = z.object({
  id: z.string().min(1),
  type: ComponentTypeSchema,
  label: z.string().min(1),
  terminals: z.array(TerminalSchema).min(1),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  props: ComponentPropsSchema.optional(),
});

export const NetSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  color: z.string().optional(),
  signal: z.string().optional(),
  members: z.array(RefSchema).min(2, "a net needs at least two members"),
});

export const NetlistMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  bike: z.string().optional(),
  notes: z.string().optional(),
});

export const NetlistSchema = z.object({
  meta: NetlistMetaSchema,
  components: z.array(ComponentSchema).min(1),
  nets: z.array(NetSchema),
});

export type TerminalRole = z.infer<typeof TerminalRoleSchema>;
export type ComponentType = z.infer<typeof ComponentTypeSchema>;
export type SwitchKind = z.infer<typeof SwitchKindSchema>;
export type Terminal = z.infer<typeof TerminalSchema>;
export type ComponentProps = z.infer<typeof ComponentPropsSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type Net = z.infer<typeof NetSchema>;
export type NetlistMeta = z.infer<typeof NetlistMetaSchema>;
export type Netlist = z.infer<typeof NetlistSchema>;
