import type { WorkflowNode } from '../../src-bpmn/types/bpmn';

export interface TaskResult {
  success: boolean;
  result?: any;
  error?: string;
}

export class TaskExecutor {
  private taskProcessors: Map<string, (node: WorkflowNode, variables: Record<string, any>) => Promise<TaskResult>> = new Map();

  constructor() {
    this.registerDefaultProcessors();
  }

  registerProcessor(
    processType: string,
    processor: (node: WorkflowNode, variables: Record<string, any>) => Promise<TaskResult>
  ) {
    this.taskProcessors.set(processType, processor);
  }

  async executeTask(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<TaskResult> {
    const processType = node.data.processType;
    
    if (processType && this.taskProcessors.has(processType)) {
      const processor = this.taskProcessors.get(processType)!;
      return await processor(node, variables);
    }
    
    return await this.defaultProcessor(node, variables);
  }

  private async defaultProcessor(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<TaskResult> {
    const duration = node.data.params?.duration || 1;
    await this.delay(duration * 500);
    
    return {
      success: true,
      result: {
        completedAt: new Date().toISOString(),
        nodeId: node.id,
        processType: node.data.processType
      }
    };
  }

  private registerDefaultProcessors() {
    const defaultProcessor = async (node: WorkflowNode, variables: Record<string, any>): Promise<TaskResult> => {
      return await this.defaultProcessor(node, variables);
    };

    this.registerProcessor('dissolution', defaultProcessor);
    this.registerProcessor('compounding', defaultProcessor);
    this.registerProcessor('filtration', defaultProcessor);
    this.registerProcessor('transfer', defaultProcessor);
    this.registerProcessor('flavorAddition', defaultProcessor);
    this.registerProcessor('extraction', defaultProcessor);
    this.registerProcessor('centrifuge', defaultProcessor);
    this.registerProcessor('cooling', defaultProcessor);
    this.registerProcessor('holding', defaultProcessor);
    this.registerProcessor('membraneFiltration', defaultProcessor);
    this.registerProcessor('uht', defaultProcessor);
    this.registerProcessor('filling', defaultProcessor);
    this.registerProcessor('magneticAbsorption', defaultProcessor);
    this.registerProcessor('asepticTank', defaultProcessor);
    this.registerProcessor('other', defaultProcessor);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
