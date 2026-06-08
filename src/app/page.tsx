'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, Activity, Wrench, Archive, 
  MoreVertical, ChevronDown, Check, X,
  AlertOctagon, AlertTriangle, Info, Laptop, Monitor, Server, Network, Printer
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
          // Mock data fallback for preview
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
      
      {/* KPI CARDS (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
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

        {/* Card 2 (With Circular Progress) */}
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
            
            {/* Circular Progress */}
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

        {/* Card 3 */}
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

        {/* Card 4 */}
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

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart (Takes 2 columns) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-base font-semibold text-white">Статистика за категоріями</h2>
            <button className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-md hover:bg-primary/20 transition-colors">
              Грудень <ChevronDown size={14} />
            </button>
          </div>
          
          {/* Chart Header Stats */}
          <div className="flex gap-12 mb-8">
            <div>
              <p className="text-3xl font-bold text-primary">97%</p>
              <p className="text-xs text-gray-500 mt-1"><span className="text-primary font-medium">+1.5%</span> vs минулий місяць</p>
            </div>
            <div className="flex gap-8">
              <div className="border-l-2 border-primary pl-4">
                <p className="text-xs text-gray-400 mb-1">Активне обладнання</p>
                <p className="text-lg font-bold text-white">180 <span className="text-xs text-gray-500 font-normal">Шт</span></p>
              </div>
              <div className="border-l-2 border-yellow-500 pl-4">
                <p className="text-xs text-gray-400 mb-1">В ремонті</p>
                <p className="text-lg font-bold text-white">59 <span className="text-xs text-gray-500 font-normal">Шт</span></p>
              </div>
              <div className="border-l-2 border-red-500 pl-4">
                <p className="text-xs text-gray-400 mb-1">Списано</p>
                <p className="text-lg font-bold text-white">10 <span className="text-xs text-gray-500 font-normal">Шт</span></p>
              </div>
            </div>
          </div>

          {/* Fake Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-2 mt-4 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[40, 30, 20, 10, 0].map(val => (
                <div key={val} className="w-full border-t border-border/50 flex items-center h-0 relative">
                  <span className="absolute -left-6 text-[10px] text-gray-600">{val}</span>
                </div>
              ))}
            </div>
            
            {/* Bars */}
            {Array.from({ length: 20 }).map((_, i) => {
              const h1 = Math.floor(Math.random() * 40) + 10;
              const h2 = Math.floor(Math.random() * 20) + 5;
              return (
                <div key={i} className="flex flex-col items-center gap-1 w-full max-w-[12px] z-10 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 bg-secondary px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    День {i + 1}
                  </div>
                  
                  <div className="w-full flex flex-col justify-end gap-0.5 h-full">
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${h2}%` }} transition={{ duration: 0.5, delay: i * 0.02 }}
                      className="w-full bg-yellow-500/80 rounded-t-sm" 
                    />
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${h1}%` }} transition={{ duration: 0.5, delay: i * 0.02 }}
                      className="w-full bg-primary rounded-t-sm" 
                    />
                  </div>
                  <span className="text-[8px] text-gray-600 mt-2">{(i+1).toString().padStart(2, '0')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Recent Changes List */}
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

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Approvals (Tickets) */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-white">Нові заявки (Служба підтримки)</h2>
            <Link href="/helpdesk" className="text-xs text-gray-400 hover:text-white transition-colors">
              Всі заявки &rarr;
            </Link>
          </div>
          
          <div className="space-y-4">
            {[
              { title: 'Заміна монітору', user: 'Олександр П.', desc: 'Мерехтить екран при роботі', type: 'Hardware' },
              { title: 'Доступ до CRM', user: 'Ірина М.', desc: 'Потрібен доступ для нового проекту', type: 'Software' },
              { title: 'Налаштування VPN', user: 'Віталій К.', desc: 'Не можу підключитися з дому', type: 'Network' }
            ].map((ticket, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-gray-300">
                    {ticket.user.split(' ')[0][0]}{ticket.user.split(' ')[1][0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-0.5">{ticket.title}</h4>
                    <p className="text-xs text-gray-500">{ticket.desc}</p>
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 inline-block mt-1">
                      {ticket.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                    Прийняти
                  </button>
                  <button className="flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                    Відхилити
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
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
                <tr className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">Закінчення ліцензій Windows</td>
                  <td className="px-4 py-3">Software</td>
                  <td className="px-4 py-3 text-xs">27 Лютого (3 Дні)</td>
                  <td className="px-4 py-3">
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Critical</span>
                  </td>
                </tr>
                <tr className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">Оновлення серверів</td>
                  <td className="px-4 py-3">Infrastructure</td>
                  <td className="px-4 py-3 text-xs">28 Лютого (4 Дні)</td>
                  <td className="px-4 py-3">
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Critical</span>
                  </td>
                </tr>
                <tr className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">Інвентаризація філіалу</td>
                  <td className="px-4 py-3">Compliance</td>
                  <td className="px-4 py-3 text-xs">1 Березня (7 Днів)</td>
                  <td className="px-4 py-3">
                    <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Important</span>
                  </td>
                </tr>
                <tr className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">Закупівля мишок/клавіатур</td>
                  <td className="px-4 py-3">Hardware</td>
                  <td className="px-4 py-3 text-xs">18 Березня (20 Днів)</td>
                  <td className="px-4 py-3">
                    <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Upcoming</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}

// Helpers
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