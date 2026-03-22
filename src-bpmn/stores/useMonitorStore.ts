import { create } from 'zustand';
import type { WorkflowInstance, ExecutionEvent } from '../types/engine';

interface MonitorState {
  instances: WorkflowInstance[];
  selectedInstanceId: string | null;
  executionEvents: ExecutionEvent[];
  isConnected: boolean;
  
  addInstance: (instance: WorkflowInstance) => void;
  updateInstance: (id: string, updates: Partial<WorkflowInstance>) => void;
  removeInstance: (id: string) => void;
  setInstances: (instances: WorkflowInstance[]) => void;
  
  selectInstance: (id: string | null) => void;
  
  addExecutionEvent: (event: ExecutionEvent) => void;
  clearExecutionEvents: () => void;
  
  setConnected: (connected: boolean) => void;
  
  reset: () => void;
}

const initialState = {
  instances: [],
  selectedInstanceId: null,
  executionEvents: [],
  isConnected: false
};

export const useMonitorStore = create<MonitorState>((set) => ({
  ...initialState,

  addInstance: (instance) => set((state) => ({
    instances: [...state.instances, instance]
  })),

  updateInstance: (id, updates) => set((state) => ({
    instances: state.instances.map(inst => 
      inst.id === id ? { ...inst, ...updates } : inst
    )
  })),

  removeInstance: (id) => set((state) => ({
    instances: state.instances.filter(inst => inst.id !== id),
    selectedInstanceId: state.selectedInstanceId === id ? null : state.selectedInstanceId
  })),

  setInstances: (instances) => set({ instances }),

  selectInstance: (id) => set({ selectedInstanceId: id }),

  addExecutionEvent: (event) => set((state) => ({
    executionEvents: [...state.executionEvents, event]
  })),

  clearExecutionEvents: () => set({ executionEvents: [] }),

  setConnected: (connected) => set({ isConnected: connected }),

  reset: () => set({ ...initialState })
}));
