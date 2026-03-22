export type InstanceStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export type TokenStatus = 'ACTIVE' | 'WAITING' | 'CONSUMED';

export interface Token {
  id: string;
  instanceId: string;
  currentNodeId: string;
  status: TokenStatus;
  createdAt: Date;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: InstanceStatus;
  tokens: Token[];
  variables: Record<string, any>;
  startTime: Date;
  endTime?: Date;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface TaskInstance {
  id: string;
  instanceId: string;
  nodeId: string;
  status: TaskStatus;
  assignee?: string;
  startTime?: Date;
  endTime?: Date;
  result?: any;
}

export interface ExecutionEvent {
  id: string;
  instanceId: string;
  type: 'STARTED' | 'TASK_COMPLETED' | 'COMPLETED' | 'FAILED' | 'GATEWAY_PASSED';
  timestamp: Date;
  nodeId?: string;
  details?: Record<string, any>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  bpmnXml: string;
  nodes: any[];
  edges: any[];
  createdAt: Date;
  updatedAt: Date;
}

export type GatewayType = 'exclusive' | 'parallel' | 'inclusive' | 'event';
