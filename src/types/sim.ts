/** Live control/switch positions, keyed by control id (a switch's props.controlledBy). */
export type SwitchState = Record<string, boolean>;

export interface ComponentSimState {
  /** terminal ids (within this component) reached by the 12V+ rail */
  poweredTerminals: Set<string>;
  /** terminal ids reached by the ground rail */
  groundedTerminals: Set<string>;
  /** switches: currently conducting? */
  closed?: boolean;
  /** lights: illuminated (both rails present and system on)? */
  on?: boolean;
  /** lights: signals actually delivered while on (e.g. ["HIGHBEAM"] or ["BRAKE"]) */
  activeSignals: string[];
}

export interface SimResult {
  masterOn: boolean;
  /** "compId.termId" refs reached from a source's 12V+ terminal */
  poweredRefs: Set<string>;
  /** "compId.termId" refs reached from a source's ground terminal */
  groundedRefs: Set<string>;
  /** net ids to render as energized (12V live, ground return of an on-load, or asserted signal) */
  energizedNets: Set<string>;
  /** signal names currently asserted by a closed driver (e.g. "HIGHBEAM", "BRAKE") */
  assertedSignals: Set<string>;
  /** per-component derived state, keyed by component id */
  components: Record<string, ComponentSimState>;
}
