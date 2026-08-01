import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { apiSettings, setApiSettings, testApiConnection } = useAppStore();
  const [local, setLocal] = useState({ ...apiSettings });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    setApiSettings(local);
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    // Temporarily save to store so test uses latest values
    setApiSettings(local);
    const result = await testApiConnection();
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <h2 className="text-lg font-semibold text-slate-900">API 设置</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <Input
            label="API Base URL"
            placeholder="https://api.openai.com/v1"
            value={local.baseUrl}
            onChange={(e) => setLocal({ ...local, baseUrl: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">API Key</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-150"
              placeholder="sk-..."
              value={local.apiKey}
              onChange={(e) => setLocal({ ...local, apiKey: e.target.value })}
            />
          </div>
          <Input
            label="Model"
            placeholder="gpt-4o"
            value={local.model}
            onChange={(e) => setLocal({ ...local, model: e.target.value })}
          />

          {/* Test button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              loading={testing}
              onClick={handleTest}
            >
              测试连接
            </Button>
            {testResult && (
              <div
                className={`mt-2 text-xs px-3 py-2 rounded-lg ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="ghost" size="md" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
