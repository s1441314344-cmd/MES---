import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRecipeStore } from '@/store/useRecipeStore';
import { useCollabStore } from '@/store/useCollabStore';
import { StatusBar } from '@/components/collab/StatusBar';
import { DemoModeBanner } from '@/components/collab/DemoModeBanner';
import { Download, Upload, RotateCcw, Save, Loader2, Settings, Workflow, FlaskConical, Layers3 } from 'lucide-react';
import { validateRecipeConnections, formatValidationMessage } from '@/utils/recipeValidator';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { exportJSON, importJSON, reset, saveToServer, isSaving, metadata, processes, edges } = useRecipeStore();
  const { mode, userId, isLockedByMe, connectionStatus } = useCollabStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipe-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        importJSON(text);
      };
      reader.readAsText(file);
    }
  };

  const handleSave = async () => {
    if (!isLockedByMe() || mode !== 'edit') {
      alert('需要编辑权限');
      return;
    }

    if (!userId) {
      console.error('[保存] 错误:userId 为空');
      alert('用户ID未设置,请刷新页面重试');
      return;
    }

    // 获取当前配方数据进行校验
    const { processes, edges } = useRecipeStore.getState();

    // 执行连线校验
    const validationResult = validateRecipeConnections(processes, edges);

    // 如果有警告，提示用户确认
    if (validationResult.warnings.length > 0) {
      const warningMessage = formatValidationMessage(validationResult);
      const confirmMessage = `${warningMessage}\n\n是否仍然继续保存？`;

      if (!window.confirm(confirmMessage)) {
        console.log('[保存] 用户取消保存（连线校验警告）');
        return;
      }
    }

    console.log('[保存] 用户点击保存按钮', {
      userId,
      isLockedByMe: isLockedByMe()
    });

    setSaving(true);
    try {
      const success = await saveToServer(userId);
      if (success) {
        console.log('[保存] 保存成功,已更新到服务器');
        // 可以添加更友好的提示,但保持简洁
      } else {
        console.error('[保存] 保存失败');
        alert('保存失败,请重试。如果持续失败,请检查是否持有编辑权限。');
      }
    } catch (error) {
      console.error('[保存] 保存异常:', error);
      alert('保存失败,请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(31,111,235,0.10),_transparent_28%),linear-gradient(180deg,#f4f7fb_0%,#eef3f9_100%)] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-[rgba(14,24,38,0.92)] px-6 py-4 text-white backdrop-blur-xl">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1f6feb,#0fa67a)] shadow-lg shadow-blue-950/30">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-slate-400">MES Route Demo</div>
                <h1 className="text-2xl font-semibold leading-tight">工艺路线总览工作台</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <Badge className="border-transparent bg-white/10 text-white">{metadata.name}</Badge>
              <Badge variant="outline" className="border-white/15 text-slate-200">版本 {metadata.version}</Badge>
              <Badge variant="outline" className="border-white/15 text-slate-200">{processes.length} 个工艺段</Badge>
              <Badge variant="outline" className="border-white/15 text-slate-200">{edges.length} 条连接</Badge>
              <Badge
                variant="outline"
                className={connectionStatus === 'offline' ? 'border-amber-300/40 text-amber-100' : 'border-emerald-300/30 text-emerald-100'}
              >
                {connectionStatus === 'offline' ? '离线演示模式' : '实时协作已启用'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/config')}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Settings className="mr-2 h-4 w-4" />
                配置中心
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/workflow-editor')}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Workflow className="mr-2 h-4 w-4" />
                新编排页
                <Badge className="ml-2 border-transparent bg-amber-400/20 text-amber-100">Experimental</Badge>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/bpmn')}
                className="text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                BPMN 原型
              </Button>
            </div>
          </div>

          <div className="flex min-w-[320px] flex-col items-end gap-3">
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Primary Actions</div>
              <div className="text-sm text-slate-300">保存和协作动作优先，导入导出降级为次要操作</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {mode === 'edit' && isLockedByMe() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || isSaving}
                  title="保存到服务器"
                  className="border-emerald-300/30 bg-emerald-500/15 text-emerald-50 hover:bg-emerald-500/25"
                >
                  {saving || isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存当前工艺
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={mode === 'demo'}
                title={mode === 'demo' ? '演示模式下请使用"导出演示数据"' : ''}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Download className="mr-2 h-4 w-4" />
                导出
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                disabled={mode !== 'edit'}
                title={mode !== 'edit' ? '需要编辑权限' : ''}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Upload className="mr-2 h-4 w-4" />
                导入
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                disabled={mode !== 'edit'}
                title={mode !== 'edit' ? '需要编辑权限' : ''}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                重置
              </Button>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </header>

      {/* Status Bar */}
      <StatusBar />

      {/* Demo Mode Banner */}
      <DemoModeBanner />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
