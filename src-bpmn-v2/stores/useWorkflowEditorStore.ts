import { create } from 'zustand';
import { ProcessType } from '../../src-bpmn/types/bpmn';
import type { EditorNode, EditorEdge, ParallelBlock, NodeTypeItem } from '../types/editor';

const MAX_NESTING_DEPTH = 3;
const HISTORY_LIMIT = 80;

interface EditorSnapshot {
  nodes: EditorNode[];
  edges: EditorEdge[];
  parallelBlocks: ParallelBlock[];
  selectedNodeId: string | null;
}

interface SelectorContext {
  type: 'main' | 'branch';
  branchBlockId?: string;
  branchIndex?: number;
  positionInBranch?: number;
}

interface WorkflowEditorState extends EditorSnapshot {
  showSelector: boolean;
  selectorPosition: number;
  selectorContext: SelectorContext;
  searchQuery: string;
  activeCategory: string;
  errorMessage: string | null;
  historyPast: EditorSnapshot[];
  historyFuture: EditorSnapshot[];

  addNode: (item: NodeTypeItem, position: number) => void;
  addNodeToBranch: (item: NodeTypeItem, blockId: string, branchIndex: number, positionInBranch: number) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<EditorNode>) => void;
  selectNode: (id: string | null) => void;

  openSelector: (position: number, context?: SelectorContext) => void;
  closeSelector: () => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: string) => void;
  clearError: () => void;

  autoConnect: () => void;
  validateNestedStructure: (parentBlockId?: string) => boolean;
  undo: () => void;
  redo: () => void;

  reset: () => void;
}

const initialState: EditorSnapshot & {
  showSelector: boolean;
  selectorPosition: number;
  selectorContext: SelectorContext;
  searchQuery: string;
  activeCategory: string;
  errorMessage: string | null;
  historyPast: EditorSnapshot[];
  historyFuture: EditorSnapshot[];
} = {
  nodes: [],
  edges: [],
  parallelBlocks: [],
  selectedNodeId: null,
  showSelector: false,
  selectorPosition: 0,
  selectorContext: { type: 'main' },
  searchQuery: '',
  activeCategory: 'control',
  errorMessage: null,
  historyPast: [],
  historyFuture: [],
};

const generateId = () => `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const cloneSnapshot = (snapshot: EditorSnapshot): EditorSnapshot => structuredClone(snapshot);

const createSnapshot = (
  nodes: EditorNode[],
  edges: EditorEdge[],
  parallelBlocks: ParallelBlock[],
  selectedNodeId: string | null
): EditorSnapshot => ({
  nodes: structuredClone(nodes),
  edges: structuredClone(edges),
  parallelBlocks: structuredClone(parallelBlocks),
  selectedNodeId,
});

const isProcessTypeValue = (type: string): type is ProcessType =>
  Object.values(ProcessType).includes(type as ProcessType);

const createNode = (
  item: NodeTypeItem,
  order: number,
  parentId?: string,
  branchIndex?: number
): EditorNode => ({
  id: generateId(),
  type: item.type,
  order,
  data: {
    name: item.name,
    processType: item.processType ?? (isProcessTypeValue(item.type) ? item.type : undefined),
  },
  parentId,
  branchIndex,
});

const buildEdges = (nodes: EditorNode[], parallelBlocks: ParallelBlock[]): EditorEdge[] => {
  const edges: EditorEdge[] = [];
  const mainNodes = nodes.filter((node) => !node.parentId).sort((a, b) => a.order - b.order);

  for (let index = 0; index < mainNodes.length - 1; index++) {
    const source = mainNodes[index];
    const target = mainNodes[index + 1];
    edges.push({
      id: `edge_${source.id}_${target.id}`,
      source: source.id,
      target: target.id,
      type: 'sequence',
    });
  }

  parallelBlocks.forEach((block) => {
    block.branches.forEach((branch) => {
      const branchNodes = branch
        .map((nodeId) => nodes.find((node) => node.id === nodeId))
        .filter(Boolean) as EditorNode[];

      if (branch.length > 0) {
        edges.push({
          id: `edge_${block.startNodeId}_${branch[0]}`,
          source: block.startNodeId,
          target: branch[0],
          type: 'parallel',
        });
      }

      for (let index = 0; index < branchNodes.length - 1; index++) {
        edges.push({
          id: `edge_${branchNodes[index].id}_${branchNodes[index + 1].id}`,
          source: branchNodes[index].id,
          target: branchNodes[index + 1].id,
          type: 'parallel',
        });
      }

      if (branch.length > 0) {
        edges.push({
          id: `edge_${branch[branch.length - 1]}_${block.endNodeId}`,
          source: branch[branch.length - 1],
          target: block.endNodeId,
          type: 'parallel',
        });
      }
    });
  });

  return edges;
};

const limitHistory = (history: EditorSnapshot[]) => history.slice(-HISTORY_LIMIT);

const collectNestedBlockIds = (parallelBlocks: ParallelBlock[], startNodeId: string, acc = new Set<string>()) => {
  const block = parallelBlocks.find((item) => item.startNodeId === startNodeId);
  if (!block || acc.has(block.id)) return acc;

  acc.add(block.id);
  block.branches.flat().forEach((nodeId) => {
    collectNestedBlockIds(parallelBlocks, nodeId, acc);
  });
  return acc;
};

const collectNodeIdsForBlocks = (parallelBlocks: ParallelBlock[], blockIds: Set<string>) => {
  const nodeIds = new Set<string>();
  parallelBlocks.forEach((block) => {
    if (!blockIds.has(block.id)) return;
    nodeIds.add(block.startNodeId);
    nodeIds.add(block.endNodeId);
    block.branches.flat().forEach((nodeId) => nodeIds.add(nodeId));
  });
  return nodeIds;
};

export const useWorkflowEditorStore = create<WorkflowEditorState>((set, get) => ({
  ...initialState,

  addNode: (item, position) => {
    const { nodes, parallelBlocks, edges, selectedNodeId, historyPast } = get();
    const historyEntry = createSnapshot(nodes, edges, parallelBlocks, selectedNodeId);

    if (item.type === 'parallelGateway') {
      const startNode = createNode({ type: 'parallelGateway', name: '并行开始' }, position);
      const endNode = createNode({ type: 'parallelGateway', name: '并行结束' }, position + 1);
      const branch1Node = createNode({ type: ProcessType.OTHER, name: '分支 1' }, 0, startNode.id, 0);
      const branch2Node = createNode({ type: ProcessType.OTHER, name: '分支 2' }, 0, startNode.id, 1);

      const updatedNodes = [
        ...nodes.map((node) => (node.order >= position ? { ...node, order: node.order + 2 } : node)),
        startNode,
        endNode,
        branch1Node,
        branch2Node,
      ].sort((left, right) => left.order - right.order);

      const updatedBlocks = [
        ...parallelBlocks,
        {
          id: generateId(),
          startNodeId: startNode.id,
          endNodeId: endNode.id,
          branches: [[branch1Node.id], [branch2Node.id]],
          depth: 0,
        },
      ];

      set({
        nodes: updatedNodes,
        parallelBlocks: updatedBlocks,
        edges: buildEdges(updatedNodes, updatedBlocks),
        selectedNodeId: startNode.id,
        errorMessage: null,
        historyPast: limitHistory([...historyPast, historyEntry]),
        historyFuture: [],
      });
      return;
    }

    const newNode = createNode(item, position);
    const updatedNodes = [
      ...nodes.map((node) => (node.order >= position ? { ...node, order: node.order + 1 } : node)),
      newNode,
    ].sort((left, right) => left.order - right.order);

    set({
      nodes: updatedNodes,
      edges: buildEdges(updatedNodes, parallelBlocks),
      selectedNodeId: newNode.id,
      errorMessage: null,
      historyPast: limitHistory([...historyPast, historyEntry]),
      historyFuture: [],
    });
  },

  addNodeToBranch: (item, blockId, branchIndex, positionInBranch) => {
    const { nodes, parallelBlocks, edges, selectedNodeId, historyPast } = get();
    const historyEntry = createSnapshot(nodes, edges, parallelBlocks, selectedNodeId);
    const block = parallelBlocks.find((itemBlock) => itemBlock.id === blockId);
    if (!block) return;

    if (item.type === 'parallelGateway' && block.depth >= MAX_NESTING_DEPTH) {
      set({ errorMessage: `嵌套深度已达上限 (最大${MAX_NESTING_DEPTH}层)` });
      return;
    }

    const updatedBlocks = parallelBlocks.map((itemBlock) => ({ ...itemBlock, branches: itemBlock.branches.map((branch) => [...branch]) }));
    const currentBlock = updatedBlocks.find((itemBlock) => itemBlock.id === blockId);
    if (!currentBlock) return;

    if (item.type === 'parallelGateway') {
      const nestedStartNode = createNode({ type: 'parallelGateway', name: '并行开始' }, 0, block.startNodeId, branchIndex);
      const nestedEndNode = createNode({ type: 'parallelGateway', name: '并行结束' }, 0, block.startNodeId, branchIndex);
      const nestedBranch1Node = createNode({ type: ProcessType.OTHER, name: '分支 1' }, 0, nestedStartNode.id, 0);
      const nestedBranch2Node = createNode({ type: ProcessType.OTHER, name: '分支 2' }, 0, nestedStartNode.id, 1);

      currentBlock.branches[branchIndex].splice(positionInBranch, 0, nestedStartNode.id, nestedEndNode.id);
      updatedBlocks.push({
        id: generateId(),
        startNodeId: nestedStartNode.id,
        endNodeId: nestedEndNode.id,
        branches: [[nestedBranch1Node.id], [nestedBranch2Node.id]],
        parentBlockId: blockId,
        depth: block.depth + 1,
      });

      const updatedNodes = [...nodes, nestedStartNode, nestedEndNode, nestedBranch1Node, nestedBranch2Node];
      set({
        nodes: updatedNodes,
        parallelBlocks: updatedBlocks,
        edges: buildEdges(updatedNodes, updatedBlocks),
        selectedNodeId: nestedStartNode.id,
        errorMessage: null,
        historyPast: limitHistory([...historyPast, historyEntry]),
        historyFuture: [],
      });
      return;
    }

    const newNode = createNode(item, 0, block.startNodeId, branchIndex);
    currentBlock.branches[branchIndex].splice(positionInBranch, 0, newNode.id);
    const updatedNodes = [...nodes, newNode];

    set({
      nodes: updatedNodes,
      parallelBlocks: updatedBlocks,
      edges: buildEdges(updatedNodes, updatedBlocks),
      selectedNodeId: newNode.id,
      errorMessage: null,
      historyPast: limitHistory([...historyPast, historyEntry]),
      historyFuture: [],
    });
  },

  removeNode: (id) => {
    const { nodes, parallelBlocks, edges, selectedNodeId, historyPast } = get();
    const historyEntry = createSnapshot(nodes, edges, parallelBlocks, selectedNodeId);
    const targetNode = nodes.find((node) => node.id === id);
    if (!targetNode) return;

    const blockIdsToRemove = collectNestedBlockIds(parallelBlocks, id);
    const startOrEndBlock = parallelBlocks.find((block) => block.endNodeId === id);
    if (startOrEndBlock) {
      collectNestedBlockIds(parallelBlocks, startOrEndBlock.startNodeId, blockIdsToRemove);
    }
    const nodeIdsToRemove = collectNodeIdsForBlocks(parallelBlocks, blockIdsToRemove);
    nodeIdsToRemove.add(id);

    const updatedBlocks = parallelBlocks
      .filter((block) => !blockIdsToRemove.has(block.id))
      .map((block) => ({
        ...block,
        branches: block.branches.map((branch) => branch.filter((nodeId) => !nodeIdsToRemove.has(nodeId))),
      }));

    const updatedNodes = nodes
      .filter((node) => !nodeIdsToRemove.has(node.id))
      .map((node, index) => ({ ...node, order: node.parentId ? node.order : index }));

    set({
      nodes: updatedNodes,
      parallelBlocks: updatedBlocks,
      edges: buildEdges(updatedNodes, updatedBlocks),
      selectedNodeId: selectedNodeId && nodeIdsToRemove.has(selectedNodeId) ? null : selectedNodeId,
      errorMessage: null,
      historyPast: limitHistory([...historyPast, historyEntry]),
      historyFuture: [],
    });
  },

  duplicateNode: (id) => {
    const { nodes, parallelBlocks, edges, selectedNodeId, historyPast } = get();
    const historyEntry = createSnapshot(nodes, edges, parallelBlocks, selectedNodeId);
    const node = nodes.find((item) => item.id === id);
    if (!node) return;

    const copyNode = {
      ...structuredClone(node),
      id: generateId(),
      data: {
        ...structuredClone(node.data),
        name: `${node.data.name} 副本`,
      },
    };

    if (!node.parentId) {
      const updatedNodes = [
        ...nodes.map((item) => (item.parentId || item.order <= node.order ? item : { ...item, order: item.order + 1 })),
        { ...copyNode, order: node.order + 1 },
      ].sort((left, right) => left.order - right.order);

      set({
        nodes: updatedNodes,
        edges: buildEdges(updatedNodes, parallelBlocks),
        selectedNodeId: copyNode.id,
        errorMessage: null,
        historyPast: limitHistory([...historyPast, historyEntry]),
        historyFuture: [],
      });
      return;
    }

    const updatedBlocks = parallelBlocks.map((block) => ({ ...block, branches: block.branches.map((branch) => [...branch]) }));
    const parentBlock = updatedBlocks.find((block) => block.startNodeId === node.parentId);
    if (!parentBlock || node.branchIndex === undefined) return;

    const branch = parentBlock.branches[node.branchIndex];
    const insertIndex = branch.indexOf(id);
    if (insertIndex === -1) return;
    branch.splice(insertIndex + 1, 0, copyNode.id);

    const updatedNodes = [...nodes, copyNode];
    set({
      nodes: updatedNodes,
      parallelBlocks: updatedBlocks,
      edges: buildEdges(updatedNodes, updatedBlocks),
      selectedNodeId: copyNode.id,
      errorMessage: null,
      historyPast: limitHistory([...historyPast, historyEntry]),
      historyFuture: [],
    });
  },

  updateNode: (id, updates) => {
    const { nodes, parallelBlocks, edges, selectedNodeId, historyPast } = get();
    const existingNode = nodes.find((node) => node.id === id);
    if (!existingNode) return;

    const nextNode = { ...existingNode, ...updates };
    if (JSON.stringify(nextNode) === JSON.stringify(existingNode)) return;

    const historyEntry = createSnapshot(nodes, edges, parallelBlocks, selectedNodeId);
    const updatedNodes = nodes.map((node) => (node.id === id ? nextNode : node));
    set({
      nodes: updatedNodes,
      edges: buildEdges(updatedNodes, parallelBlocks),
      historyPast: limitHistory([...historyPast, historyEntry]),
      historyFuture: [],
    });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  openSelector: (position, context = { type: 'main' }) =>
    set({
      showSelector: true,
      selectorPosition: position,
      selectorContext: context,
      searchQuery: '',
      activeCategory: 'control',
      errorMessage: null,
    }),

  closeSelector: () => set({ showSelector: false }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setActiveCategory: (category) => set({ activeCategory: category }),

  clearError: () => set({ errorMessage: null }),

  validateNestedStructure: (): boolean => {
    const { parallelBlocks } = get();

    const checkForCycles = (blockId: string, visited: Set<string>): boolean => {
      if (visited.has(blockId)) return true;
      visited.add(blockId);

      const block = parallelBlocks.find((item) => item.id === blockId);
      if (!block) return false;

      for (const branch of block.branches) {
        for (const nodeId of branch) {
          const nestedBlock = parallelBlocks.find((item) => item.startNodeId === nodeId);
          if (nestedBlock && checkForCycles(nestedBlock.id, new Set(visited))) {
            return true;
          }
        }
      }
      return false;
    };

    for (const block of parallelBlocks) {
      if (checkForCycles(block.id, new Set())) return false;
      if (block.depth > MAX_NESTING_DEPTH) return false;
    }

    return true;
  },

  autoConnect: () => {
    const { nodes, parallelBlocks } = get();
    set({ edges: buildEdges(nodes, parallelBlocks) });
  },

  undo: () => {
    const { historyPast, historyFuture, nodes, edges, parallelBlocks, selectedNodeId } = get();
    if (historyPast.length === 0) return;

    const previous = historyPast[historyPast.length - 1];
    const current = createSnapshot(nodes, edges, parallelBlocks, selectedNodeId);
    set({
      ...cloneSnapshot(previous),
      historyPast: historyPast.slice(0, -1),
      historyFuture: [current, ...historyFuture].slice(0, HISTORY_LIMIT),
      showSelector: false,
      errorMessage: null,
    });
  },

  redo: () => {
    const { historyPast, historyFuture, nodes, edges, parallelBlocks, selectedNodeId } = get();
    if (historyFuture.length === 0) return;

    const [next, ...rest] = historyFuture;
    const current = createSnapshot(nodes, edges, parallelBlocks, selectedNodeId);
    set({
      ...cloneSnapshot(next),
      historyPast: limitHistory([...historyPast, current]),
      historyFuture: rest,
      showSelector: false,
      errorMessage: null,
    });
  },

  reset: () => set(initialState),
}));
