import React, { useCallback, useEffect, useRef } from 'react';
import { NodeCard } from './components/NodeCard';
import { InsertButton } from './components/InsertButton';
import { ContentSelector } from './components/ContentSelector';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ParallelBlock } from './components/ParallelBlock';
import { EdgeOverlay } from './components/EdgeOverlay';
import { useWorkflowEditorStore } from './stores/useWorkflowEditorStore';
import { RotateCcw, RotateCw, CheckCircle, Play, Sparkles } from 'lucide-react';

export const WorkflowEditor: React.FC = () => {
  const { 
    nodes, 
    edges,
    parallelBlocks,
    selectedNodeId, 
    historyPast,
    historyFuture,
    selectNode, 
    removeNode, 
    duplicateNode,
    openSelector,
    undo,
    redo,
    validateNestedStructure,
  } = useWorkflowEditorStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const mainNodes = nodes.filter(n => !n.parentId).sort((a, b) => a.order - b.order);
  const canUndo = historyPast.length > 0;
  const canRedo = historyFuture.length > 0;

  const registerNode = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      nodeRefs.current.set(id, element);
      return;
    }
    nodeRefs.current.delete(id);
  }, []);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      if (!isModifier) return;

      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [redo, undo]);

  const renderMainSequence = () => {
    const elements: JSX.Element[] = [];
    let currentPosition = 0;

    while (currentPosition < mainNodes.length) {
      const node = mainNodes[currentPosition];
      
      const parallelBlock = parallelBlocks.find(block => 
        block.startNodeId === node.id
      );

      if (parallelBlock) {
        const endNode = mainNodes.find(n => n.id === parallelBlock.endNodeId);
        if (endNode) {
          elements.push(
            <ParallelBlock
              key={`block-${parallelBlock.id}`}
              block={parallelBlock}
              startNode={node}
              endNode={endNode}
              registerNode={registerNode}
            />
          );
          
          const endNodeIndex = mainNodes.findIndex(n => n.id === parallelBlock.endNodeId);
          if (endNodeIndex !== -1 && endNodeIndex < mainNodes.length - 1) {
            elements.push(
              <InsertButton
                key={`insert-${parallelBlock.id}`}
                position={endNodeIndex + 1}
                onClick={openSelector}
              />
            );
          }
          
          currentPosition = endNodeIndex + 1;
        } else {
          currentPosition++;
        }
      } else {
        elements.push(
          <React.Fragment key={`node-${node.id}`}>
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
            {currentPosition < mainNodes.length - 1 && (
              <InsertButton position={currentPosition + 1} onClick={openSelector} />
            )}
            {currentPosition === mainNodes.length - 1 && (
              <InsertButton position={currentPosition + 1} onClick={openSelector} />
            )}
          </React.Fragment>
        );
        currentPosition++;
      }
    }

    return elements;
  };

  const handleValidate = () => {
    if (nodes.length === 0) {
      alert('请先添加节点');
      return;
    }

    if (!validateNestedStructure()) {
      alert('流程结构校验失败：请检查并行分支嵌套关系');
      return;
    }

    const hasStart = mainNodes.some(n => n.type === 'startEvent');
    const hasEnd = mainNodes.some(n => n.type === 'endEvent');

    if (!hasStart) {
      alert('流程缺少开始事件');
      return;
    }

    if (!hasEnd) {
      alert('流程缺少结束事件');
      return;
    }

    alert('流程验证通过！');
  };

  const handleExecute = () => {
    alert('流程执行功能开发中...');
  };

  return (
    <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(31,111,235,0.12),_transparent_30%),linear-gradient(180deg,#f4f7fb_0%,#edf4fb_100%)]">
      <div className="border-b border-slate-200/80 bg-[rgba(255,255,255,0.82)] px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1f6feb,#0fa67a)] shadow-lg shadow-blue-950/15">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900">工艺编制流程</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  <Sparkles className="h-3 w-3" />
                  Experimental
                </span>
              </div>
              <p className="text-sm text-slate-500">飞书式列表编排原型，现已接入真实 SVG 连线和历史操作栈</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              title="撤销"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              title="重做"
            >
              <RotateCw size={20} />
            </button>
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <button
              onClick={handleValidate}
              className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <CheckCircle size={18} />
              <span className="text-sm font-medium">验证流程</span>
            </button>
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Play size={18} fill="currentColor" />
              <span className="text-sm font-medium">执行流程</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div ref={canvasRef} className="relative mx-auto max-w-4xl pb-20">
            <EdgeOverlay
              containerRef={canvasRef}
              nodeRefs={nodeRefs}
              edges={edges}
              selectedNodeId={selectedNodeId}
            />
            <InsertButton position={0} onClick={openSelector} />

            {mainNodes.length > 0 ? (
              renderMainSequence()
            ) : (
              <div className="rounded-[28px] border border-slate-200/80 bg-white/90 py-16 text-center shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  开始创建流程
                </h3>
                <p className="mb-6 text-sm text-gray-500">
                  点击上方的插入点添加第一个节点，列表会自动连线并支持并行分支。
                </p>
                <button
                  onClick={() => openSelector(0)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">添加开始节点</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <PropertiesPanel />
      </div>

      <ContentSelector />
    </div>
  );
};

export default WorkflowEditor;
