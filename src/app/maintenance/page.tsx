'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Wrench, AlertTriangle, CheckCircle, Calendar, Trash2, X, Search } from 'lucide-react';
export default function MaintenancePage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    assetId: '',
    title: '',
    description: '',
    scheduledAt: '',
    type: 'ТО'
  });
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, assetsRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/assets')
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (assetsRes.ok) setAssets(await assetsRes.json());
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ assetId: '', title: '', description: '', scheduledAt: '', type: 'ТО' });
        fetchData();
      } else {
        alert('Помилка створення завдання');
      }
    } catch (error) {
      console.error(error);
    }
  };
  const markAsCompleted = async (id: string) => {
    try {
      await fetch('/api/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Виконано' })
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Видалити завдання?')) return;
    try {
      await fetch(`/api/maintenance?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };
  const getAssetInfo = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset ? `${asset.name} (${asset.serial_number || 'S/N відсутній'})` : 'Невідомий актив';
  };
  const isOverdue = (dateString: string, status: string) => {
    if (status === 'Виконано') return false;
    return new Date(dateString) < new Date();
  };
  const filteredTasks = tasks.filter(task => {
    const assetName = getAssetInfo(task.assetId).toLowerCase();
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || assetName.includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || task.type === filterType;
    return matchesSearch && matchesFilter;
  });
  const stats = {
    total: tasks.length,
    planned: tasks.filter(t => t.status !== 'Виконано' && !isOverdue(t.scheduledAt, t.status)).length,
    overdue: tasks.filter(t => isOverdue(t.scheduledAt, t.status)).length,
    completed: tasks.filter(t => t.status === 'Виконано').length
  };
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-gradient tracking-tight flex items-center gap-3">
            <Wrench size={32} className="text-primary" /> Планове ТО
          </h1>
          <p className="text-muted-foreground mt-2 font-light">Графік профілактичних робіт та гарантійного обслуговування</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2"
        >
          <Plus size={18} /> Нове завдання
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{stats.total}</span>
          <span className="text-sm text-gray-400 mt-1">Всього завдань</span>
        </div>
        <div className="bg-card/40 border border-amber-500/20 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <span className="text-3xl font-bold text-amber-400">{stats.planned}</span>
          <span className="text-sm text-gray-400 mt-1">Заплановано</span>
        </div>
        <div className="bg-card/40 border border-red-500/20 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.05)]">
          <span className="text-3xl font-bold text-red-400">{stats.overdue}</span>
          <span className="text-sm text-gray-400 mt-1">Прострочено</span>
        </div>
        <div className="bg-card/40 border border-green-500/20 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.05)]">
          <span className="text-3xl font-bold text-green-400">{stats.completed}</span>
          <span className="text-sm text-gray-400 mt-1">Виконано</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Пошук за назвою або активом..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card/40 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-card/40 border border-white/10 rounded-xl py-2.5 px-4 text-white"
        >
          <option value="all">Всі типи</option>
          <option value="ТО">Профілактика (ТО)</option>
          <option value="Гарантія">Гарантія</option>
        </select>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-10">Завантаження графіка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTasks.map((task, index) => {
              const overdue = isOverdue(task.scheduledAt, task.status);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  key={task.id} 
                  className={`relative p-6 rounded-2xl border ${
                    task.status === 'Виконано' ? 'bg-green-500/5 border-green-500/20' :
                    overdue ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 
                    'bg-card/40 border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded ${
                      task.type === 'Гарантія' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {task.type}
                    </span>
                    <div className="flex gap-2">
                      {task.status !== 'Виконано' && (
                        <button onClick={() => markAsCompleted(task.id)} className="text-gray-400 hover:text-green-400 transition-colors" title="Позначити виконаним">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-400 transition-colors" title="Видалити">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{task.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{getAssetInfo(task.assetId)}</p>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className={overdue ? "text-red-400" : "text-gray-500"} />
                      <span>План: {new Date(task.scheduledAt).toLocaleDateString('uk-UA')}</span>
                    </div>
                    {task.completedAt && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={15} />
                        <span>Виконано: {new Date(task.completedAt).toLocaleDateString('uk-UA')}</span>
                      </div>
                    )}
                  </div>
                  {overdue && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-500/10 p-2 rounded-lg">
                      <AlertTriangle size={14} /> Прострочено!
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredTasks.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-card/20 rounded-2xl border border-white/5 border-dashed">
              Запланованих робіт немає.
            </div>
          )}
        </div>
      )}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative m-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Нове завдання ТО</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Обладнання (Актив)</label>
                <select required value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white mt-1">
                  <option value="">Виберіть актив...</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name} ({asset.serial_number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Назва робіт</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Напр. Заміна термопасти" className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Дата</label>
                  <input required type="date" value={formData.scheduledAt} onChange={e => setFormData({...formData, scheduledAt: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Тип</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white mt-1">
                    <option value="ТО">ТО</option>
                    <option value="Гарантія">Гарантія</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Деталі (опціонально)</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white mt-1" />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
                Запланувати
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
