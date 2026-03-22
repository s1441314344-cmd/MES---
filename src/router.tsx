import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { ConfigPage } from './components/config/ConfigPage';
import BpmnDesignerApp from '../src-bpmn/BpmnDesignerApp';
import WorkflowEditor from '../src-bpmn-v2/WorkflowEditor';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
    },
    {
        path: '/config',
        element: <ConfigPage />,
    },
    {
        path: '/bpmn',
        element: <BpmnDesignerApp />,
    },
    {
        path: '/workflow-editor',
        element: <WorkflowEditor />,
    },
]);
