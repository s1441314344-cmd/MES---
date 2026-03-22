export type NodeType = 
  | 'startEvent'
  | 'endEvent'
  | 'exclusiveGateway'
  | 'parallelGateway'
  | 'inclusiveGateway'
  | 'eventGateway'
  | ProcessType;

export enum ProcessType {
  DISSOLUTION = 'dissolution',
  COMPOUNDING = 'compounding',
  FILTRATION = 'filtration',
  TRANSFER = 'transfer',
  FLAVOR_ADDITION = 'flavorAddition',
  EXTRACTION = 'extraction',
  CENTRIFUGE = 'centrifuge',
  COOLING = 'cooling',
  HOLDING = 'holding',
  MEMBRANE_FILTRATION = 'membraneFiltration',
  UHT = 'uht',
  FILLING = 'filling',
  MAGNETIC_ABSORPTION = 'magneticAbsorption',
  ASEPTIC_TANK = 'asepticTank',
  OTHER = 'other'
}

export interface Condition {
  id: string;
  expression: string;
  label: string;
}

export interface NodeData {
  name: string;
  description?: string;
  processType?: ProcessType;
  params?: Record<string, any>;
  conditions?: Condition[];
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  style?: NodeStyle;
}

export interface NodeStyle {
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export type EdgeType = 'sequence' | 'conditional';

export interface EdgeData {
  sequenceOrder?: number;
  condition?: string;
  label?: string;
}

export interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  data?: EdgeData;
  animated?: boolean;
  style?: EdgeStyle;
}

export interface Workflow {
  id: string;
  metadata: {
    name: string;
    version: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  type: 'error' | 'warning';
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  description: string;
}
