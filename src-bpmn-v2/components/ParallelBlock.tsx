import React, { useState } from 'react';
import { NodeCard } from './NodeCard';
import { useWorkflowEditorStore } from '../stores/useWorkflowEditorStore';
import type { EditorNode, ParallelBlock as ParallelBlockType } from '../types/editor';

interface ParallelBlockProps {
  block: ParallelBlockType;
  startNode: EditorNode;
  endNode: EditorNode;
  registerNode?: (id: string, element: HTMLDivElement | null) => void;
}

const getDepthColor = (depth: number) => {
  const colors = [
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', line: 'bg-purple-300' },
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', line: 'bg-blue-300' },
    { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', line: 'bg-green-300' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', line: 'bg-orange-300' },
  ];
  return colors[Math.min(depth, colors.length - 1)];
};

export const ParallelBlock: React.FC<ParallelBlockProps> = ({ 
  block, 
  startNode, 
  endNode,
  registerNode,
}) => {
  const { 
    nodes, 
    parallelBlocks,
    selectedNodeId, 
    selectNode, 
    removeNode, 
    duplicateNode,
    openSelector,
    errorMessage,
    clearError
  } = useWorkflowEditorStore();
  
  const [hoveredBranch, setHoveredBranch] = useState<number | null>(null);
  const depthColors = getDepthColor(block.depth);

  const getBranchNodes = (branchIds: string[]) => {
    return branchIds
      .map(id => nodes.find(n => n.id === id))
      .filter(Boolean) as EditorNode[];
  };

  const findNestedBlock = (nodeId: string) => {
    return parallelBlocks.find(b => b.startNodeId === nodeId);
  };

  const renderNestedBlock = (nodeId: string) => {
    const nestedBlock = findNestedBlock(nodeId);
    if (!nestedBlock) return null;

    const nestedStartNode = nodes.find(n => n.id === nestedBlock.startNodeId);
    const nestedEndNode = nodes.find(n => n.id === nestedBlock.endNodeId);

    if (!nestedStartNode || !nestedEndNode) return null;

    return (
      <ParallelBlock
        key={`nested-${nestedBlock.id}`}
        block={nestedBlock}
        startNode={nestedStartNode}
        endNode={nestedEndNode}
        registerNode={registerNode}
      />
    );
  };

  const renderBranchNode = (node: EditorNode) => {
    const nestedBlock = findNestedBlock(node.id);
    
    if (nestedBlock) {
      const nestedEndNode = nodes.find(n => n.id === nestedBlock.endNodeId);
      if (nestedEndNode) {
        return null;
      }
    }

    if (node.id === block.endNodeId) {
      return null;
    }

    return (
      <React.Fragment key={node.id}>
        <div className="group">
          <NodeCard
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={selectNode}
            onDelete={removeNode}
            onDuplicate={duplicateNode}
            registerNode={registerNode}
          />
        </div>
      </React.Fragment>
    );
  };

  const renderBranchInsertButton = (branchIndex: number, positionInBranch: number) => (
    <div 
      className="relative flex items-center justify-center py-3"
      onMouseEnter={() => setHoveredBranch(branchIndex)}
      onMouseLeave={() => setHoveredBranch(null)}
    >
      <button
        onClick={() => openSelector(0, {
          type: 'branch',
          branchBlockId: block.id,
          branchIndex,
          positionInBranch
        })}
        className={`
          relative z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 transform
          ${hoveredBranch === branchIndex
            ? `bg-white/95 border-current text-current scale-110 shadow-lg ${depthColors.text}`
            : 'bg-white/90 border-slate-200 text-slate-400 hover:bg-white hover:border-current hover:text-current hover:scale-110 ' + depthColors.text
          }
          focus:outline-none focus:ring-2 focus:ring-current/30
        `}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="relative z-10">
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700">{errorMessage}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="group">
        <NodeCard
          node={startNode}
          isSelected={selectedNodeId === startNode.id}
          onSelect={selectNode}
          onDelete={removeNode}
          onDuplicate={duplicateNode}
          registerNode={registerNode}
        />
      </div>

      <div className={`my-3 rounded-[24px] border p-5 ${depthColors.bg} ${depthColors.border}`}>
        {block.depth > 0 && (
          <div className="absolute -top-3 left-6 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
            嵌套层级 {block.depth}
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2">
        {block.branches.map((branchIds, branchIndex) => {
          const branchNodes = getBranchNodes(branchIds);
          return (
            <div
              key={branchIndex}
              className="flex min-h-[180px] flex-col rounded-2xl border border-white/80 bg-white/70 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
            >
              <div className={`mb-2 text-center text-sm font-medium ${depthColors.text}`}>
                分支 {branchIndex + 1}
              </div>
              
              {renderBranchInsertButton(branchIndex, 0)}
              
              {branchNodes.map((node, idx) => {
                const nestedBlock = findNestedBlock(node.id);
                if (nestedBlock) {
                  const nestedEndNode = nodes.find(n => n.id === nestedBlock.endNodeId);
                  if (nestedEndNode) {
                    const nestedEndIdx = branchIds.indexOf(nestedEndNode.id);
                    return (
                      <React.Fragment key={`nested-wrapper-${nestedBlock.id}`}>
                        {renderNestedBlock(node.id)}
                        {nestedEndIdx < branchNodes.length - 1 && (
                          renderBranchInsertButton(branchIndex, nestedEndIdx + 1)
                        )}
                      </React.Fragment>
                    );
                  }
                }
                
                const renderedNode = renderBranchNode(node);
                if (!renderedNode) return null;

                return (
                  <React.Fragment key={node.id}>
                    {renderedNode}
                    {idx < branchNodes.length - 1 && !findNestedBlock(branchNodes[idx + 1]?.id) && (
                      renderBranchInsertButton(branchIndex, idx + 1)
                    )}
                  </React.Fragment>
                );
              })}
              
              {branchNodes.length > 0 && !findNestedBlock(branchNodes[branchNodes.length - 1]?.id) && (
                renderBranchInsertButton(branchIndex, branchNodes.length)
              )}
            </div>
          );
        })}
        </div>
      </div>

      <div className="group">
        <NodeCard
          node={endNode}
          isSelected={selectedNodeId === endNode.id}
          onSelect={selectNode}
          onDelete={removeNode}
          onDuplicate={duplicateNode}
          registerNode={registerNode}
        />
      </div>
    </div>
  );
};
