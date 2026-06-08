'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Key, ShieldCheck, AlertTriangle, Clock, Search, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface License {
  id: string;
  name: string;
  softwareType: string;
  licenseKey?: string;
  totalSeats: number;
  usedSeats: number;
  expirationDate?: string | null;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Підписка');
  const [newKey, setNewKey] = useState('');
  const [newSeats, setNewSeats] = useState(1);
  const [newDate, setNewDate] = useState('');
  const fetchLicenses = async () => {
    try {
      const res = await fetch('/api/licenses');
      const data = await res.json();
      if (Array.isArray(data)) setLicenses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);
  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          softwareType: newType,
          licenseKey: newKey,
          totalSeats: newSeats,
          expirationDate: newDate || null
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewName(''); setNewKey(''); setNewSeats(1); setNewDate('');
        fetchLicenses(); 
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю ліцензію?')) return;
    try {
      await fetch(`/api/licenses/${id}`, { method: 'DELETE' }); 
      setLicenses(licenses.filter(l => l.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getLicenseStatus = (license: License) => {
    if (!license.expirationDate) return 'active';
    const expDate = new Date(license.expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'active';
  };

  const totalLicenses = licenses.length;
  const activeCount = licenses.filter(l => getLicenseStatus(l) === 'active').length;
  const attentionCount = licenses.filter(l => getLicenseStatus(l) !== 'active').length;

  const filteredLicenses = licenses.filter(license =>
    license.name.toLowerCase().includes(search.toLowerCase()) ||
    (license.licenseKey && license.licenseKey.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-md flex items-center gap-1 w-max"><ShieldCheck size={14}/> Активно</span>;
      case 'expiring':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-md flex items-center gap-1 w-max"><Clock size={14}/> Скоро кінець</span>;
      case 'expired':
        return <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-md flex items-center gap-1 w-max"><AlertTriangle size={14}/> Протерміновано</span>;
      default: return null;
    }
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Завантаження ліцензій...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[1600px] mx-auto space-y-8">
      
      {/* Хідер */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Ліцензії та ПЗ</h1>
          <p className="text-muted-foreground mt-1 font-light">Реальне керування софтом та ключами з бази Neon.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all duration-300 shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.7)]"
        >
          <Plus size={18} /> Додати ліцензію
        </button>
      </div>

      {/* РЕАЛЬНІ ВІДЖЕТИ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500"><Key size={24} /></div>
          <div><p className="text-sm font-medium text-muted-foreground">Всього в базі</p><h3 className="text-2xl font-bold">{totalLicenses}</h3></div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500"><ShieldCheck size={24} /></div>
          <div><p className="text-sm font-medium text-muted-foreground">Активні</p><h3 className="text-2xl font-bold">{activeCount}</h3></div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500"><AlertTriangle size={24} /></div>
          <div><p className="text-sm font-medium text-muted-foreground">Увага / Протерміновані</p><h3 className="text-2xl font-bold">{attentionCount}</h3></div>
        </div>
      </div>

      {/* Таблиця */}
      <div className="glass-panel border border-border rounded-2xl overflow-hidden flex flex-col">
        {/* Пошук */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Пошук за назвою чи ключем..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="px-6 py-4">Назва ПЗ</th>
                <th className="px-6 py-4">Тип</th>
                <th className="px-6 py-4">Ключ ліцензії</th>
                <th className="px-6 py-4">Місць всього</th>
                <th className="px-6 py-4">Термін дії</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLicenses.map((license) => (
                <tr key={license.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground"><Key size={16} /></div>
                    {license.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{license.softwareType}</td>
                  <td className="px-6 py-4 font-mono text-xs max-w-[150px] truncate">{license.licenseKey || '—'}</td>
                  <td className="px-6 py-4 font-semibold">{license.totalSeats}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {license.expirationDate ? new Date(license.expirationDate).toLocaleDateString('uk-UA') : 'Безстроково'}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(getLicenseStatus(license))}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(license.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLicenses.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Нічого не знайдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* МОДАЛЬНЕ ВІКНО ДОДАВАННЯ (AnimatePresence для плавності) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-background border border-border w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
              <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={20}/></button>
              <h2 className="text-xl font-bold mb-4">Додати нове ПЗ</h2>
              <form onSubmit={handleAddLicense} className="space-y-4">
                <div><label className="text-xs font-bold text-muted-foreground">Назва</label><input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-muted border border-border rounded-xl p-2.5 mt-1 text-sm outline-none"/></div>
                <div><label className="text-xs font-bold text-muted-foreground">Тип</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full bg-muted border border-border rounded-xl p-2.5 mt-1 text-sm outline-none">
                    <option>Підписка</option><option>OEM Ключ</option><option>Антивірус</option><option>Хмарна підписка</option>
                  </select>
                </div>
                <div><label className="text-xs font-bold text-muted-foreground">Ліцензійний ключ</label><input type="text" value={newKey} onChange={e => setNewKey(e.target.value)} className="w-full bg-muted border border-border rounded-xl p-2.5 mt-1 text-sm font-mono outline-none"/></div>
                <div><label className="text-xs font-bold text-muted-foreground">Кількість ліцензій (місць)</label><input type="number" min="1" value={newSeats} onChange={e => setNewSeats(Number(e.target.value))} className="w-full bg-muted border border-border rounded-xl p-2.5 mt-1 text-sm outline-none"/></div>
                <div><label className="text-xs font-bold text-muted-foreground">Дата закінчення (опціонально)</label><input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-muted border border-border rounded-xl p-2.5 mt-1 text-sm outline-none"/></div>
                <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold mt-2 hover:bg-primary/90 transition-all">Зберегти в базу</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}