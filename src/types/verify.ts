export type Severity = "pass" | "fail" | "warn";

export interface RuleResult {
  id: string;
  title: string;
  severity: Severity;
  message: string;
  /** component ids and/or "compId.termId" refs to highlight on the canvas */
  refs?: string[];
}
