import type { WorkflowDefinition } from '../types';

export class WorkflowStore {
  private workflows: Map<string, WorkflowDefinition> = new Map();

  create(definition: Omit<WorkflowDefinition, 'createdAt' | 'updatedAt'>): WorkflowDefinition {
    const now = new Date();
    const workflow: WorkflowDefinition = {
      ...definition,
      createdAt: now,
      updatedAt: now
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  get(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  getAll(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  update(id: string, updates: Partial<WorkflowDefinition>): WorkflowDefinition | undefined {
    const workflow = this.workflows.get(id);
    if (workflow) {
      const updated = {
        ...workflow,
        ...updates,
        updatedAt: new Date()
      };
      this.workflows.set(id, updated);
      return updated;
    }
    return undefined;
  }

  delete(id: string): boolean {
    return this.workflows.delete(id);
  }
}
