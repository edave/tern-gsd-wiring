import asBuilt from "./as-built";
import supernovaM99 from "./supernova-m99";
import ternStock from "./tern-stock";

export interface Preset {
  id: string;
  label: string;
  yaml: string;
}

export const PRESETS: Preset[] = [
  { id: "tern-stock", label: "Tern GSD — Stock (Bosch)", yaml: ternStock },
  { id: "as-built", label: "As-built (spliced harness)", yaml: asBuilt },
  { id: "supernova-m99", label: "Supernova M99 Mini 3 Pro", yaml: supernovaM99 },
];

export const DEFAULT_PRESET_ID = "tern-stock";

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
