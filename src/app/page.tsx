'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wrench, AlertTriangle, Archive, Laptop, Monitor, Server, Printer, Network, Database, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Помилка завантаження статистики:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ноутбук': return <Laptop size={20} className="text-blue-400" />;
      case 'Сервер': return <Server size={20} className="text-purple-400" />;
      case 'Монітор': return <Monitor size={20} className="text-emerald-400" />;
      case 'Принтер': return <Printer size={20} className="text-amber-400" />;
      case 'Мережа': return <Network size={20} className="text-rose-400" />;
      default: return <Database size={20} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Завантаження дашборду...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Дашборд</h1>
        <p className="text-muted-foreground mt-2">Загальна статистика ІТ-інфраструктури</p>
      </div>

      {/* КАРТКИ ЗІ СТАТУСАМИ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-6 border-t-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Всього активів</p>
              <p className="text-3xl font-bold text-white mt-2">{stats?.total || 0}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <Database size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-t-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Активні</p>
              <p className="text-3xl font-bold text-white mt-2">{stats?.byStatus?.active || 0}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
              <Activity size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass-panel p-6 border-t-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">В ремонті</p>
              <p className="text-3xl font-bold text-white mt-2">{stats?.byStatus?.maintenance || 0}</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
              <Wrench size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass-panel p-6 border-t-4 border-zinc-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Списані / Втрачені</p>
              <p className="text-3xl font-bold text-white mt-2">
                {(stats?.byStatus?.retired || 0) + (stats?.byStatus?.missing || 0)}
              </p>
            </div>
            <div className="p-3 bg-zinc-500/10 rounded-xl text-zinc-400">
              <Archive size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* РОЗПОДІЛ ЗА КАТЕГОРІЯМИ */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="glass-panel p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Обладнання за категоріями</h2>
          <div className="space-y-4">
            {stats?.byCategory && Object.keys(stats.byCategory).length > 0 ? (
              Object.entries(stats.byCategory)
                .sort(([, a]: any, [, b]: any) => b - a)
                .map(([category, count]: any, index) => {
                  const percentage = Math.round((count / stats.total) * 100);
                  
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="p-2 bg-white/5 rounded-lg">
                        {getCategoryIcon(category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300 font-medium">{category}</span>
                          <span className="text-gray-400">{count} шт. ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                            className="bg-primary h-full rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-gray-500 text-center py-4">Даних ще немає</div>
            )}
          </div>
        </motion.div>

        {/* ШВИДКІ ДІЇ */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="glass-panel p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Швидкі дії</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link href="/assets" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
              <div className="p-3 bg-primary/20 rounded-lg text-primary">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-white font-medium">Каталог активів</h3>
                <p className="text-sm text-gray-400">Керування обладнанням, додавання та списання</p>
              </div>
            </Link>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed">
              <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-white font-medium">Журнал інцидентів (Скоро)</h3>
                <p className="text-sm text-gray-400">Відстеження поломок та ремонтів</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* НЕЩОДАВНІ НАДХОДЖЕННЯ */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Останні додані активи
          </h2>
          <Link href="/assets" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Переглянути всі &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats?.recentAssets?.length > 0 ? (
            stats.recentAssets.map((asset: any) => (
              <div key={asset.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-white/5 rounded-lg">
                    {getCategoryIcon(asset.category)}
                  </div>
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full border ${
                    asset.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    asset.status === 'maintenance' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                  }`}>
                    {asset.status === 'active' ? 'Активний' : asset.status === 'maintenance' ? 'Ремонт' : 'Списано'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white truncate">{asset.name}</p>
                  <p className="text-xs text-gray-500 truncate">{asset.brand} {asset.model !== '-' && asset.model}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-4">Немає нещодавніх активів</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}