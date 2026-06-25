import { create } from "zustand";
import { DEFAULT_PRESET_ID, getPreset } from "@/data/presets";
import { type ParseResult, parseNetlist } from "@/lib/dsl/parse";
import type { Netlist } from "@/types/dsl";
import type { SwitchState } from "@/types/sim";

interface AppState {
  activePresetId: string;
  /** the editor buffer — the source of truth that gets parsed */
  dslText: string;
  parse: ParseResult;
  /** last successfully parsed netlist, kept on screen while an edit is mid-flight */
  lastGood: Netlist | null;
  switchState: SwitchState;
  masterOn: boolean;
  /** refs/component ids highlighted from the verify panel */
  highlightRefs: string[];
  /** bumps when a preset is loaded/reset so the editor can refresh its buffer */
  epoch: number;

  loadPreset: (id: string) => void;
  setDslText: (text: string) => void;
  setSwitch: (control: string, on: boolean) => void;
  toggleSwitch: (control: string) => void;
  setMaster: (on: boolean) => void;
  resetToPreset: () => void;
  setHighlightRefs: (refs: string[]) => void;
}

function presetState(id: string): {
  activePresetId: string;
  dslText: string;
  parse: ParseResult;
  lastGood: Netlist | null;
} {
  const preset = getPreset(id) ?? getPreset(DEFAULT_PRESET_ID)!;
  const parse = parseNetlist(preset.yaml);
  return {
    activePresetId: preset.id,
    dslText: preset.yaml,
    parse,
    lastGood: parse.ok ? parse.netlist : null,
  };
}

export const useStore = create<AppState>((set, get) => ({
  ...presetState(DEFAULT_PRESET_ID),
  switchState: {},
  masterOn: true,
  highlightRefs: [],
  epoch: 0,

  loadPreset: (id) =>
    set((s) => ({
      ...presetState(id),
      switchState: {},
      highlightRefs: [],
      epoch: s.epoch + 1,
    })),

  setDslText: (text) => {
    const parse = parseNetlist(text);
    set((s) => ({
      dslText: text,
      parse,
      lastGood: parse.ok ? parse.netlist : s.lastGood,
      highlightRefs: [],
    }));
  },

  setSwitch: (control, on) =>
    set((s) => ({ switchState: { ...s.switchState, [control]: on } })),

  toggleSwitch: (control) =>
    set((s) => ({
      switchState: { ...s.switchState, [control]: !s.switchState[control] },
    })),

  setMaster: (on) => set({ masterOn: on }),

  resetToPreset: () =>
    set((s) => ({
      ...presetState(get().activePresetId),
      highlightRefs: [],
      epoch: s.epoch + 1,
    })),

  setHighlightRefs: (refs) => set({ highlightRefs: refs }),
}));
