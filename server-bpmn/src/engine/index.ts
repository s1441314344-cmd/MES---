import type { WorkflowNode, WorkflowEdge } from '../../src-bpmn/types/bpmn';
import type { WorkflowInstance, ExecutionEvent } from '../types';
import { TokenManager } from './TokenManager';
import { GatewayProcessor } from './GatewayProcessor';
import { TaskExecutor } from './TaskExecutor';

export type ExecutionCallback = (event: ExecutionEvent) => void;

export class WorkflowEngine {
  private tokenManager: TokenManager;
  private taskExecutor: TaskExecutor;
  private callback?: ExecutionCallback;

  constructor() {
    this.tokenManager = new TokenManager();
    this.taskExecutor = new TaskExecutor();
  }

  setCallback(callback: ExecutionCallback) {
    this.callback = callback;
  }

  async executeWorkflow(
    instance: WorkflowInstance,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<WorkflowInstance> {
    this.emitEvent({
      id: `event_${Date.now()}`,
      instanceId: instance.id,
      type: 'STARTED',
      timestamp: new Date()
    });

    const startNode = nodes.find(n => n.type === 'startEvent');
    if (!startNode) {
      return this.failInstance(instance, 'No start event found');
    }

    const token = this.tokenManager.createToken(instance.id, startNode.id);
    
    try {
      await this.processToken(instance, token, nodes, edges);
      
      const activeTokens = this.tokenManager.getActiveTokensByInstance(instance.id);
      if (activeTokens.length === 0) {
        return this.completeInstance(instance);
      }
      
      return instance;
    } catch (error) {
      return this.failInstance(instance, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async processToken(
    instance: WorkflowInstance,
    token: any,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<void> {
    const currentNode = nodes.find(n => n.id === token.currentNodeId);
    if (!currentNode) {
      throw new Error(`Node ${token.currentNodeId} not found`);
    }

    const outgoingEdges = edges.filter(e => e.source === currentNode.id);
    const incomingEdges = edges.filter(e => e.target === currentNode.id);

    switch (currentNode.type) {
      case 'startEvent':
        await this.processStartEvent(instance, token, currentNode, outgoingEdges, nodes, edges);
        break;
      
      case 'endEvent':
        await this.processEndEvent(instance, token, currentNode);
        break;
      
      case 'exclusiveGateway':
        await this.processExclusiveGateway(instance, token, currentNode, outgoingEdges, nodes, edges);
        break;
      
      case 'parallelGateway':
        await this.processParallelGateway(instance, token, currentNode, incomingEdges, outgoingEdges, nodes, edges);
        break;
      
      case 'inclusiveGateway':
        await this.processInclusiveGateway(instance, token, currentNode, outgoingEdges, nodes, edges);
        break;
      
      default:
        await this.processTask(instance, token, currentNode, outgoingEdges, nodes, edges);
        break;
    }
  }

  private async processStartEvent(
    instance: WorkflowInstance,
    token: any,
    node: WorkflowNode,
    outgoingEdges: WorkflowEdge[],
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<void> {
    if (outgoingEdges.length === 0) {
      throw new Error('Start event has no outgoing edges');
    }

    const nextEdge = outgoingEdges[0];
    this.tokenManager.moveToken(token.id, nextEdge.target);
    this.tokenManager.updateTokenStatus(token.id, 'ACTIVE');
    
    await this.processToken(instance, token, nodes, edges);
  }

  private async processEndEvent(
    instance: WorkflowInstance,
    token: any,
    node: WorkflowNode
  ): Promise<void> {
    this.tokenManager.consumeToken(token.id);
    
    this.emitEvent({
      id: `event_${Date.now()}`,
      instanceId: instance.id,
      type: 'COMPLETED',
      timestamp: new Date(),
      nodeId: node.id
    });
  }

  private async processExclusiveGateway(
    instance: WorkflowInstance,
    token: any,
    node: WorkflowNode,
    outgoingEdges: WorkflowEdge[],
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<void> {
    const targetNodeId = GatewayProcessor.processExclusiveGateway(
      node,
      outgoingEdges,
      instance.variables
    );

    if (!targetNodeId) {
      throw new Error('No valid path from exclusive gateway');
    }

    this.emitEvent({
      id: `event_${Date.now()}`,
      instanceId: instance.id,
      type: 'GATEWAY_PASSED',
      timestamp: new Date(),
      nodeId: node.id,
      details: { gatewayType: 'exclusive', selectedPath: targetNodeId }
    });

    this.tokenManager.moveToken(token.id, targetNodeId);
    await this.processToken(instance, token, nodes, edges);
  }

  private async processParallelGateway(
    instance: WorkflowInstance,
    token: any,
    node: WorkflowNode,
    incomingEdges: WorkflowEdge[],
    outgoingEdges: WorkflowEdge[],
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<void> {
    const activeTokens = this.tokenManager.getActiveTokensByInstance(instance.id);
    
    const result = GatewayProcessor.processParallelGateway(
      node,
      outgoingEdges,
      incomingEdges,
      activeTokens.length
    );

    if (result.isFork) {
      this.tokenManager.consumeToken(token.id);
      
      const newTokens = result.targets.map(targetId => {
        return this.tokenManager.createToken(instance.id, targetId);
      });

      this.emitEvent({
        id: `event_${Date.now()}`,
        instanceId: instance.id,
        type: 'GATEWAY_PASSED',
        timestamp: new Date(),
        nodeId: node.id,
        details: { gatewayType: 'parallel', fork: true, paths: result.targets.length }
      });

      for (const newToken of newTokens) {
        await this.processToken(instance, newToken, nodes, edges);
      }
    } else {
      this.tokenManager.consumeToken(token.id);
      
      const remainingActiveTokens = this.tokenManager.getActiveTokensByInstance(instance.id);
      const waitingAtNode = remainingActiveTokens.filter(t => t.currentNodeId === node.id);

      if (result.targets.length > 0) {
        waitingAtNode.forEach(t => this.tokenManager.consumeToken(t.id));
        
        const newToken = this.tokenManager.createToken(instance.id, result.targets[0]);
        
        this.emitEvent({
          id: `event_${Date.now()}`,
          instanceId: instance.id,
          type: 'GATEWAY_PASSED',
          timestamp: new Date(),
          nodeId: node.id,
          details: { gatewayType: 'parallel', fork: false, joined: true }
        });

        await this.processToken(instance, newToken, nodes, edges);
      }
    }
  }

  private async processInclusiveGateway(
    instance: WorkflowInstance,
    token: any,
    node: WorkflowNode,
    outgoingEdges: WorkflowEdge[],
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<void> {
    const targetNodeIds = GatewayProcessor.processInclusiveGateway(
      node,
      outgoingEdges,
      instance.variables
    );

    if (targetNodeIds.length === 0) {
      throw new Error('No valid paths from inclusive gateway');
    }

    this.tokenManager.consumeToken(token.id);
    
    const newTokens = targetNodeIds.map(targetId => {
      return this.tokenManager.createToken(instance.id, targetId);
    });

    this.emitEvent({
      id: `event_${Date.now()}`,
      instanceId: instance.id,
      type: 'GATEWAY_PASSED',
      timestamp: new Date(),
      nodeId: node.id,
      details: { gatewayType: 'inclusive', paths: targetNodeIds.length }
    });

    for (const newToken of newTokens) {
      await this.processToken(instance, newToken, nodes, edges);
    }
  }

  private async processTask(
    instance: WorkflowInstance,
    token: any,
    node: WorkflowNode,
    outgoingEdges: WorkflowEdge[],
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<void> {
    const result = await this.taskExecutor.executeTask(node, instance.variables);
    
    if (!result.success) {
      throw new Error(result.error || 'Task execution failed');
    }

    this.emitEvent({
      id: `event_${Date.now()}`,
      instanceId: instance.id,
      type: 'TASK_COMPLETED',
      timestamp: new Date(),
      nodeId: node.id,
      details: result.result
    });

    if (outgoingEdges.length > 0) {
      const nextEdge = outgoingEdges[0];
      this.tokenManager.moveToken(token.id, nextEdge.target);
      await this.processToken(instance, token, nodes, edges);
    }
  }

  private completeInstance(instance: WorkflowInstance): WorkflowInstance {
    instance.status = 'COMPLETED';
    instance.endTime = new Date();
    
    this.emitEvent({
      id: `event_${Date.now()}`,
      instanceId: instance.id,
      type: 'COMPLETED',
      timestamp: new Date()
    });

    return instance;
  }

  private failInstance(instance: WorkflowInstance, error: string): WorkflowInstance {
    instance.status = 'FAILED';
    instance.endTime = new Date();
    
    this.emitEvent({
      id: `event_${Date.now()}`,
      instanceId: instance.id,
      type: 'FAILED',
      timestamp: new Date(),
      details: { error }
    });

    return instance;
  }

  private emitEvent(event: ExecutionEvent) {
    if (this.callback) {
      this.callback(event);
    }
  }
}
