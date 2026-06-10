'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, Activity, Wrench, Archive, 
  MoreVertical, ChevronDown, Check, X,
  AlertOctagon, AlertTriangle, Info, Laptop, Monitor, Server, Network, Printer,
  DollarSign, Ticket, Percent
} from 'lucide-react';
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
        } else {
          setStats(mockData);
        }
      } catch (error) {
        console.error('Помилка завантаження статистики:', error);
        setStats(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500 text-sm">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
        Завантаження дашборду...
      </div>
    );
  }
  const activePercent = stats?.total ? Math.round(((stats?.byStatus?.active || 0) / stats.total) * 100) : 0;
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white mb-4">Дашборд KPI</h1>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Зведені метрики</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <DollarSign size={24} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Загальна вартість активів</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(stats?.totalValue || 0)}
                </span>
                <span className="text-xs text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">+4.2%</span>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Percent size={24} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-1">
                <p className="text-sm text-gray-400">Використання ліцензій</p>
                <span className="text-xl font-bold text-white">{stats?.licenseUsage || 0}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${stats?.licenseUsage || 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Ticket size={24} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Відкриті тікети</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{stats?.openTickets || 0}</span>
                <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-medium">Потребують уваги</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Database size={18} className="text-primary" />
              <span className="text-sm font-medium">Всього активів</span>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-white tracking-tight">{stats?.total || 0}</span>
            <span className="text-sm text-gray-400 mb-1">Одиниць</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">+12%</span>
            <span className="text-gray-500">vs минулий місяць</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 z-10">
            <div className="flex items-center gap-2 text-gray-400">
              <Activity size={18} className="text-primary" />
              <span className="text-sm font-medium">Активні</span>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors z-10">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="flex justify-between items-end z-10">
            <div>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-white tracking-tight">{stats?.byStatus?.active || 0}</span>
                <span className="text-sm text-gray-400 mb-1">В роботі</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-yellow-500 font-medium">{stats?.byStatus?.maintenance || 0} В ремонті</span>
              </div>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-border" />
                <circle 
                  cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  strokeDasharray={2 * Math.PI * 28} 
                  strokeDashoffset={2 * Math.PI * 28 * (1 - activePercent / 100)} 
                  className="text-primary transition-all duration-1000 ease-out" 
                  strokeLinecap="round" 
                />
              </svg>
              <span className="absolute text-xs font-bold text-white">{activePercent}%</span>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Wrench size={18} className="text-primary" />
              <span className="text-sm font-medium">В ремонті</span>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-white tracking-tight">{stats?.byStatus?.maintenance || 0}</span>
            <span className="text-sm text-gray-400 mb-1">Одиниць</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">-2%</span>
            <span className="text-gray-500">vs минулий місяць</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Archive size={18} className="text-primary" />
              <span className="text-sm font-medium">Списані</span>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-white tracking-tight">{(stats?.byStatus?.retired || 0) + (stats?.byStatus?.missing || 0)}</span>
            <span className="text-sm text-gray-400 mb-1">Одиниць</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">+5%</span>
            <span className="text-gray-500">vs минулий рік</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-base font-semibold text-white">Статистика за категоріями</h2>
          </div>
          <div className="flex gap-12 mb-8">
            <div>
              <p className="text-3xl font-bold text-primary">97%</p>
              <p className="text-xs text-gray-500 mt-1"><span className="text-primary font-medium">+1.5%</span> vs минулий місяць</p>
            </div>
            <div className="flex gap-8">
              <div className="border-l-2 border-primary pl-4">
                <p className="text-xs text-gray-400 mb-1">Активне обладнання</p>
                <p className="text-lg font-bold text-white">{stats?.byStatus?.active || 0} <span className="text-xs text-gray-500 font-normal">Шт</span></p>
              </div>
              <div className="border-l-2 border-yellow-500 pl-4">
                <p className="text-xs text-gray-400 mb-1">В ремонті</p>
                <p className="text-lg font-bold text-white">{stats?.byStatus?.maintenance || 0} <span className="text-xs text-gray-500 font-normal">Шт</span></p>
              </div>
              <div className="border-l-2 border-red-500 pl-4">
                <p className="text-xs text-gray-400 mb-1">Списано</p>
                <p className="text-lg font-bold text-white">{stats?.byStatus?.retired || 0} <span className="text-xs text-gray-500 font-normal">Шт</span></p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-5 h-48 overflow-y-auto custom-scrollbar pr-2">
            {Object.entries(stats?.byCategory || {}).length > 0 ? (
              Object.entries(stats?.byCategory || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([cat, count]: [string, any]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 flex items-center gap-2">{getCategoryIcon(cat)} {cat}</span>
                    <span className="text-white font-bold">{count} <span className="text-gray-500 font-normal">шт</span></span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / Math.max(stats?.total || 1, 1)) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-primary rounded-full" 
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">Немає даних за категоріями</div>
            )}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-white">Останні зміни</h2>
            <Link href="/assets" className="text-xs text-gray-400 hover:text-white transition-colors">
              Всі зміни &rarr;
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {stats?.recentAssets?.slice(0, 5).map((asset: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border relative">
                  {getCategoryIcon(asset.category)}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                    asset.status === 'active' ? 'bg-primary' : 
                    asset.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{asset.name}</p>
                  <p className="text-xs text-gray-500 truncate">{asset.brand} {asset.model}</p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap bg-secondary/50 px-2 py-1 rounded">
                  {asset.status === 'active' ? 'Видано' : asset.status === 'maintenance' ? 'В ремонті' : 'Списано'}
                </div>
              </div>
            )) || [1, 2, 3, 4].map(i => (
               <div key={i} className="flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-secondary animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-secondary rounded animate-pulse"></div>
                    <div className="h-2 w-16 bg-secondary rounded animate-pulse"></div>
                  </div>
               </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-white">Нові заявки (Служба підтримки)</h2>
            <Link href="/helpdesk" className="text-xs text-gray-400 hover:text-white transition-colors">
              Всі заявки &rarr;
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.recentTickets?.length > 0 ? stats.recentTickets.map((ticket: any, i: number) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-gray-300">
                    {ticket.user ? ticket.user.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-0.5">{ticket.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{ticket.description || 'Без опису'}</p>
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 inline-block mt-1">
                      {ticket.priority || 'Середній'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href="/helpdesk" className="flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                    Деталі
                  </Link>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-gray-500 text-sm">Немає нових заявок</div>
            )}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-white">Сповіщення системи / Дедлайни</h2>
            <button className="text-xs text-gray-400 hover:text-white transition-colors">
              Всі сповіщення &rarr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-secondary/30">
                <tr>
                  <th className="px-4 py-2 font-medium rounded-tl-lg">Подія</th>
                  <th className="px-4 py-2 font-medium">Категорія</th>
                  <th className="px-4 py-2 font-medium">Дата</th>
                  <th className="px-4 py-2 font-medium rounded-tr-lg">Важливість</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-gray-300">
                {stats?.systemAlerts?.length > 0 ? stats.systemAlerts.map((alert: any, i: number) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{alert.title}</td>
                    <td className="px-4 py-3">{alert.category}</td>
                    <td className="px-4 py-3 text-xs">{alert.date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${alert.importance === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                        {alert.importance}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">
                      Немає активних сповіщень
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
function getCategoryIcon(category: string) {
  switch (category) {
    case 'Ноутбук': return <Laptop size={16} className="text-gray-400" />;
    case 'Сервер': return <Server size={16} className="text-gray-400" />;
    case 'Монітор': return <Monitor size={16} className="text-gray-400" />;
    case 'Принтер': return <Printer size={16} className="text-gray-400" />;
    case 'Мережа': return <Network size={16} className="text-gray-400" />;
    default: return <Database size={16} className="text-gray-400" />;
  }
}
const mockData = {
  total: 200,
  totalValue: 1245000,
  licenseUsage: 85,
  openTickets: 12,
  byStatus: { active: 180, maintenance: 10, retired: 8, missing: 2 },
  byCategory: { 'Ноутбук': 80, 'Монітор': 60, 'Сервер': 10, 'Мережа': 20, 'Принтер': 30 },
  recentAssets: [
    { name: 'MacBook Pro 16', brand: 'Apple', model: 'M3 Max', category: 'Ноутбук', status: 'active' },
    { name: 'Dell UltraSharp', brand: 'Dell', model: 'U2723QE', category: 'Монітор', status: 'maintenance' },
    { name: 'Cisco Catalyst 9300', brand: 'Cisco', model: '-', category: 'Мережа', status: 'active' },
    { name: 'ThinkPad T14', brand: 'Lenovo', model: 'Gen 4', category: 'Ноутбук', status: 'active' },
    { name: 'HP LaserJet Pro', brand: 'HP', model: 'M404dn', category: 'Принтер', status: 'retired' },
  ]
};