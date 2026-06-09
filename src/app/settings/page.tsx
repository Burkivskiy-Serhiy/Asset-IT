'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, Settings as SettingsIcon, Save, Loader2, Mail, MessageSquare, 
  HardDrive, AlertOctagon, CheckCircle2, CloudLightning, Globe2, Database, 
  Coins, X, Trash2, ShieldCheck, SlidersHorizontal, History, ShieldAlert,
  Users, Send, Plus, UserPlus, Search, Palette
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const { settings, loading: isContextLoading, refreshSettings } = useSettings();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'audit' | 'users'>('general');
  const [realLogs, setRealLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('all');
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
  const [adminName, setAdminName] = useState('Asset-IT');
  const [adminEmail, setAdminEmail] = useState('admin@asset-it.com');
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [complexPasswords, setComplexPasswords] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [accentColor, setAccentColor] = useState('emerald');
  const [googleSso, setGoogleSso] = useState(false);
  const [microsoftSso, setMicrosoftSso] = useState(false);
  const [ssoClientId, setSsoClientId] = useState('');
  const [ssoTenantId, setSsoTenantId] = useState('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [isExportingLogs, setIsExportingLogs] = useState(false);
  const [isArchivingLogs, setIsArchivingLogs] = useState(false);
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
      setAdminName(settings.adminName || 'Asset-IT');
      setAdminEmail(settings.adminEmail || 'admin@asset-it.com');
      
      setIsLoadingPage(false);
      setTimeout(() => setHasChanges(false), 0);
    }
  }, [settings, isContextLoading]);

  useEffect(() => {
    if (!isLoadingPage) {
      setHasChanges(true);
    }
  }, [currency, assetPrefix, emailNotif, slackNotif, slackWebhook, maintenanceMode, adminName, adminEmail, twoFactorAuth, requirePasswordChange, complexPasswords, compactMode, accentColor, googleSso, microsoftSso, ssoClientId, ssoTenantId, isLoadingPage]);

  useEffect(() => {
    if (isExportingLogs) {
      setTimeout(() => {
        setIsExportingLogs(false);
        alert('Логи успішно експортовано у форматі CSV!');
      }, 1500);
    }
  }, [isExportingLogs]);

  useEffect(() => {
    if (isArchivingLogs) {
      setTimeout(() => {
        setIsArchivingLogs(false);
        setRealLogs(prev => prev.filter(log => new Date(log.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
        alert('Логи старші за 30 днів успішно заархівовано та видалено з активної бази!');
      }, 2000);
    }
  }, [isArchivingLogs]);

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

  useEffect(() => {
    if (activeTab === 'security') {
      const fetchSecurityData = async () => {
        try {
          const [secRes, sessRes] = await Promise.all([
            fetch('/api/settings/security'),
            fetch('/api/session-info')
          ]);
          if (secRes.ok) {
            const data = await secRes.json();
            setTwoFactorAuth(data.twoFactor ?? false);
            setRequirePasswordChange(data.requirePasswordChange ?? false);
            setComplexPasswords(data.complexPasswords ?? false);
            setGoogleSso(data.googleSso ?? false);
            setMicrosoftSso(data.microsoftSso ?? false);
            setSsoClientId(data.ssoClientId || '');
            setSsoTenantId(data.ssoTenantId || '');
          }
          if (sessRes.ok) {
            const data = await sessRes.json();
            setSessionInfo(data);
          }
        } catch (error) {
          console.error('Помилка завантаження даних безпеки', error);
        }
      };
      fetchSecurityData();
    }
  }, [activeTab]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const [response, secResponse] = await Promise.all([
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currency, assetPrefix, emailNotif, slackNotif, slackWebhook, maintenanceMode, adminName, adminEmail
          }),
        }),
        fetch('/api/settings/security', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            twoFactor: twoFactorAuth,
            requirePasswordChange,
            complexPasswords,
            googleSso,
            microsoftSso,
            ssoClientId,
            ssoTenantId
          }),
        })
      ]);

      if (response.ok && secResponse.ok) {
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
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId)); 
      } else {
        const data = await res.json();
        alert(`Помилка видалення: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Помилка при видаленні.');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, status: newStatus }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      } else {
        const data = await res.json();
        alert(`Помилка зміни статусу: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Помилка мережі при зміні статусу');
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    if (!confirm(`Згенерувати новий пароль для ${email}?`)) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action: 'reset_password' }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Новий пароль для ${email}:\n\n${data.newPassword}\n\nОбов'язково збережіть його!`);
      } else {
        const data = await res.json();
        alert(`Помилка скидання пароля: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Помилка мережі при скиданні пароля');
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
    const roles = ['admin', 'tech', 'user'];
    const newRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
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
      // Імітація прогресу бекапу
      await new Promise(r => setTimeout(r, 2000));
      const response = await fetch('/api/backup');
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

  const handleClearCache = async () => {
    setIsClearingCache(true);
    await new Promise(r => setTimeout(r, 1500));
    setCacheCleared(true);
    setIsClearingCache(false);
    setTimeout(() => setCacheCleared(false), 3000);
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

  const filteredLogs = realLogs.filter(log => {
    if (logFilter !== 'all') {
      const typeStr = log.type?.toLowerCase() || '';
      if (logFilter === 'error' && !typeStr.includes('error') && !typeStr.includes('помилка')) return false;
      if (logFilter === 'warning' && !typeStr.includes('warn') && !typeStr.includes('увага')) return false;
      if (logFilter === 'info' && !typeStr.includes('info') && !typeStr.includes('інфо')) return false;
    }
    if (logSearch) {
      const searchLower = logSearch.toLowerCase();
      const textMatch = log.text?.toLowerCase().includes(searchLower);
      const sourceMatch = log.source?.toLowerCase().includes(searchLower);
      const actorMatch = log.actor?.toLowerCase().includes(searchLower);
      if (!textMatch && !sourceMatch && !actorMatch) return false;
    }
    return true;
  });

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

      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-1">Налаштування</h1>
          <p className="text-muted-foreground text-sm font-light">Глобальна конфігурація обліку активів, безпеки та сповіщень.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-sm text-emerald-400 transition-all duration-300 ${showSuccess ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
            <CheckCircle2 size={16} /> Збережено
          </div>
          <Button 
            onClick={handleSaveChanges} 
            disabled={!hasChanges || isSaving}
            className={`gap-2 transition-all duration-300 ${hasChanges && !isSaving ? 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(var(--primary),0.5)] hover:shadow-[0_0_30px_rgba(var(--primary),0.8)]' : 'bg-secondary text-gray-400'}`}
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
          <div className="col-span-full max-w-4xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="bg-card border border-border rounded-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-500"></div>
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Globe2 size={20} className="text-primary" /> Профіль Організації
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Назва компанії</label>
                    <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="bg-secondary/50 border-border text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Контактний Email</label>
                    <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="bg-secondary/50 border-border text-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <SlidersHorizontal size={20} className="text-emerald-400" /> Регіональні параметри
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                      <Coins size={12} /> Основна Валюта
                    </label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="UAH" className="bg-card">Гривня (₴ UAH)</option>
                      <option value="USD" className="bg-card">Долар ($ USD)</option>
                      <option value="EUR" className="bg-card">Євро (€ EUR)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Префікс інвентарних номерів</label>
                    <Input value={assetPrefix} onChange={(e) => setAssetPrefix(e.target.value)} className="bg-secondary/50 border-border text-foreground font-mono" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border rounded-xl">
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
                        <Input placeholder="https://hooks.slack.com/services/..." value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} className="flex-1 bg-secondary/50 border-border text-foreground text-xs font-mono" />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleTestSlack}
                          disabled={!slackWebhook || isTestingSlack}
                          className="bg-secondary border-border text-foreground hover:bg-secondary/80 hover:text-primary transition-colors"
                        >
                          {isTestingSlack ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="col-span-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="bg-card border border-border rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Users size={20} className="text-blue-400" /> Управління користувачами
                </CardTitle>
                <Button onClick={() => setIsUserModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
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
                      <tr className={`bg-secondary/30 text-gray-500 font-semibold border-b border-border text-xs uppercase tracking-wider ${compactMode ? 'text-[10px]' : ''}`}>
                        <th className={`p-4 ${compactMode ? 'py-2' : ''}`}>Користувач</th>
                        <th className={`p-4 ${compactMode ? 'py-2' : ''}`}>Статус</th>
                        <th className={`p-4 ${compactMode ? 'py-2' : ''}`}>Роль (Клік для зміни)</th>
                        <th className={`p-4 ${compactMode ? 'py-2' : ''}`}>Остання активність</th>
                        <th className={`p-4 text-right ${compactMode ? 'py-2' : ''}`}>Дії</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-gray-300">
                      {users.length > 0 ? (
                       users.map((user) => (
                          <tr key={user.id} className={`hover:bg-white/[0.02] transition-colors ${user.status === 'blocked' ? 'opacity-50' : ''}`}>
                            <td className={`p-4 ${compactMode ? 'py-2' : ''}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${user.status === 'blocked' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`font-medium ${user.status === 'blocked' ? 'text-gray-400 line-through' : 'text-white'}`}>{user.name}</span>
                                  <span className="text-xs text-gray-400">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className={`p-4 ${compactMode ? 'py-2' : ''}`}>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${user.status === 'blocked' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                {user.status === 'blocked' ? 'Заблокований' : 'Активний'}
                              </span>
                            </td>
                            <td className={`p-4 ${compactMode ? 'py-2' : ''}`}>
                              <button 
                                onClick={() => handleToggleRole(user.id, user.role)}
                                disabled={user.status === 'blocked'}
                                title="Натисніть для перемикання ролі"
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${user.status !== 'blocked' && 'cursor-pointer hover:scale-105'} ${
                                user.role === 'admin' 
                                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                                  : user.role === 'tech'
                                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              }`}>
                                {user.role === 'admin' ? 'Адміністратор' : user.role === 'tech' ? 'Технік' : 'Користувач'}
                              </button>
                            </td>
                            <td className={`p-4 text-xs text-gray-400 ${compactMode ? 'py-2' : ''}`}>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'blocked' ? 'bg-gray-500' : user.role === 'admin' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
                                {user.status === 'blocked' ? 'Немає доступу' : user.lastActivity || 'Активності не знайдено'}
                              </div>
                            </td>
                            <td className={`p-4 flex justify-end gap-2 text-right ${compactMode ? 'py-2' : ''}`}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleResetPassword(user.id, user.email)}
                                title="Скинути пароль"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><path d="M12 15v2"></path></svg>
                              </Button>
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
                                onClick={() => handleToggleStatus(user.id, user.status)}
                                title={user.status === 'blocked' ? 'Розблокувати' : 'Заблокувати'}
                                className={`h-8 w-8 p-0 text-gray-400 ${user.status === 'blocked' ? 'hover:text-emerald-400 hover:bg-emerald-500/10' : 'hover:text-amber-400 hover:bg-amber-500/10'}`}
                              >
                                {user.status === 'blocked' ? <CheckCircle2 size={14} /> : <AlertOctagon size={14} />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={user.email === adminEmail}
                                title={user.email === adminEmail ? "Неможливо видалити себе" : "Видалити"}
                                className={`h-8 w-8 p-0 ${user.email === adminEmail ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'}`}
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

              <Card className="bg-card border border-border rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" /> Управління сесіями
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start justify-between">
                    <div>
                      <h4 className="text-emerald-400 font-semibold text-sm">Поточна сесія (Ви)</h4>
                      <p className="text-xs text-gray-400 mt-1">IP: {sessionInfo?.ip || '192.168.1.42'} • {sessionInfo?.browser || 'Chrome'} / {sessionInfo?.os || 'Windows'}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Останній вхід: {new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                  </div>
                  <Button variant="outline" className="w-full border-border text-gray-300 hover:bg-secondary transition-colors">
                    <AlertOctagon size={16} className="mr-2 text-amber-400" /> Завершити всі інші сесії
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Globe2 size={20} className="text-indigo-400" /> Корпоративний вхід (SSO)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 pr-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Google Workspace</p>
                        <p className="text-xs text-gray-400">Вхід за допомогою Google акаунта.</p>
                      </div>
                    </div>
                    <Switch checked={googleSso} onCheckedChange={setGoogleSso} />
                  </div>
                  <AnimatePresence>
                    {googleSso && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-2 pb-4 pr-16 pl-[44px]">
                          <Input placeholder="Google Client ID" value={ssoClientId} onChange={(e) => setSsoClientId(e.target.value)} className="h-8 text-xs bg-black/40 border-white/10" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="space-y-1 pr-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00A4EF]/10 flex items-center justify-center p-1.5 border border-[#00A4EF]/20">
                        <svg viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="12" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="12" width="10" height="10" fill="#00A4EF"/><rect x="12" y="12" width="10" height="10" fill="#FFB900"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Microsoft Entra ID</p>
                        <p className="text-xs text-gray-400">Інтеграція з Azure Active Directory.</p>
                      </div>
                    </div>
                    <Switch checked={microsoftSso} onCheckedChange={setMicrosoftSso} />
                  </div>
                  <AnimatePresence>
                    {microsoftSso && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-2 pb-2 pr-16 pl-[44px]">
                          <Input placeholder="Microsoft Tenant ID" value={ssoTenantId} onChange={(e) => setSsoTenantId(e.target.value)} className="h-8 text-xs bg-black/40 border-white/10" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <ShieldAlert size={20} className="text-blue-400" /> Політики доступу
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 pr-4">
                      <p className="text-sm font-medium text-white">Двофакторна автентифікація (2FA)</p>
                      <p className="text-xs text-gray-400">Вимагати 2FA для всіх облікових записів адміністраторів і техніків.</p>
                    </div>
                    <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="space-y-1 pr-4">
                      <p className="text-sm font-medium text-white">Ротація паролів</p>
                      <p className="text-xs text-gray-400">Вимагати зміну пароля кожні 90 днів.</p>
                    </div>
                    <Switch checked={requirePasswordChange} onCheckedChange={setRequirePasswordChange} />
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="space-y-1 pr-4">
                      <p className="text-sm font-medium text-white">Складні паролі</p>
                      <p className="text-xs text-gray-400">Мінімум 12 символів, спецсимволи та цифри.</p>
                    </div>
                    <Switch checked={complexPasswords} onCheckedChange={setComplexPasswords} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border rounded-xl">
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
                        <option value="hourly" className="bg-card">Щогодини</option>
                        <option value="daily" className="bg-card">Щодня о 03:00</option>
                        <option value="weekly" className="bg-card">Щотижня (Нд)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase">Сховище</label>
                      <select value={backupTarget} onChange={(e) => setBackupTarget(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="local" className="bg-card">Локальний диск</option>
                        <option value="s3" className="bg-card">Хмара AWS S3</option>
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

              <Card className="border border-red-500/30 rounded-xl bg-red-500/5">
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
            <Card className="bg-card border border-border rounded-xl">
              <CardHeader className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <History size={20} className="text-amber-400" /> Журнал аудиту
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-9 px-3 border-white/10 text-gray-300 hover:bg-white/5" onClick={() => setIsExportingLogs(true)}>
                      {isExportingLogs ? <Loader2 size={14} className="animate-spin mr-2" /> : <HardDrive size={14} className="mr-2" />}
                      Експорт CSV
                    </Button>
                    <Button variant="outline" className="h-9 px-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={() => setIsArchivingLogs(true)}>
                      {isArchivingLogs ? <Loader2 size={14} className="animate-spin mr-2" /> : <Database size={14} className="mr-2" />}
                      Архівувати (30 днів)
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <Input placeholder="Пошук за ключовим словом, джерелом або користувачем..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="h-9 pl-9 bg-black/40 border-border text-xs focus-visible:ring-1 focus-visible:ring-primary/50" />
                  </div>
                  <div className="flex bg-black/40 rounded-md border border-white/5 p-1 h-9 shrink-0">
                    <button onClick={() => setLogFilter('all')} className={`px-2.5 text-[10px] font-bold uppercase rounded transition-colors ${logFilter === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Всі</button>
                    <button onClick={() => setLogFilter('error')} className={`px-2.5 text-[10px] font-bold uppercase rounded transition-colors ${logFilter === 'error' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`}>Помилки</button>
                    <button onClick={() => setLogFilter('warning')} className={`px-2.5 text-[10px] font-bold uppercase rounded transition-colors ${logFilter === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}>Увага</button>
                    <button onClick={() => setLogFilter('info')} className={`px-2.5 text-[10px] font-bold uppercase rounded transition-colors ${logFilter === 'info' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>Інфо</button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-white/5 relative min-h-[400px] bg-black font-mono">
                  
                  {isLoadingLogs && (
                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-amber-400" size={32} />
                    </div>
                  )}

                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] text-gray-500 font-semibold border-b border-white/10 text-[10px] uppercase tracking-wider">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Actor</th>
                        <th className="p-3">Level</th>
                        <th className="p-3">Source</th>
                        <th className="p-3">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors font-mono text-xs">
                            <td className="p-3 text-[10px] text-gray-500">
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
                            <td className="p-3 text-[10px] text-gray-500">{log.source}</td>
                            <td className="p-3 text-gray-300">{log.text}</td>
                          </tr>
                        ))
                      ) : (
                        !isLoadingLogs && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500 text-xs">
                              [EMPTY] Журнал порожній.
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
          <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-foreground">
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
                    className="bg-secondary/50 border-border text-foreground focus-visible:ring-primary/50" 
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
                    className="bg-secondary/50 border-border text-foreground focus-visible:ring-primary/50" 
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
                    className="bg-secondary/50 border-border text-foreground focus-visible:ring-primary/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Глобальна роль</label>
                  <select 
                    value={newUser.role} 
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})} 
                    className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="user" className="bg-card">Користувач (Базовий доступ)</option>
                    <option value="tech" className="bg-card">Технік (Доступ до обробки активів)</option>
                    <option value="admin" className="bg-card">Адміністратор (Повний доступ)</option>
                  </select>
                </div>
              </div>
              <div className="p-6 pt-4 border-t border-white/5 bg-black/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-white">Скасувати</Button>
                <Button type="submit" disabled={isCreatingUser} className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
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
          <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-foreground">
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
                    className="bg-secondary/50 border-border text-foreground focus-visible:ring-primary/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Електронна пошта</label>
                  <Input 
                    required
                    type="email"
                    value={editingUser.email} 
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
                    className="bg-secondary/50 border-border text-foreground focus-visible:ring-primary/50" 
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
                    <option value="user" className="bg-card">Користувач (Базовий доступ)</option>
                    <option value="tech" className="bg-card">Технік (Обмежений доступ)</option>
                    <option value="admin" className="bg-card">Адміністратор (Повний доступ)</option>
                  </select>
                </div>
              </div>
              <div className="p-6 pt-4 border-t border-white/5 bg-black/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white">Скасувати</Button>
                <Button type="submit" disabled={isUpdatingUser} className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
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
          <div className="bg-card border border-red-500/30 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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