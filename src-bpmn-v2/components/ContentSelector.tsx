import React, { useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { NODE_TYPE_CATEGORIES, getNodeColor, getNodeBgColor } from '../config/nodeTypes';
import { useWorkflowEditorStore } from '../stores/useWorkflowEditorStore';
import type { NodeTypeItem } from '../types/editor';

export const ContentSelector: React.FC = () => {
  const { 
    showSelector, 
    selectorPosition, 
    selectorContext,
    searchQuery, 
    activeCategory,
    setSearchQuery, 
    setActiveCategory, 
    closeSelector,
    addNode,
    addNodeToBranch
  } = useWorkflowEditorStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSelector();
      }
    };

    if (showSelector) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSelector, closeSelector]);

  if (!showSelector) return null;

  const handleSelect = (item: NodeTypeItem) => {
    if (selectorContext.type === 'branch' && selectorContext.branchBlockId && selectorContext.branchIndex !== undefined && selectorContext.positionInBranch !== undefined) {
      addNodeToBranch(item, selectorContext.branchBlockId, selectorContext.branchIndex, selectorContext.positionInBranch);
    } else {
      addNode(item, selectorPosition);
    }
    closeSelector();
  };

  const filteredCategories = NODE_TYPE_CATEGORIES.map(category => ({
    ...category,
    types: category.types.filter(type => 
      type.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.types.length > 0);

  const activeCategoryData = filteredCategories.find(c => c.id === activeCategory) || filteredCategories[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={closeSelector}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden max-h-[500px] flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">添加节点</h2>
            <button
              onClick={closeSelector}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索节点类型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        <div className="flex border-b border-gray-100 px-4">
          {filteredCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${activeCategory === category.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {activeCategoryData?.types.map((item, index) => {
              const color = getNodeColor(item.type);
              const bgColor = getNodeBgColor(item.type);
              return (
                <button
                  key={`${item.type}-${index}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: bgColor }}
                  >
                    <div 
                      className="w-5 h-5 rounded"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">
                      {item.name}
                    </span>
                    {item.processType && (
                      <span className="text-xs text-gray-500 block">
                        {item.processType}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
