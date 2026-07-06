import type { NodeTypes } from "@xyflow/react";
import { CableBreakoutNode } from "./nodes/CableBreakoutNode";
import { ConnectorNode } from "./nodes/ConnectorNode";
import { JunctionNode } from "./nodes/JunctionNode";
import { LightNode } from "./nodes/LightNode";
import { LoadNode } from "./nodes/LoadNode";
import { SourceNode } from "./nodes/SourceNode";
import { SpliceNode } from "./nodes/SpliceNode";
import { SwitchNode } from "./nodes/SwitchNode";

export const nodeTypes: NodeTypes = {
  source: SourceNode,
  switch: SwitchNode,
  light: LightNode,
  connector: ConnectorNode,
  junction: JunctionNode,
  splice: SpliceNode,
  load: LoadNode,
  cableBreakout: CableBreakoutNode,
};
