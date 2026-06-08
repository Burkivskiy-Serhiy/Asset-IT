'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, Settings as SettingsIcon, Save, Loader2, Mail, MessageSquare, 
  HardDrive, AlertOctagon, CheckCircle2, CloudLightning, Globe2, Database, 
  Coins, X, Trash2, ShieldCheck, SlidersHorizontal, History, ShieldAlert,
  Users, Send, Plus, UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/context/SettingsContext';

export default function SettingsPage() {
  const { settings, loading: isContextLoading, refreshSettings } = useSettings();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'audit' | 'users'>('general');
  const [realLogs, setRealLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'tech' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [currency, setCurrency] = useState('UAH');
  const [assetPrefix, setAssetPrefix] = useState('ITA-');
  const [emailNotif, setEmailNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [backupInterval, setBackupInterval] = useState('daily');
  const [backupTarget, setBackupTarget] = useState('s3');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isResettingDb, setIsResettingDb] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  

  useEffect(() => {
    if (!isContextLoading && settings) {
      setCurrency(settings.currency || 'UAH');
      setAssetPrefix(settings.assetPrefix || 'ITA-');
      setEmailNotif(settings.emailNotif ?? true);
      setSlackNotif(settings.slackNotif ?? false);
      setSlackWebhook(settings.slackWebhook || '');
      setMaintenanceMode(settings.maintenanceMode ?? false);
      
      setIsLoadingPage(false);
      setTimeout(() => setHasChanges(false), 0);
    }
  }, [settings, isContextLoading]);

  useEffect(() => {
    if (!isLoadingPage) {
      setHasChanges(true);
    }
  }, [currency, assetPrefix, emailNotif, slackNotif, slackWebhook, maintenanceMode, isLoadingPage]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        console.error('Помилка сервера при завантаженні користувачів');
      }
    } catch (error) {
      console.error('Помилка мережі:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
          const res = await fetch('/api/logs');
          if (res.ok) {
            const data = await res.json();
            setRealLogs(data);
          } else {
            console.error('Помилка сервера при завантаженні логів');
          }
        } catch (error) {
          console.error('Помилка мережі при завантаженні логів:', error);
        } finally {
          setIsLoadingLogs(false);
        }
      };

      fetchLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency, assetPrefix, emailNotif, slackNotif, slackWebhook, maintenanceMode,
        }),
      });

      if (response.ok) {
        await refreshSettings(); 
        setHasChanges(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert('Помилка при збереженні налаштувань на сервері');
      }
    } catch (error) {
      console.error(error);
      alert('Помилка мережі при збереженні');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Ви впевнені, що хочете назавжди видалити цього користувача?')) return;
    try {

      setUsers(users.filter(u => u.id !== userId)); 
    } catch (error) {
      console.error(error);
      alert('Помилка при видаленні.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingUser(true);
    try {

      setIsEditModalOpen(false);
      fetchUsers(); 
    } catch (error) {
      console.error(error);
      alert('Помилка при збереженні.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (res.ok) {
        setIsUserModalOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'tech' });
        fetchUsers(); 
      } else {
        alert(`Помилка: ${data.error || 'Не вдалося створити користувача'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Помилка мережі при створенні користувача');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'tech' : 'admin';
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        const data = await res.json();
        alert(`Помилка зміни ролі: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Помилка мережі при зміні ролі');
    }
  };

  const handleExecuteDatabaseReset = async () => {
    setIsResettingDb(true);
    try {
      const response = await fetch('/api/settings', { method: 'DELETE' });
      if (response.ok) {
        setIsResetModalOpen(false);
        setConfirmText('');
        setShowResetSuccess(true);
        setTimeout(() => setShowResetSuccess(false), 4500);
        await refreshSettings();
      } else {
        alert('Не вдалося виконати скидання системних даних на сервері');
      }
    } catch (error) {
      console.error(error);
      alert('Помилка мережі при спробі скинути дані.');
    } finally {
      setIsResettingDb(false);
    }
  };

  const handleCreateBackupNow = async () => {
    setIsBackingUp(true);
    setBackupSuccess(false);
    try {
      const response = await fetch('/api/settings/export');
      if (!response.ok) throw new Error('Помилка завантаження файлу бекапу');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `it-asset-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 4000);
    } catch (error) {
      console.error(error);
      alert('Не вдалося згенерувати та завантажити бекап системи.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleTestSlack = async () => {
    if (!slackWebhook) return alert('Спочатку введіть Webhook URL!');
    setIsTestingSlack(true);
    
    try {
      const res = await fetch('/api/slack/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: slackWebhook }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Тестове повідомлення успішно відправлено в Slack!');
      } else {
        alert(`❌ Помилка: ${data.error || 'Щось пішло не так'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Помилка мережі при спробі відправити тест.');
    } finally {
      setIsTestingSlack(false);
    }
  };

  if (isLoadingPage) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm text-gray-400 animate-pulse">Зчитування конфігурації...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-5xl mx-auto relative">
      
      <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 bg-red-950/90 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl backdrop-blur-md shadow-2xl transition-all duration-500 ${showResetSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <Trash2 size={18} className="text-red-400 animate-bounce" />
        <div>
          <p className="text-sm font-semibold">Базу даних реініціалізовано!</p>
          <p className="text-xs text-red-400/80">Усі системні активи та логи очищено.</p>
        </div>
      </div>

      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-20 pt-4 pb-4 -mt-4 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Налаштування</h1>
          <p className="text-muted-foreground text-sm">Глобальна конфігурація обліку активів, безпеки та сповіщень.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-sm text-emerald-400 transition-all duration-300 ${showSuccess ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
            <CheckCircle2 size={16} /> Збережено
          </div>
          <Button 
            onClick={handleSaveChanges} 
            disabled={!hasChanges || isSaving}
            className={`gap-2 transition-all ${hasChanges && !isSaving ? 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'bg-white/5 text-gray-400'}`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Зберегти
          </Button>
        </div>
      </header>

      <div className="flex gap-2 border-b border-white/5 pb-px overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'general' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
        >
          <SlidersHorizontal size={16} /> Основні параметри
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'security' ? 'border-red-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
        >
          <ShieldCheck size={16} /> Безпека та Дані
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
        >
          <Users size={16} /> Користувачі
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'audit' ? 'border-amber-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
        >
          <History size={16} /> Журнал аудиту
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {activeTab === 'general' && (
          <>
            <div className="lg:col-span-7 space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
              <Card className="glass-panel border-none bg-[#141416]/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Globe2 size={20} className="text-emerald-400" /> Регіональні налаштування
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                      <Coins size={12} /> Основна Валюта
                    </label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="UAH" className="bg-[#141416]">Гривня (₴ UAH)</option>
                      <option value="USD" className="bg-[#141416]">Долар ($ USD)</option>
                      <option value="EUR" className="bg-[#141416]">Євро (€ EUR)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Префікс інвентарних номерів</label>
                    <Input value={assetPrefix} onChange={(e) => setAssetPrefix(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel border-none bg-[#141416]/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Bell size={20} className="text-amber-400" /> Інтеграції та Сповіщення
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-white">Email-звіти адміністратору</span>
                    </div>
                    <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={16} className="text-primary" />
                      <span className="text-sm font-medium text-white">Slack Інтеграція</span>
                    </div>
                    <Switch checked={slackNotif} onCheckedChange={setSlackNotif} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${slackNotif ? 'max-h-32 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase">Slack Webhook URL</label>
                      <div className="flex gap-2">
                        <Input placeholder="https://hooks.slack.com/services/..." value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} className="flex-1 bg-black/40 border-white/10 text-white text-xs font-mono" />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleTestSlack}
                          disabled={!slackWebhook || isTestingSlack}
                          className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-primary transition-colors"
                        >
                          {isTestingSlack ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
              <Card className="glass-panel border-none bg-[#141416]/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <HardDrive size={20} className="text-blue-400" /> Ресурси системи
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-300">Сховище зображень</span>
                      <span className="text-gray-400 font-mono">3.4 GB / 10 GB</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '34%' }} />
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-300">Облік активів (Ліцензія)</span>
                      <span className="text-gray-400 font-mono">412 / 1000 шт.</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '41%' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="col-span-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="glass-panel border-none bg-[#141416]/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Users size={20} className="text-blue-400" /> Управління користувачами
                </CardTitle>
                <Button onClick={() => setIsUserModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                  <Plus size={16} /> Додати користувача
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-white/5 relative min-h-[200px]">
                  
                  {isLoadingUsers && (
                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-400" size={32} />
                    </div>
                  )}

                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-gray-400 font-semibold border-b border-white/5 text-xs uppercase tracking-wider">
                        <th className="p-4">Ім'я</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Роль (Клік для зміни)</th>
                        <th className="p-4">Дата створення</th>
                        <th className="p-4 text-right">Дії</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {users.length > 0 ? (
                       users.map((user) => (
                          <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-medium text-white">{user.name}</td>
                            <td className="p-4 text-gray-400">{user.email}</td>
                            <td className="p-4">
                              <button 
                                onClick={() => handleToggleRole(user.id, user.role)}
                                title="Натисніть для перемикання ролі"
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer hover:scale-105 ${
                                user.role === 'admin' 
                                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                              }`}>
                                {user.role === 'admin' ? '👑 Адміністратор' : '🛠️ Технік'}
                              </button>
                            </td>
                            <td className="p-4 text-xs text-gray-400">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('uk-UA') : 'Невідомо'}
                            </td>
                            <td className="p-4 flex justify-end gap-2 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }}
                                title="Редагувати"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                              >
                                <SettingsIcon size={14} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteUser(user.id)}
                                title="Видалити"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        !isLoadingUsers && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                              Користувачів не знайдено.
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="col-span-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-panel border-none bg-[#141416]/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Database size={20} className="text-purple-400" /> Резервне копіювання
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase">Періодичність</label>
                      <select value={backupInterval} onChange={(e) => setBackupInterval(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="hourly" className="bg-[#141416]">Щогодини</option>
                        <option value="daily" className="bg-[#141416]">Щодня о 03:00</option>
                        <option value="weekly" className="bg-[#141416]">Щотижня (Нд)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase">Сховище</label>
                      <select value={backupTarget} onChange={(e) => setBackupTarget(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="local" className="bg-[#141416]">Локальний диск</option>
                        <option value="s3" className="bg-[#141416]">Хмара AWS S3</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-4">
                    <Button type="button" variant="outline" onClick={handleCreateBackupNow} disabled={isBackingUp} className={`h-9 px-4 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 ${isBackingUp ? 'bg-purple-500/10' : ''}`}>
                      {isBackingUp ? <Loader2 size={14} className="animate-spin mr-2" /> : <CloudLightning size={14} className="mr-2" />}
                      Експортувати бекап (.json)
                    </Button>
                    {backupSuccess && <span className="text-xs font-medium text-emerald-400 animate-pulse">✅ Файл завантажено!</span>}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel border-none bg-red-500/5 backdrop-blur-md border border-red-500/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <SettingsIcon size={20} className="text-red-400" /> Небезпечна зона
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-400 flex items-center gap-1.5">
                        <AlertOctagon size={16} /> Tech Maintenance
                      </p>
                      <p className="text-xs text-gray-400">Закрити доступ для всіх користувачів крім Адміна.</p>
                    </div>
                    <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} className={maintenanceMode ? "bg-red-500" : ""} />
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsResetModalOpen(true)} className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                    <Trash2 size={16} className="mr-2" /> Скинути базу даних (Wipe DB)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="col-span-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="glass-panel border-none bg-[#141416]/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <ShieldAlert size={20} className="text-amber-400" /> Системні логи
                </CardTitle>
                <span className="text-xs text-gray-400 font-mono">
                  {isLoadingLogs ? 'Завантаження...' : `Всього записів: ${realLogs.length}`}
                </span>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-white/5 relative min-h-[200px]">
                  
                  {isLoadingLogs && (
                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-amber-400" size={32} />
                    </div>
                  )}

                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-gray-400 font-semibold border-b border-white/5 text-xs uppercase tracking-wider">
                        <th className="p-4">Час</th>
                        <th className="p-4">Користувач / Роль</th>
                        <th className="p-4">Тип</th>
                        <th className="p-4">Джерело</th>
                        <th className="p-4">Повідомлення</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {realLogs.length > 0 ? (
                        realLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 text-xs font-mono text-gray-400">
                              {log.time || new Date(log.createdAt).toLocaleString('uk-UA')}
                            </td>
                            <td className="p-4 font-medium">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${
                                log.actor?.toLowerCase().includes('admin') || log.actor?.toLowerCase().includes('адмін')
                                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                  : log.actor?.toLowerCase().includes('tech')
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                  : log.actor === 'Система' || !log.actor
                                  ? 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              }`}>
                                {log.actor || 'Система'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                log.type?.toLowerCase().includes('error') || log.type?.toLowerCase().includes('помилка')
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                  : log.type?.toLowerCase().includes('warn')
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-gray-400">{log.source}</td>
                            <td className="p-4 font-medium text-white">{log.text}</td>
                          </tr>
                        ))
                      ) : (
                        !isLoadingLogs && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                              Логів поки немає. Система чиста! ✨
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* МОДАЛЬНЕ ВІКНО: СТВОРЕННЯ КОРИСТУВАЧА */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-400">
                <UserPlus size={22} />
                <h3 className="text-lg font-bold">Новий користувач системи</h3>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Повне ім'я</label>
                  <Input 
                    required
                    placeholder="Олександр Коваленко" 
                    value={newUser.name} 
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
                    className="bg-black/40 border-white/10 text-white focus-visible:ring-blue-500/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Електронна пошта</label>
                  <Input 
                    required
                    type="email"
                    placeholder="example@corp.com" 
                    value={newUser.email} 
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                    className="bg-black/40 border-white/10 text-white focus-visible:ring-blue-500/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Пароль</label>
                  <Input 
                    required
                    type="password"
                    placeholder="••••••••" 
                    value={newUser.password} 
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                    className="bg-black/40 border-white/10 text-white focus-visible:ring-blue-500/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Глобальна роль</label>
                  <select 
                    value={newUser.role} 
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})} 
                    className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="tech" className="bg-[#141416]">🛠️ Технік (Доступ до обробки активів)</option>
                    <option value="admin" className="bg-[#141416]">👑 Адміністратор (Повний доступ)</option>
                  </select>
                </div>
              </div>
              <div className="p-6 pt-4 border-t border-white/5 bg-black/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-white">Скасувати</Button>
                <Button type="submit" disabled={isCreatingUser} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {isCreatingUser ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Створити обліковий запис
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО: РЕДАГУВАННЯ КОРИСТУВАЧА */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-400">
                <SettingsIcon size={22} />
                <h3 className="text-lg font-bold">Редагування користувача</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Повне ім'я</label>
                  <Input 
                    required
                    value={editingUser.name} 
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} 
                    className="bg-black/40 border-white/10 text-white focus-visible:ring-blue-500/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Електронна пошта</label>
                  <Input 
                    required
                    type="email"
                    value={editingUser.email} 
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
                    className="bg-black/40 border-white/10 text-white focus-visible:ring-blue-500/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase flex justify-between">
                    <span>Глобальна роль</span>
                  </label>
                  <select 
                    value={editingUser.role} 
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} 
                    className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="tech" className="bg-[#141416]">🛠️ Технік (Обмежений доступ)</option>
                    <option value="admin" className="bg-[#141416]">👑 Адміністратор (Повний доступ)</option>
                  </select>
                </div>
              </div>
              <div className="p-6 pt-4 border-t border-white/5 bg-black/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white">Скасувати</Button>
                <Button type="submit" disabled={isUpdatingUser} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {isUpdatingUser ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Зберегти зміни
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО: СКИДАННЯ БД */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-red-500/30 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 pb-4 border-b border-white/5 flex items-start justify-between">
              <div className="flex items-center gap-3 text-red-400">
                <AlertOctagon size={24} />
                <h3 className="text-lg font-bold text-white">Критична операція!</h3>
              </div>
              <button onClick={() => { setIsResetModalOpen(false); setConfirmText(''); }} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">Ця дія повністю видалить таблиці ІТ-активів у базі PostgreSQL. Це <span className="text-red-400 font-semibold">незворотно</span>.</p>
              <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-gray-400">Введіть команду для підтвердження:</p>
                <p className="text-sm font-mono text-center text-white font-bold bg-black/40 py-1.5 rounded-md select-none">СКИДАННЯ</p>
              </div>
              <Input placeholder="Введіть код..." value={confirmText} onChange={(e) => setConfirmText(e.target.value)} disabled={isResettingDb} className="bg-black/40 border-white/10 text-white font-mono text-center focus-visible:ring-red-500/50" />
            </div>
            <div className="p-6 pt-4 border-t border-white/5 bg-black/20 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setIsResetModalOpen(false); setConfirmText(''); }} disabled={isResettingDb} className="text-gray-400 hover:text-white">Скасувати</Button>
              <Button disabled={confirmText !== 'СКИДАННЯ' || isResettingDb} onClick={handleExecuteDatabaseReset} className={`gap-2 ${confirmText === 'СКИДАННЯ' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-950/20 text-red-400/40'}`}>
                {isResettingDb ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Очистити все
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}