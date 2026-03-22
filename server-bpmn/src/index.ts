import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { WorkflowStore } from './storage/workflowStore';
import { InstanceStore } from './storage/instanceStore';
import { TaskStore } from './storage/taskStore';
import { WorkflowEngine } from './engine';
import type { WorkflowDefinition, WorkflowInstance, ExecutionEvent } from './types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

const workflowStore = new WorkflowStore();
const instanceStore = new InstanceStore();
const taskStore = new TaskStore();
const workflowEngine = new WorkflowEngine();

workflowEngine.setCallback((event: ExecutionEvent) => {
  io.emit('execution:event', event);
  const instance = instanceStore.get(event.instanceId);
  if (instance) {
    io.emit('instance:updated', instance);
  }
});

app.get('/api/workflows', (req, res) => {
  const workflows = workflowStore.getAll();
  res.json(workflows);
});

app.post('/api/workflows', (req, res) => {
  const workflow = workflowStore.create(req.body);
  res.status(201).json(workflow);
});

app.get('/api/workflows/:id', (req, res) => {
  const workflow = workflowStore.get(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(workflow);
});

app.put('/api/workflows/:id', (req, res) => {
  const workflow = workflowStore.update(req.params.id, req.body);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(workflow);
});

app.delete('/api/workflows/:id', (req, res) => {
  const deleted = workflowStore.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.status(204).send();
});

app.post('/api/workflows/:id/execute', async (req, res) => {
  const workflow = workflowStore.get(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const instance: Omit<WorkflowInstance, 'endTime'> = {
    id: `instance_${Date.now()}`,
    definitionId: workflow.id,
    status: 'RUNNING',
    tokens: [],
    variables: req.body.variables || {},
    startTime: new Date()
  };

  instanceStore.create(instance);
  io.emit('instance:created', instance);

  try {
    const result = await workflowEngine.executeWorkflow(
      instance,
      workflow.nodes,
      workflow.edges
    );
    instanceStore.update(result.id, result);
    io.emit('instance:completed', result);
    res.json(result);
  } catch (error) {
    const failedInstance = instanceStore.get(instance.id);
    if (failedInstance) {
      failedInstance.status = 'FAILED';
      failedInstance.endTime = new Date();
      instanceStore.update(failedInstance.id, failedInstance);
      io.emit('instance:failed', failedInstance);
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Execution failed' });
  }
});

app.get('/api/instances', (req, res) => {
  const instances = instanceStore.getAll();
  res.json(instances);
});

app.get('/api/instances/:id', (req, res) => {
  const instance = instanceStore.get(req.params.id);
  if (!instance) {
    return res.status(404).json({ error: 'Instance not found' });
  }
  res.json(instance);
});

app.get('/api/tasks', (req, res) => {
  const tasks = taskStore.getAll();
  res.json(tasks);
});

app.get('/api/tasks/:instanceId', (req, res) => {
  const tasks = taskStore.getByInstance(req.params.instanceId);
  res.json(tasks);
});

app.put('/api/tasks/:id/complete', (req, res) => {
  const task = taskStore.update(req.params.id, {
    status: 'COMPLETED',
    endTime: new Date(),
    result: req.body.result
  });
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`BPMN Workflow Server running on port ${PORT}`);
});
