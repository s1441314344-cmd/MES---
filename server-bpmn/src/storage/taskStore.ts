import type { TaskInstance } from '../types';

export class TaskStore {
  private tasks: Map<string, TaskInstance> = new Map();

  create(task: Omit<TaskInstance, 'startTime' | 'endTime' | 'result'>): TaskInstance {
    const created: TaskInstance = {
      ...task,
      startTime: undefined,
      endTime: undefined,
      result: undefined
    };
    this.tasks.set(task.id, created);
    return created;
  }

  get(id: string): TaskInstance | undefined {
    return this.tasks.get(id);
  }

  getByInstance(instanceId: string): TaskInstance[] {
    return Array.from(this.tasks.values()).filter(t => t.instanceId === instanceId);
  }

  getAll(): TaskInstance[] {
    return Array.from(this.tasks.values());
  }

  update(id: string, updates: Partial<TaskInstance>): TaskInstance | undefined {
    const task = this.tasks.get(id);
    if (task) {
      const updated = {
        ...task,
        ...updates
      };
      this.tasks.set(id, updated);
      return updated;
    }
    return undefined;
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }
}
