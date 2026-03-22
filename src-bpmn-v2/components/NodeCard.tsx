import React from 'react';
import { Trash2, Copy, Sparkles } from 'lucide-react';
import type { EditorNode } from '../types/editor';
import { getNodeColor, getNodeBgColor } from '../config/nodeTypes';
import { Play, Square, Split, GitBranch, Droplets, MoreHorizontal } from 'lucide-react';

interface NodeCardProps {
  node: EditorNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  registerNode?: (id: string, element: HTMLDivElement | null) => void;
}

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
    case 'process':
      return <Droplets {...iconProps} />;
    default:
      return type.includes('Gateway') ? <MoreHorizontal {...iconProps} /> : <Droplets {...iconProps} />;
  }
};

export const NodeCard: React.FC<NodeCardProps> = ({ 
  node, 
  isSelected, 
  onSelect, 
  onDelete,
  onDuplicate,
  registerNode,
}) => {
  const color = getNodeColor(node.type);
  const bgColor = getNodeBgColor(node.type);
  const isGateway = node.type === 'exclusiveGateway' || node.type === 'parallelGateway';
  const isBoundary = node.type === 'startEvent' || node.type === 'endEvent';
  const nodeMeta = node.data.processType ? `工艺节点 · ${node.data.processType}` : isGateway ? '网关节点' : '控制节点';

  return (
    <div
      ref={(element) => registerNode?.(node.id, element)}
      onClick={() => onSelect(node.id)}
      className={`
        relative z-10 w-full overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 group
        ${isSelected 
          ? 'border-blue-500 bg-white shadow-[0_18px_40px_rgba(31,111,235,0.14)] ring-2 ring-blue-100' 
          : 'border-slate-200/90 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]'
        }
      `}
      style={{ backgroundColor: isSelected ? '#ffffff' : bgColor }}
      data-node-id={node.id}
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.85))` }}
      />
      <div className="flex items-start gap-4 p-4">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/70 shadow-sm"
          style={{ backgroundColor: `${color}18` }}
        >
          {getIconComponent(node.type, color)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {nodeMeta}
                </span>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                    <Sparkles className="h-3 w-3" />
                    当前选中
                  </span>
                )}
              </div>
              <h3 className="truncate text-base font-semibold text-slate-900">
                {node.data.name}
              </h3>
            </div>
            <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(node.id);
                }}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title="复制节点"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!window.confirm(`确定删除节点“${node.data.name}”吗？`)) return;
                  onDelete(node.id);
                }}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                title="删除节点"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!isBoundary && (
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                {isGateway ? '分支控制' : '工艺摘要'}
              </span>
            )}
            {node.parentId && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                分支节点
              </span>
            )}
            <span className="rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-mono text-slate-500">
              {node.id.slice(-8)}
            </span>
          </div>

          {node.data.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
              {node.data.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              {isGateway ? '用于组织分支和汇聚逻辑。' : '选择节点后可在右侧补充说明和参数。'}
            </p>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-blue-500" />
      )}
    </div>
  );
};
