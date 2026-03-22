import type { WorkflowInstance } from '../types';

export class InstanceStore {
  private instances: Map<string, WorkflowInstance> = new Map();

  create(instance: Omit<WorkflowInstance, 'endTime'>): WorkflowInstance {
    this.instances.set(instance.id, instance);
    return instance;
  }

  get(id: string): WorkflowInstance | undefined {
    return this.instances.get(id);
  }

  getAll(): WorkflowInstance[] {
    return Array.from(this.instances.values());
  }

  update(id: string, updates: Partial<WorkflowInstance>): WorkflowInstance | undefined {
    const instance = this.instances.get(id);
    if (instance) {
      const updated = {
        ...instance,
        ...updates
      };
      this.instances.set(id, updated);
      return updated;
    }
    return undefined;
  }

  delete(id: string): boolean {
    return this.instances.delete(id);
  }
}
