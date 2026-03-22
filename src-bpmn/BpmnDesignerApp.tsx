import { useEffect, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDesignerStore } from './stores/useDesignerStore';
import { useMonitorStore } from './stores/useMonitorStore';
import { WorkflowValidator } from './services/workflowValidator';
import type { WorkflowNode, WorkflowEdge, NodeType } from './types/bpmn';
import { ProcessType } from './types/bpmn';

const StartEventNode = ({ selected }: any) => (
  <div
    className={`w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold border-2 ${selected ? 'border-green-700' : 'border-green-400'}`}
  >
    ●
  </div>
);

const EndEventNode = ({ selected }: any) => (
  <div
    className={`w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold border-2 ${selected ? 'border-red-700' : 'border-red-400'}`}
  >
    ○
  </div>
);

const ExclusiveGatewayNode = ({ selected }: any) => (
  <div
    className={`w-15 h-15 bg-orange-500 flex items-center justify-center text-white font-bold border-2 transform rotate-45 ${selected ? 'border-orange-700' : 'border-orange-400'}`}
    style={{ width: '60px', height: '60px' }}
  >
    X
  </div>
);

const ParallelGatewayNode = ({ selected }: any) => (
  <div
    className={`w-15 h-15 bg-purple-500 flex items-center justify-center text-white font-bold border-2 transform rotate-45 ${selected ? 'border-purple-700' : 'border-purple-400'}`}
    style={{ width: '60px', height: '60px' }}
  >
    +
  </div>
);

const ProcessNode = ({ data, selected }: any) => (
  <div
    className={`w-40 h-24 bg-blue-500 rounded-lg flex flex-col items-center justify-center text-white border-2 ${selected ? 'border-blue-700' : 'border-blue-400'}`}
  >
    <div className="text-sm font-bold">{data.name || '工艺节点'}</div>
    <div className="text-xs opacity-75">{data.processType}</div>
  </div>
);

const CustomStartEventNode = ({ data, selected }: any) => (
  <>
    <Handle type="source" position={Position.Right} />
    <StartEventNode data={data} selected={selected} />
  </>
);

const CustomEndEventNode = ({ data, selected }: any) => (
  <>
    <Handle type="target" position={Position.Left} />
    <EndEventNode data={data} selected={selected} />
  </>
);

const CustomExclusiveGatewayNode = ({ data, selected }: any) => (
  <>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <Handle type="source" position={Position.Bottom} />
    <ExclusiveGatewayNode data={data} selected={selected} />
  </>
);

const CustomParallelGatewayNode = ({ data, selected }: any) => (
  <>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <Handle type="source" position={Position.Bottom} />
    <ParallelGatewayNode data={data} selected={selected} />
  </>
);

const CustomProcessNode = ({ data, selected }: any) => (
  <>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <ProcessNode data={data} selected={selected} />
  </>
);

const nodeTypes = {
  startEvent: CustomStartEventNode,
  endEvent: CustomEndEventNode,
  exclusiveGateway: CustomExclusiveGatewayNode,
  parallelGateway: CustomParallelGatewayNode,
  inclusiveGateway: CustomExclusiveGatewayNode,
  eventGateway: CustomExclusiveGatewayNode,
  process: CustomProcessNode
};

const NodeLibrary = ({ onAddNode }: { onAddNode: (type: NodeType, name: string, processType?: ProcessType) => void }) => {
  const processTypes: { type: ProcessType; name: string }[] = [
    { type: ProcessType.DISSOLUTION, name: '溶解' },
    { type: ProcessType.COMPOUNDING, name: '调配' },
    { type: ProcessType.FILTRATION, name: '过滤' },
    { type: ProcessType.TRANSFER, name: '赶料' },
    { type: ProcessType.FLAVOR_ADDITION, name: '香精添加' },
    { type: ProcessType.EXTRACTION, name: '萃取' },
    { type: ProcessType.CENTRIFUGE, name: '离心' },
    { type: ProcessType.COOLING, name: '冷却' },
    { type: ProcessType.HOLDING, name: '暂存' },
    { type: ProcessType.MEMBRANE_FILTRATION, name: '膜过滤' },
    { type: ProcessType.UHT, name: 'UHT杀菌' },
    { type: ProcessType.FILLING, name: '灌装' },
    { type: ProcessType.MAGNETIC_ABSORPTION, name: '磁棒吸附' },
    { type: ProcessType.ASEPTIC_TANK, name: '无菌罐' },
    { type: ProcessType.OTHER, name: '其他' }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">节点库</h3>
      
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">BPMN控制节点</h4>
        <div className="space-y-2">
          <button
            onClick={() => onAddNode('startEvent', '开始')}
            className="w-full p-2 bg-green-100 hover:bg-green-200 rounded text-sm text-left"
          >
            开始事件
          </button>
          <button
            onClick={() => onAddNode('endEvent', '结束')}
            className="w-full p-2 bg-red-100 hover:bg-red-200 rounded text-sm text-left"
          >
            结束事件
          </button>
          <button
            onClick={() => onAddNode('exclusiveGateway', '独占网关')}
            className="w-full p-2 bg-orange-100 hover:bg-orange-200 rounded text-sm text-left"
          >
            独占网关
          </button>
          <button
            onClick={() => onAddNode('parallelGateway', '并行网关')}
            className="w-full p-2 bg-purple-100 hover:bg-purple-200 rounded text-sm text-left"
          >
            并行网关
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-2">工艺节点</h4>
        <div className="space-y-2">
          {processTypes.map(pt => (
            <button
              key={pt.type}
              onClick={() => onAddNode('dissolution' as any, pt.name, pt.type)}
              className="w-full p-2 bg-blue-50 hover:bg-blue-100 rounded text-sm text-left"
            >
              {pt.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const PropertiesPanel = () => {
  const { nodes, selectedNodeId } = useDesignerStore();
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <h3 className="text-lg font-bold mb-4">属性面板</h3>
        <p className="text-gray-500 text-sm">请选择一个节点</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4">
      <h3 className="text-lg font-bold mb-4">属性面板</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
          <input
            type="text"
            value={selectedNode.id}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
          <input
            type="text"
            value={selectedNode.data.name}
            onChange={(e) => {
              const { updateNode } = useDesignerStore.getState();
              updateNode(selectedNode.id, { data: { ...selectedNode.data, name: e.target.value } });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <input
            type="text"
            value={selectedNode.type}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
          />
        </div>
        {selectedNode.data.processType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工艺类型</label>
            <input
              type="text"
              value={selectedNode.data.processType}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ExecutionMonitor = () => {
  const { instances, executionEvents, isConnected } = useMonitorStore();

  const formatTime = (time: Date | string) => {
    if (typeof time === 'string') {
      return new Date(time).toLocaleString();
    }
    return time.toLocaleString();
  };

  return (
    <div className="w-full bg-gray-50 p-4">
      <h3 className="text-lg font-bold mb-4">执行监控</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        <span className="text-sm">{isConnected ? '已连接' : '未连接'}</span>
      </div>
      <div className="space-y-2">
        {instances.map(instance => (
          <div key={instance.id} className="p-3 bg-white rounded border">
            <div className="flex justify-between items-center">
              <span className="font-medium">{instance.id}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                instance.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                instance.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {instance.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              开始: {formatTime(instance.startTime)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h4 className="font-medium mb-2">执行事件</h4>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {executionEvents.slice(-20).reverse().map(event => (
            <div key={event.id} className="text-xs p-2 bg-white rounded">
              <span className="text-gray-500">[{formatTime(event.timestamp)}]</span>
              <span className="ml-2 font-medium">{event.type}</span>
              {event.nodeId && <span className="ml-2 text-blue-600">{event.nodeId}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const BpmnDesignerApp = () => {
  const { nodes, edges, addNode, selectNode, selectEdge, setValidationErrors, clearValidationErrors } = useDesignerStore();
  const [reactFlowNodes, setReactFlowNodes] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges] = useEdgesState([]);

  useEffect(() => {
    const mappedNodes = nodes.map((node: any) => ({
      ...node,
      type: node.type === 'startEvent' || node.type === 'endEvent' || 
            node.type === 'exclusiveGateway' || node.type === 'parallelGateway'
            ? node.type : 'process'
    }));
    setReactFlowNodes(mappedNodes);
  }, [nodes, setReactFlowNodes]);

  useEffect(() => {
    const mappedEdges = edges.map((edge: any) => ({
      ...edge,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed }
    }));
    setReactFlowEdges(mappedEdges);
  }, [edges, setReactFlowEdges]);

  const handleAddNode = useCallback((type: NodeType, name: string, processType?: ProcessType) => {
    const id = `node_${Date.now()}`;
    const newNode: WorkflowNode = {
      id,
      type,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        name,
        processType
      }
    };
    addNode(newNode);
  }, [addNode]);

  const handleConnect = useCallback((params: any) => {
    const newEdge: WorkflowEdge = {
      id: `e_${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      type: 'sequence'
    };
    const { addEdge } = useDesignerStore.getState();
    addEdge(newEdge);
  }, []);

  const handleValidate = useCallback(() => {
    const errors = WorkflowValidator.validate(nodes, edges);
    setValidationErrors(errors);
    if (errors.length === 0) {
      alert('流程验证通过！');
    } else {
      alert(`发现 ${errors.length} 个问题`);
    }
  }, [nodes, edges, setValidationErrors]);

  const handleExecute = useCallback(async () => {
    const workflowId = 'demo_workflow';
    const workflowStore = {
      id: workflowId,
      name: '演示流程',
      bpmnXml: '',
      nodes,
      edges,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const response = await fetch('http://localhost:3002/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowStore)
      });
      
      const workflow = await response.json();
      
      const execResponse = await fetch(`http://localhost:3002/api/workflows/${workflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: {} })
      });
      
      const instance = await execResponse.json();
      const { addInstance } = useMonitorStore.getState();
      addInstance(instance);
    } catch (error) {
      console.error('Execution failed:', error);
      alert('执行失败，请确保后端服务器已启动');
    }
  }, [nodes, edges]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">BPMN工作流设计器</h1>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                Experimental
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">旧版画布式原型，建议优先体验新的 `/workflow-editor` 编排页。</p>
          </div>
          <div className="flex-1"></div>
          <button
            onClick={() => {
              const { reset } = useDesignerStore.getState();
              reset();
              clearValidationErrors();
            }}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            清空
          </button>
          <button
            onClick={handleValidate}
            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded text-sm"
          >
            验证流程
          </button>
          <button
            onClick={handleExecute}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
          >
            执行流程
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <NodeLibrary onAddNode={handleAddNode} />
          
          <div className="flex-1 relative">
            <ReactFlow
              nodes={reactFlowNodes}
              edges={reactFlowEdges}
              onNodesChange={(changes) => {
                changes.forEach(change => {
                  if (change.type === 'position' && change.position) {
                    const { updateNode } = useDesignerStore.getState();
                    updateNode(change.id, { position: change.position });
                  } else if (change.type === 'select') {
                    if (change.selected) {
                      selectNode(change.id);
                    }
                  }
                });
              }}
              onEdgesChange={(changes) => {
                changes.forEach(change => {
                  if (change.type === 'remove') {
                    const { removeEdge } = useDesignerStore.getState();
                    removeEdge(change.id);
                  }
                });
              }}
              onConnect={handleConnect}
              onNodeClick={(_, node) => selectNode(node.id)}
              onEdgeClick={(_, edge) => selectEdge(edge.id)}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
          
          <div className="flex flex-col">
            <PropertiesPanel />
            <div className="h-px bg-gray-200"></div>
            <div className="flex-1">
              <ExecutionMonitor />
            </div>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default BpmnDesignerApp;
