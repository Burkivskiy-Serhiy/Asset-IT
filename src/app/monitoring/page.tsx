'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, Cpu, Activity, Search, Plus, RefreshCw, CheckCircle2, 
  AlertTriangle, XCircle, Wifi, Edit, Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/context/SettingsContext';

interface ServerNode {
  id: string;
  name: string;
  ip: string;
  type: 'database' | 'api' | 'frontend' | 'storage';
  status: 'online' | 'warning' | 'offline';
  cpu: number;
  ram: number;
  uptime: string;
}

interface LogMessage {
  id: string;
  time: string;
  type: 'info' | 'warning' | 'error';
  source: string;
  text: string;
}

const incrementUptime = (uptimeStr: string) => {
  if (uptimeStr.includes('d') || uptimeStr.includes('days')) return uptimeStr;

  const parts = uptimeStr.split(':').map(Number);
  let h = 0, m = 0, s = 0;

  if (parts.length === 3) {
    [h, m, s] = parts;
  } else if (parts.length === 2) {
    [h, m] = parts;
    s = 0; 
  } else {
    return uptimeStr; 
  }

  if (isNaN(h) || isNaN(m) || isNaN(s)) return uptimeStr;

  s++;
  if (s >= 60) {
    s = 0;
    m++;
    if (m >= 60) {
      m = 0;
      h++;
    }
  }

  const format = (val: number) => val.toString().padStart(2, '0');
  return `${format(h)}:${format(m)}:${format(s)}`;
};

export default function MonitoringPage() {
  const { settings, loading } = useSettings();
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', ip: '', type: 'api' as ServerNode['type'] });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [serverToEdit, setServerToEdit] = useState<ServerNode | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const serversRes = await fetch('/api/servers');
      
      if (serversRes.ok) {
        const serversData = await serversRes.json();
        setServers(serversData);
      }
    } catch (err) {
      console.error("Помилка завантаження даних:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (servers.length === 0) return;
    
    const interval = setInterval(() => {
      setServers(prev => prev.map(srv => {
        if (srv.status === 'offline') return srv;
        
        const cpuDelta = Math.floor(Math.random() * 11) - 5;
        const ramDelta = Math.floor(Math.random() * 7) - 3;
        
        const nextCpu = Math.min(Math.max(srv.cpu + cpuDelta, 5), 98);
        const nextRam = Math.min(Math.max(srv.ram + ramDelta, 10), 96);
        
        const nextStatus = nextCpu > 85 || nextRam > 90 ? 'warning' : 'online';

        return {
          ...srv,
          cpu: nextCpu,
          ram: nextRam,
          status: srv.id === 'SRV-02' ? 'warning' : nextStatus
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [servers.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setServers(prev => {
        if (prev.length === 0) return prev;
        
        return prev.map(srv => {
          if (srv.status === 'offline') return srv;
          return {
            ...srv,
            uptime: incrementUptime(srv.uptime)
          };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: LogMessage = {
      id: `log-${Date.now()}`,
      time: timeStr,
      type: 'info',
      source: 'SYS',
      text: 'Виконано ручну діагностику стану вузлів системи'
    };

    try {
      await fetchData();
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
    } catch (err) {
      console.error("Помилка при оновленні:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    const serverData: ServerNode = {
      id: `SRV-${Math.floor(Math.random() * 90) + 10}`,
      name: newServer.name,
      ip: newServer.ip,
      type: newServer.type,
      status: 'online',
      cpu: Math.floor(Math.random() * 30) + 10,
      ram: Math.floor(Math.random() * 40) + 20,
      uptime: '00:00:00' 
    };

    setServers([...servers, serverData]);
    setIsModalOpen(false);
    setNewServer({ name: '', ip: '', type: 'api' });

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const addLog: LogMessage = {
      id: `log-${Date.now()}`,
      time: timeStr,
      type: 'info',
      source: 'SYS',
      text: `Додано новий мережевий вузол: "${serverData.name}" [IP: ${serverData.ip}]`
    };

    try {
      await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverData),
      });

      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addLog),
      });
    } catch (err) {
      console.error("Помилка додавання сервера:", err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverToEdit) return;

    setServers(servers.map(s => s.id === serverToEdit.id ? serverToEdit : s));
    setIsEditModalOpen(false);

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const editLog: LogMessage = {
      id: `log-${Date.now()}`,
      time: timeStr,
      type: 'warning',
      source: 'SYS',
      text: `Змінено конфігурацію вузла: "${serverToEdit.name}" [IP: ${serverToEdit.ip}]`
    };

    try {
      await fetch(`/api/servers/${serverToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverToEdit),
      });

      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editLog),
      });
    } catch (err) {
      console.error("Помилка оновлення сервера або логу:", err);
    }
  };

  const handleDeleteServer = async (id: string) => {
    const serverToDelete = servers.find(s => s.id === id);
    if (!serverToDelete) return;

    if (!window.confirm(`Ви впевнені, що хочете видалити сервер "${serverToDelete.name}" із системи моніторингу?`)) {
      return;
    }

    setServers(servers.filter(s => s.id !== id));

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const deleteLog: LogMessage = {
      id: `log-${Date.now()}`,
      time: timeStr,
      type: 'error',
      source: 'SYS',
      text: `Вузол "${serverToDelete.name}" [IP: ${serverToDelete.ip}] повністю видалено з системи`
    };

    try {
      await fetch(`/api/servers/${id}`, {
        method: 'DELETE',
      });

      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteLog),
      });
    } catch (err) {
      console.error("Помилка видалення сервера або логу:", err);
    }
  };

  const filteredServers = servers.filter(srv => 
    srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    srv.ip.includes(searchQuery)
  );

  const getStatusIcon = (status: ServerNode['status']) => {
    switch (status) {
      case 'online': return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-400" />;
      case 'offline': return <XCircle size={16} className="text-red-400" />;
    }
  };

  const onlineCount = servers.filter(s => s.status === 'online').length;
  const avgCpu = servers.length > 0 ? Math.round(servers.reduce((acc, s) => acc + s.cpu, 0) / servers.filter(s => s.status !== 'offline').length) : 0;

  return (
    <div className="flex flex-col gap-6 min-h-screen text-white relative">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-1">Моніторинг систем</h1>
          <p className="text-muted-foreground text-sm font-light">
            Стан інфраструктури под наглядом: <span className="text-indigo-400 font-medium">{loading ? '...' : settings?.adminName}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-center">
          <Button variant="outline" onClick={handleManualRefresh} className="border-border bg-secondary/50 text-foreground hover:bg-secondary gap-2">
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-primary" : ""} />
            Оновити метрики
          </Button>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:brightness-110 text-white font-semibold transition-all">
                <Plus size={16} className="mr-1" /> Додати вузол
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle>Додати сервер на моніторинг</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Введіть параметри мережевого вузла для підключення до системи збору метрик.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddServer} className="grid gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Назва вузла / Хост</label>
                  <Input required value={newServer.name} onChange={e => setNewServer({...newServer, name: e.target.value})} className="bg-secondary/50 border-border focus:border-primary" placeholder="Наприклад: Redis Cache Node" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase">IP адреса</label>
                  <Input required value={newServer.ip} onChange={e => setNewServer({...newServer, ip: e.target.value})} className="bg-secondary/50 border-border focus:border-primary" placeholder="192.168.1.55" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Тип призначення</label>
                  <select value={newServer.type} onChange={e => setNewServer({...newServer, type: e.target.value as ServerNode['type']})} className="h-10 rounded-md bg-secondary/50 border border-border px-3 text-sm text-foreground focus:border-primary focus:outline-none">
                    <option value="api">Backend API Gateway</option>
                    <option value="database">Database Cluster</option>
                    <option value="frontend">Frontend Service</option>
                    <option value="storage">File / Object Storage</option>
                  </select>
                </div>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-border text-foreground hover:bg-secondary">Скасувати</Button>
                  <Button type="submit" className="bg-primary text-white">Підключити вузол</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Модалка Редагування */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Редагувати сервер</DialogTitle>
            <DialogDescription className="text-gray-400">
              Змініть базові параметри цього вузла.
            </DialogDescription>
          </DialogHeader>
          {serverToEdit && (
            <form onSubmit={handleEditSubmit} className="grid gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Назва вузла / Хост</label>
                <Input required value={serverToEdit.name} onChange={e => setServerToEdit({...serverToEdit, name: e.target.value})} className="bg-secondary/50 border-border focus:border-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">IP адреса</label>
                <Input required value={serverToEdit.ip} onChange={e => setServerToEdit({...serverToEdit, ip: e.target.value})} className="bg-secondary/50 border-border focus:border-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Тип призначення</label>
                <select value={serverToEdit.type} onChange={e => setServerToEdit({...serverToEdit, type: e.target.value as ServerNode['type']})} className="h-10 rounded-md bg-secondary/50 border border-border px-3 text-sm text-foreground focus:border-primary focus:outline-none">
                  <option value="api">Backend API Gateway</option>
                  <option value="database">Database Cluster</option>
                  <option value="frontend">Frontend Service</option>
                  <option value="storage">File / Object Storage</option>
                </select>
              </div>
              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-border text-foreground hover:bg-secondary">Скасувати</Button>
                <Button type="submit" className="bg-primary text-white">Зберегти зміни</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Швидкі показники */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase font-medium">Статус мережі</span>
            <span className="text-xl font-bold mt-1 text-emerald-400 flex items-center gap-1.5"><Wifi size={18} /> Стабільна</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400"><Activity size={20} /></div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase font-medium">Вузли в мережі</span>
            <span className="text-xl font-bold mt-1 text-white font-mono">{onlineCount} / {servers.length}</span>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400"><Server size={20} /></div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase font-medium">Середнє завантаження CPU</span>
            <span className="text-xl font-bold mt-1 text-white font-mono">{avgCpu}%</span>
          </div>
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400"><Cpu size={20} /></div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase font-medium">Аномалії / Помилки</span>
            <span className="text-xl font-bold mt-1 text-amber-400 font-mono">{servers.filter(s => s.status === 'warning' || s.status === 'offline').length} активні</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400"><AlertTriangle size={20} /></div>
        </div>
      </div>

      <div className="w-full max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input type="text" placeholder="Пошук за назвою хоста або IP..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/50 border-border rounded-xl text-foreground placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-primary" />
      </div>

      {/* Список серверів на повну ширину */}
      <div className="w-full flex flex-col gap-3">
        <div className="bg-card p-3 rounded-xl border border-border flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide uppercase text-gray-300">Активні сервери під моніторингом</span>
          <span className="bg-white/5 border border-white/5 text-xs py-0.5 px-2 rounded font-mono text-gray-400">{filteredServers.length} вузлів</span>
        </div>

        <div className="flex flex-col gap-3">
          {dataLoading ? (
             <div className="text-center py-12 text-muted-foreground animate-pulse">Завантаження серверів...</div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredServers.map(server => (
                <motion.div layout key={server.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card p-4 border border-border hover:border-primary/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-secondary border border-border text-gray-400 group-hover:text-primary transition-colors mt-0.5"><Server size={18} /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{server.name}</h3>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-secondary text-gray-400 border border-border rounded">{server.type}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{server.ip} • Uptime: {server.uptime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:justify-end flex-1">
                    <div className="flex flex-col w-24 sm:w-32 gap-1">
                      <div className="flex justify-between text-[11px] font-mono text-gray-400"><span>CPU</span><span>{server.cpu}%</span></div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${server.cpu > 80 ? 'bg-red-500' : server.cpu > 60 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${server.cpu}%` }} /></div>
                    </div>
                    <div className="flex flex-col w-24 sm:w-32 gap-1">
                      <div className="flex justify-between text-[11px] font-mono text-gray-400"><span>RAM</span><span>{server.ram}%</span></div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${server.ram > 85 ? 'bg-red-500' : server.ram > 65 ? 'bg-amber-500' : 'bg-primary/80'}`} style={{ width: `${server.ram}%` }} /></div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs font-medium w-24 justify-end">
                      {getStatusIcon(server.status)}<span className="capitalize text-gray-300 text-[13px] hidden sm:inline-block">{server.status}</span>
                    </div>

                    {/* Кнопки керування */}
                    <div className="flex items-center gap-1 border-l border-white/10 pl-3 ml-1">
                      <button 
                        onClick={() => { setServerToEdit(server); setIsEditModalOpen(true); }} 
                        className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-white/5 rounded-md transition-all"
                        title="Редагувати"
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        onClick={() => handleDeleteServer(server.id)} 
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-md transition-all"
                        title="Видалити"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {!dataLoading && filteredServers.length === 0 && (
            <div className="text-xs text-gray-600 text-center py-12 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">Жодного сервера за вашим запитом не знайдено</div>
          )}
        </div>
      </div>
    </div>
  );
}