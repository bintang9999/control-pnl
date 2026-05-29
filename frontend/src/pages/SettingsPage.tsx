import { useState, useEffect } from 'react';
import { Save, Key, Shield, HardDrive, Terminal, Bot, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      toast.error('Failed to load settings');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      await api.put(`/settings/${key}`, { value });
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Setting updated successfully');
    } catch (err) {
      toast.error('Failed to update setting');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings/change-password', passwordForm);
      toast.success('Password changed successfully');
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Manage panel configuration and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Toggles */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Shield className="text-blue-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">Feature Access</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Terminal className="text-slate-400" size={18} />
                <div>
                  <p className="text-white font-medium">Web Terminal</p>
                  <p className="text-slate-400 text-xs">Allow direct SSH access via browser</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings['terminal_enabled'] === 'true'}
                  onChange={(e) => handleUpdateSetting('terminal_enabled', e.target.checked ? 'true' : 'false')}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <HardDrive size={16} className="text-slate-400" /> Safe Folder Path
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={settings['safe_folder_path'] || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, safe_folder_path: e.target.value }))}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" 
                />
                <button 
                  onClick={() => handleUpdateSetting('safe_folder_path', settings['safe_folder_path'])}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Key className="text-purple-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
              <input 
                type="password" 
                value={passwordForm.oldPassword}
                onChange={e => setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
              <input 
                type="password" 
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                minLength={6}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> Update Password
            </button>
          </form>
        </div>

        {/* Telegram Notifications */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <MessageSquare className="text-emerald-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">Telegram Alerts</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Bot Token</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={settings['telegram_bot_token'] || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegram_bot_token: e.target.value }))}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" 
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
                <button 
                  onClick={() => handleUpdateSetting('telegram_bot_token', settings['telegram_bot_token'])}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Chat ID</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={settings['telegram_chat_id'] || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" 
                  placeholder="Your chat ID"
                />
                <button 
                  onClick={() => handleUpdateSetting('telegram_chat_id', settings['telegram_chat_id'])}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
              <Bot className="text-rose-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">AI Assistant (Gemini)</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Gemini API Key</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={settings['ai_api_key'] || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, ai_api_key: e.target.value }))}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-rose-500 outline-none" 
                  placeholder="AIzaSy..."
                />
                <button 
                  onClick={() => handleUpdateSetting('ai_api_key', settings['ai_api_key'])}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
