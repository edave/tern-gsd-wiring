import asBuilt from "./as-built";
import supernovaMini3 from "./supernova-mini3";
import ternStock from "./tern-stock";

export interface Preset {
  id: string;
  label: string;
  yaml: string;
}

export const PRESETS: Preset[] = [
  { id: "tern-stock", label: "Tern GSD — Stock (Bosch)", yaml: ternStock },
  { id: "as-built", label: "As-spliced (real harness)", yaml: asBuilt },
  { id: "supernova-mini3", label: "Supernova Mini 3 Pro", yaml: supernovaMini3 },
];

export const DEFAULT_PRESET_ID = "tern-stock";

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
