import type { Component, Net, Netlist, Terminal } from "@/types/dsl";

/** A fully resolved "componentId.terminalId" reference. */
export interface ResolvedRef {
  ref: string;
  componentId: string;
  terminalId: string;
  component: Component;
  terminal: Terminal;
}

/** Pre-computed lookups over a netlist, built once per parse. */
export interface NetlistIndex {
  netlist: Netlist;
  componentById: Map<string, Component>;
  /** "compId.termId" -> resolved ref */
  terminalByRef: Map<string, ResolvedRef>;
  /** netId -> net */
  netById: Map<string, Net>;
  /** "compId.termId" -> ids of nets that include it */
  netsByMember: Map<string, string[]>;
  /** every terminal ref that appears in at least one net */
  connectedRefs: Set<string>;
}

export function refOf(componentId: string, terminalId: string): string {
  return `${componentId}.${terminalId}`;
}

export function parseRef(ref: string): {
  componentId: string;
  terminalId: string;
} {
  const dot = ref.indexOf(".");
  return { componentId: ref.slice(0, dot), terminalId: ref.slice(dot + 1) };
}

export function buildIndex(netlist: Netlist): NetlistIndex {
  const componentById = new Map<string, Component>();
  const terminalByRef = new Map<string, ResolvedRef>();
  for (const component of netlist.components) {
    componentById.set(component.id, component);
    for (const terminal of component.terminals) {
      const ref = refOf(component.id, terminal.id);
      terminalByRef.set(ref, {
        ref,
        componentId: component.id,
        terminalId: terminal.id,
        component,
        terminal,
      });
    }
  }

  const netById = new Map<string, Net>();
  const netsByMember = new Map<string, string[]>();
  const connectedRefs = new Set<string>();
  for (const net of netlist.nets) {
    netById.set(net.id, net);
    for (const member of net.members) {
      connectedRefs.add(member);
      const list = netsByMember.get(member);
      if (list) list.push(net.id);
      else netsByMember.set(member, [net.id]);
    }
  }

  return {
    netlist,
    componentById,
    terminalByRef,
    netById,
    netsByMember,
    connectedRefs,
  };
}
