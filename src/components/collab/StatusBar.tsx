import { useCollabStore } from '@/store/useCollabStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { EditLockButton } from './EditLockButton';
import { DemoModeButton } from './DemoModeButton';
import { OnlineUsers } from './OnlineUsers';
import { Eye, Edit, Gamepad2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export function StatusBar() {
  const { mode, lockStatus, getOnlineUsersCount, isLockedByMe, connectionStatus } = useCollabStore();
  const { isSaving, metadata, processes, edges } = useRecipeStore();
  const onlineCount = getOnlineUsersCount();

  const getModeIcon = () => {
    switch (mode) {
      case 'edit':
        return <Edit className="h-4 w-4" />;
      case 'demo':
        return <Gamepad2 className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getModeText = () => {
    switch (mode) {
      case 'edit':
        return '编辑模式';
      case 'demo':
        return '演示模式';
      default:
        return '查看模式';
    }
  };

  const getSaveStatus = () => {
    if (mode !== 'edit' || !isLockedByMe()) {
      return null;
    }

    if (isSaving) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />,
        text: '保存中...',
        color: 'text-yellow-400',
      };
    }

    // 简单判断：如果 updatedAt 很新（1秒内），认为已保存
    const updatedAt = new Date(metadata.updatedAt);
    const now = new Date();
    const diffSeconds = (now.getTime() - updatedAt.getTime()) / 1000;

    if (diffSeconds < 5) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-400" />,
        text: '已保存',
        color: 'text-green-400',
      };
    }

    return {
      icon: <AlertCircle className="h-4 w-4 text-red-400" />,
      text: '未保存',
      color: 'text-red-400',
    };
  };

  const saveStatus = getSaveStatus();

  return (
    <div className="flex items-center justify-between border-b border-slate-200/80 bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm text-slate-700 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
          <span className={`h-2.5 w-2.5 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-400' : connectionStatus === 'checking' ? 'bg-amber-400' : 'bg-slate-400'}`} />
          <span>{connectionStatus === 'online' ? '实时协作' : connectionStatus === 'checking' ? '连接检查中' : '离线演示'}</span>
        </div>

        {/* 模式指示 */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
          {getModeIcon()}
          <span className="font-medium">{getModeText()}</span>
        </div>

        {/* 编辑者信息 */}
        {lockStatus.isLocked && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">编辑者：</span>
            <span className="font-medium">{lockStatus.userName}</span>
          </div>
        )}

        {/* 在线人数 */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">在线：</span>
          <span className="font-medium">{onlineCount}人</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">当前配方：</span>
          <span className="font-medium">{metadata.version}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">拓扑：</span>
          <span className="font-medium">{processes.length} 段 / {edges.length} 边</span>
        </div>

        {/* 保存状态 */}
        {saveStatus && (
          <div className={`flex items-center gap-2 ${saveStatus.color}`}>
            {saveStatus.icon}
            <span className="font-medium">{saveStatus.text}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <EditLockButton />
        <DemoModeButton />
        <OnlineUsers />
      </div>
    </div>
  );
}
