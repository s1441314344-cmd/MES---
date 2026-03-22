import React from 'react';
import { useWorkflowEditorStore } from '../stores/useWorkflowEditorStore';
import { getNodeColor } from '../config/nodeTypes';
import { Play, Square, Split, GitBranch, Droplets, MoreHorizontal, Copy, Trash2 } from 'lucide-react';

const getIconComponent = (type: string, color: string) => {
  const iconProps = { size: 24, color };
  
  switch (type) {
    case 'startEvent':
      return <Play {...iconProps} fill={color} />;
    case 'endEvent':
      return <Square {...iconProps} fill={color} />;
    case 'exclusiveGateway':
      return <Split {...iconProps} />;
    case 'parallelGateway':
      return <GitBranch {...iconProps} />;
    default:
      return <Droplets {...iconProps} />;
  }
};

export const PropertiesPanel: React.FC = () => {
  const { nodes, selectedNodeId, updateNode, duplicateNode, removeNode } = useWorkflowEditorStore();
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="flex h-full w-80 flex-col border-l border-slate-200/80 bg-[rgba(255,255,255,0.88)] backdrop-blur-sm">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900">属性面板</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MoreHorizontal className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">请选择一个节点</p>
          </div>
        </div>
      </div>
    );
  }

  const color = getNodeColor(selectedNode.type);

  return (
    <div className="flex h-full w-80 flex-col border-l border-slate-200/80 bg-[rgba(255,255,255,0.88)] backdrop-blur-sm">
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            {getIconComponent(selectedNode.type, color)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedNode.data.name}
            </h3>
            <p className="text-sm text-gray-500">
              节点类型: {selectedNode.type}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              基础信息
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                节点名称
              </label>
              <input
                type="text"
                value={selectedNode.data.name}
                onChange={(e) => updateNode(selectedNode.id, {
                  data: { ...selectedNode.data, name: e.target.value }
                })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedNode.data.processType && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  工艺类型
                </label>
                <input
                  type="text"
                  value={selectedNode.data.processType}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500"
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              节点说明
            </div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              描述
            </label>
            <textarea
              value={selectedNode.data.description || ''}
              onChange={(e) => updateNode(selectedNode.id, {
                data: { ...selectedNode.data, description: e.target.value }
              })}
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="补充节点职责、工艺条件或交接说明..."
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              高级信息
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  节点ID
                </label>
                <input
                  type="text"
                  value={selectedNode.id}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 font-mono text-sm text-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  排序位置
                </label>
                <input
                  type="number"
                  value={selectedNode.order}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-gray-100 p-6">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => duplicateNode(selectedNode.id)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" />
            复制
          </button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm(`确定删除节点“${selectedNode.data.name}”吗？`)) return;
              removeNode(selectedNode.id);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            删除
          </button>
        </div>
        <div className="text-xs text-gray-400">
          <p>快捷键：⌘/Ctrl + Z 撤销，Shift + ⌘/Ctrl + Z 或 Ctrl + Y 重做。</p>
        </div>
      </div>
    </div>
  );
};
