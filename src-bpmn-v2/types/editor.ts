import type { NodeType, ProcessType } from '../../src-bpmn/types/bpmn';

export interface EditorNode {
  id: string;
  type: NodeType;
  order: number;
  data: EditorNodeData;
  parentId?: string;
  branchIndex?: number;
}

export interface EditorNodeData {
  name: string;
  description?: string;
  processType?: ProcessType;
  params?: Record<string, any>;
}

export interface EditorEdge {
  id: string;
  source: string;
  target: string;
  type: 'sequence' | 'conditional' | 'parallel';
}

export interface ParallelBlock {
  id: string;
  startNodeId: string;
  endNodeId: string;
  branches: string[][];
  parentBlockId?: string;
  depth: number;
}

export interface NodeTypeCategory {
  id: string;
  name: string;
  types: NodeTypeItem[];
}

export interface NodeTypeItem {
  type: NodeType;
  name: string;
  processType?: ProcessType;
  icon?: string;
  color?: string;
}
