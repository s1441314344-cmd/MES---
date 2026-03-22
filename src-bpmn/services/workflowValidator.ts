import type { WorkflowNode, WorkflowEdge, ValidationError } from '../types/bpmn';

export class WorkflowValidator {
  static validate(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
    const errors: ValidationError[] = [];

    errors.push(...this.validateStartEndEvents(nodes));
    errors.push(...this.validateNodeConnections(nodes, edges));
    errors.push(...this.validateCyclicDependencies(nodes, edges));
    errors.push(...this.validateGatewayConnections(nodes, edges));

    return errors;
  }

  private static validateStartEndEvents(nodes: WorkflowNode[]): ValidationError[] {
    const errors: ValidationError[] = [];

    const startEvents = nodes.filter(n => n.type === 'startEvent');
    const endEvents = nodes.filter(n => n.type === 'endEvent');

    if (startEvents.length === 0) {
      errors.push({
        message: '流程缺少开始事件',
        type: 'error'
      });
    }

    if (startEvents.length > 1) {
      startEvents.forEach(node => {
        errors.push({
          nodeId: node.id,
          message: '流程只能有一个开始事件',
          type: 'error'
        });
      });
    }

    if (endEvents.length === 0) {
      errors.push({
        message: '流程缺少结束事件',
        type: 'error'
      });
    }

    return errors;
  }

  private static validateNodeConnections(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
    const errors: ValidationError[] = [];

    const nodeIds = new Set(nodes.map(n => n.id));

    nodes.forEach(node => {
      const incomingEdges = edges.filter(e => e.target === node.id);
      const outgoingEdges = edges.filter(e => e.source === node.id);

      if (node.type !== 'startEvent' && incomingEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          message: `节点 "${node.data.name}" 没有输入连接`,
          type: 'warning'
        });
      }

      if (node.type !== 'endEvent' && outgoingEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          message: `节点 "${node.data.name}" 没有输出连接`,
          type: 'warning'
        });
      }
    });

    edges.forEach(edge => {
      if (!nodeIds.has(edge.source)) {
        errors.push({
          edgeId: edge.id,
          message: `源节点 ${edge.source} 不存在`,
          type: 'error'
        });
      }

      if (!nodeIds.has(edge.target)) {
        errors.push({
          edgeId: edge.id,
          message: `目标节点 ${edge.target} 不存在`,
          type: 'error'
        });
      }
    });

    return errors;
  }

  private static validateCyclicDependencies(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const visit = (nodeId: string): boolean => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        const outgoingEdges = edges.filter(e => e.source === nodeId);
        for (const edge of outgoingEdges) {
          if (!visited.has(edge.target)) {
            if (visit(edge.target)) {
              return true;
            }
          } else if (recursionStack.has(edge.target)) {
            errors.push({
              edgeId: edge.id,
              message: '检测到循环依赖',
              type: 'error'
            });
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    });

    return errors;
  }

  private static validateGatewayConnections(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
    const errors: ValidationError[] = [];

    const gatewayNodes = nodes.filter(n => 
      n.type === 'exclusiveGateway' || 
      n.type === 'parallelGateway' || 
      n.type === 'inclusiveGateway'
    );

    gatewayNodes.forEach(node => {
      const incomingEdges = edges.filter(e => e.target === node.id);
      const outgoingEdges = edges.filter(e => e.source === node.id);

      if (node.type === 'parallelGateway') {
        if (incomingEdges.length > 1 && outgoingEdges.length > 1) {
          errors.push({
            nodeId: node.id,
            message: '并行网关不能同时作为分支和汇聚点',
            type: 'warning'
          });
        }
      }

      if (node.type === 'exclusiveGateway' && outgoingEdges.length > 0) {
        const hasConditions = outgoingEdges.every(e => e.data?.condition);
        if (!hasConditions && outgoingEdges.length > 1) {
          errors.push({
            nodeId: node.id,
            message: '独占网关的多个输出分支需要设置条件',
            type: 'warning'
          });
        }
      }
    });

    return errors;
  }
}
