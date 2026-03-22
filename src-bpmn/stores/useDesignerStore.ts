import { create } from 'zustand';
import type { WorkflowNode, WorkflowEdge, ValidationError, HistoryItem } from '../types/bpmn';

interface DesignerState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  history: HistoryItem[];
  historyIndex: number;
  validationErrors: ValidationError[];
  
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (id: string) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  
  addEdge: (edge: WorkflowEdge) => void;
  updateEdge: (id: string, updates: Partial<WorkflowEdge>) => void;
  removeEdge: (id: string) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  
  saveHistory: (description: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  setValidationErrors: (errors: ValidationError[]) => void;
  clearValidationErrors: () => void;
  
  reset: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  history: [],
  historyIndex: -1,
  validationErrors: []
};

export const useDesignerStore = create<DesignerState>((set, get) => ({
  ...initialState,

  addNode: (node) => {
    const { nodes, saveHistory } = get();
    set({ nodes: [...nodes, node] });
    saveHistory('Add node');
  },

  updateNode: (id, updates) => {
    const { nodes, saveHistory } = get();
    set({
      nodes: nodes.map(node => 
        node.id === id ? { ...node, ...updates } : node
      )
    });
    saveHistory('Update node');
  },

  removeNode: (id) => {
    const { nodes, edges, saveHistory } = get();
    set({
      nodes: nodes.filter(node => node.id !== id),
      edges: edges.filter(edge => 
        edge.source !== id && edge.target !== id
      )
    });
    saveHistory('Remove node');
  },

  setNodes: (nodes) => {
    const { saveHistory } = get();
    set({ nodes });
    saveHistory('Set nodes');
  },

  addEdge: (edge) => {
    const { edges, saveHistory } = get();
    set({ edges: [...edges, edge] });
    saveHistory('Add edge');
  },

  updateEdge: (id, updates) => {
    const { edges, saveHistory } = get();
    set({
      edges: edges.map(edge => 
        edge.id === id ? { ...edge, ...updates } : edge
      )
    });
    saveHistory('Update edge');
  },

  removeEdge: (id) => {
    const { edges, saveHistory } = get();
    set({ edges: edges.filter(edge => edge.id !== id) });
    saveHistory('Remove edge');
  },

  setEdges: (edges) => {
    const { saveHistory } = get();
    set({ edges });
    saveHistory('Set edges');
  },

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  saveHistory: (description) => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      id: Date.now().toString(),
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      description
    });
    
    const maxHistory = 50;
    const trimmedHistory = newHistory.slice(-maxHistory);
    
    set({
      history: trimmedHistory,
      historyIndex: trimmedHistory.length - 1
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const item = history[newIndex];
      set({
        nodes: JSON.parse(JSON.stringify(item.nodes)),
        edges: JSON.parse(JSON.stringify(item.edges)),
        historyIndex: newIndex
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const item = history[newIndex];
      set({
        nodes: JSON.parse(JSON.stringify(item.nodes)),
        edges: JSON.parse(JSON.stringify(item.edges)),
        historyIndex: newIndex
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  setValidationErrors: (errors) => set({ validationErrors: errors }),
  clearValidationErrors: () => set({ validationErrors: [] }),

  reset: () => set({ ...initialState })
}));
