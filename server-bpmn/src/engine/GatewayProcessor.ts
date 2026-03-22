import type { WorkflowNode, WorkflowEdge } from '../../src-bpmn/types/bpmn';

export class GatewayProcessor {
  static processExclusiveGateway(
    node: WorkflowNode,
    outgoingEdges: WorkflowEdge[],
    variables: Record<string, any>
  ): string | null {
    for (const edge of outgoingEdges) {
      const condition = edge.data?.condition;
      if (condition) {
        try {
          if (this.evaluateCondition(condition, variables)) {
            return edge.target;
          }
        } catch (e) {
          console.error('Condition evaluation failed:', e);
        }
      } else {
        return edge.target;
      }
    }
    return null;
  }

  static processParallelGateway(
    node: WorkflowNode,
    outgoingEdges: WorkflowEdge[],
    incomingEdges: WorkflowEdge[],
    activeTokens: number
  ): { isFork: boolean; targets: string[] } {
    const isFork = incomingEdges.length <= 1;
    
    if (isFork) {
      return {
        isFork: true,
        targets: outgoingEdges.map(e => e.target)
      };
    } else {
      const isJoinComplete = activeTokens >= incomingEdges.length;
      return {
        isFork: false,
        targets: isJoinComplete ? outgoingEdges.map(e => e.target) : []
      };
    }
  }

  static processInclusiveGateway(
    node: WorkflowNode,
    outgoingEdges: WorkflowEdge[],
    variables: Record<string, any>
  ): string[] {
    const targets: string[] = [];
    
    for (const edge of outgoingEdges) {
      const condition = edge.data?.condition;
      if (!condition || this.evaluateCondition(condition, variables)) {
        targets.push(edge.target);
      }
    }
    
    return targets;
  }

  private static evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      const func = new Function(...Object.keys(variables), `return ${condition};`);
      return func(...Object.values(variables));
    } catch (e) {
      console.error('Condition evaluation error:', e);
      return false;
    }
  }
}
