'use client';

import React, { useState, useEffect } from 'react';
import { 
  Ticket, Clock, User, AlertCircle, CheckCircle, X, Search, Trash2, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/context/SettingsContext';
import { useSession } from 'next-auth/react';

interface HelpdeskTicket {
  id: string;
  title: string;
  requester: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'Низький' | 'Середній' | 'Високий' | 'Критичний';
  status: 'open' | 'in_progress' | 'resolved' | 'Відкрито' | 'В процесі' | 'Вирішено';
  time: string;
  createdAt?: string | Date;
}

export default function HelpdeskPage() {
  const { settings, loading } = useSettings();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'guest';
  const canEdit = userRole === 'admin' || userRole === 'tech';
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', requester: '', priority: 'low' });
  const [searchQuery, setSearchQuery] = useState('');

  const getCurrentTimeStr = () => {
    return new Date().toTimeString().split(' ')[0];
  };

  const logAction = async (type: 'info' | 'warning' | 'error', text: string) => {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          time: getCurrentTimeStr(),
          type,
          source: 'HELPDESK',
          text
        }),
      });
    } catch (err) {
      console.error("Не вдалося надіслати лог аудиту:", err);
    }
  };

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch('/api/tickets');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((t: any) => ({
            id: t.id,
            title: t.title,
            requester: t.user || t.requester || 'Невідомо',
            priority: t.priority,
            status: t.status === 'Відкрито' ? 'open' : t.status === 'В роботі' ? 'in_progress' : t.status === 'Вирішено' ? 'resolved' : t.status,
            time: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: t.createdAt
          }));
          setTickets(mapped);
        }
      } catch (err) {
        console.error("Помилка завантаження заявок:", err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const ticketData: HelpdeskTicket = {
      id: `INC-${Math.floor(Math.random() * 9000) + 1000}`,
      title: newTicket.title,
      requester: newTicket.requester,
      priority: newTicket.priority as any,
      status: 'open',
      time: 'Щойно',
      createdAt: new Date().toISOString()
    };

    setTickets([ticketData, ...tickets]);
    setIsModalOpen(false);
    setNewTicket({ title: '', requester: '', priority: 'low' });

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (res.ok) {
        await logAction('info', `Створено нову заявку ${ticketData.id}: "${ticketData.title}" від ${ticketData.requester} [Пріоритет: ${ticketData.priority}]`);
      }
    } catch (err) {
      console.error("Помилка збереження заявки:", err);
    }
  };

  const handleMoveStatus = async (id: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    const currentTicket = tickets.find(t => t.id === id);
    
    const statusNames = {
      open: 'Відкрито / Перевідкрито',
      in_progress: 'В роботі',
      resolved: 'Вирішено'
    };

    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok && currentTicket) {
        const logType = newStatus === 'resolved' ? 'info' : 'warning';
        await logAction(logType, `Змінено статус заявки ${id} на "${statusNames[newStatus]}" (Тікет: "${currentTicket.title}")`);
      }
    } catch (err) {
      console.error("Помилка оновлення статусу:", err);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    const currentTicket = tickets.find(t => t.id === id);
    if (!confirm(`Ви впевнені, що хочете видалити заявку ${id}?`)) return;

    setTickets(prev => prev.filter(t => t.id !== id));
    
    try {
      const res = await fetch(`/api/tickets?id=${id}`, { method: 'DELETE' });
      if (res.ok && currentTicket) {
        await logAction('error', `Видалено заявку ${id}: "${currentTicket.title}" (Заявник: ${currentTicket.requester})`);
      }
    } catch (err) {
      console.error("Помилка видалення заявки:", err);
    }
  };

  const lowerCaseQuery = searchQuery.toLowerCase();
  const filteredTickets = tickets.filter(t => 
    t.title?.toLowerCase().includes(lowerCaseQuery) ||
    t.requester?.toLowerCase().includes(lowerCaseQuery) ||
    t.id?.toLowerCase().includes(lowerCaseQuery)
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getColumnIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle size={18} className="text-amber-400" />;
      case 'in_progress': return <Clock size={18} className="text-blue-400" />;
      case 'resolved': return <CheckCircle size={18} className="text-emerald-400" />;
      default: return null;
    }
  };

  const getSLAStatus = (ticket: HelpdeskTicket) => {
    if (ticket.status === 'resolved' || ticket.status === 'Вирішено') {
      return { status: 'ok', text: 'Виконано', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    }

    const createdAtTime = ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
    let slaHours = 48;
    if (['high', 'critical', 'Високий', 'Критичний'].includes(ticket.priority)) slaHours = 4;
    else if (['medium', 'Середній'].includes(ticket.priority)) slaHours = 24;

    const deadline = createdAtTime + (slaHours * 60 * 60 * 1000);
    const now = Date.now();
    const timeLeft = deadline - now;

    if (timeLeft < 0 || ['critical', 'Критичний'].includes(ticket.priority) || ticket.title.includes('[ПРОСТРОЧЕНО]')) {
      return { status: 'breached', text: 'ПРОСТРОЧЕНО', color: 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse' };
    }

    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (timeLeft < (slaHours * 60 * 60 * 1000 * 0.2)) {
      return { status: 'warning', text: `${hoursLeft}г ${minsLeft}хв`, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    }

    return { status: 'good', text: `${hoursLeft}г ${minsLeft}хв`, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  };

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const slaBreachedCount = openTickets.filter(t => getSLAStatus(t).status === 'breached').length;
  const slaWarningCount = openTickets.filter(t => getSLAStatus(t).status === 'warning').length;
  const slaGoodCount = openTickets.filter(t => getSLAStatus(t).status === 'good').length;

  const columns = [
    { id: 'open', title: 'Відкриті заявки', count: tickets.filter(t => t.status === 'open').length },
    { id: 'in_progress', title: 'В роботі', count: tickets.filter(t => t.status === 'in_progress').length },
    { id: 'resolved', title: 'Вирішені', count: tickets.filter(t => t.status === 'resolved').length },
  ];

  return (
    <div className="flex flex-col gap-6 min-h-screen text-white relative">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-1">Служба підтримки</h1>
          <p className="text-muted-foreground text-sm font-light">
            Управління інцидентами під контролем: <span className="text-indigo-400 font-medium">{loading ? '...' : settings.adminName}</span>
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:brightness-110 text-white font-semibold transition-all self-start sm:self-center">
              + Створити заявку
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Нова заявка</DialogTitle>
              <DialogDescription className="text-gray-400">
                Зафіксуйте новий інцидент або запит на обслуговування в системі.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="grid gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Короткий опис проблеми</label>
                <Input required value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} className="bg-secondary/50 border-border focus:border-primary text-foreground" placeholder="Наприклад: Не працює мишка" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Хто повідомляє?</label>
                <Input required value={newTicket.requester} onChange={e => setNewTicket({...newTicket, requester: e.target.value})} className="bg-secondary/50 border-border focus:border-primary text-foreground" placeholder="ПІБ або назва відділу" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Рівень критичності</label>
                <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})} className="h-10 rounded-md bg-secondary/50 border border-border px-3 text-sm text-foreground focus:border-primary focus:outline-none">
                  <option value="low">Низький</option>
                  <option value="medium">Середній</option>
                  <option value="high">Високий</option>
                  <option value="critical">Критичний</option>
                </select>
              </div>
              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-border hover:bg-secondary text-foreground">Скасувати</Button>
                <Button type="submit" className="bg-primary hover:brightness-110 text-white">Створити тікет</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="w-full max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input type="text" placeholder="Пошук за назвою, користувачем чи ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-primary rounded-xl" />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={16} /></button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-2">
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Відкритих</span>
            <span className="text-2xl font-bold text-white">{openTickets.length}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><Ticket size={20} /></div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">В межах SLA</span>
            <span className="text-2xl font-bold text-emerald-400">{slaGoodCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400"><CheckCircle size={20} /></div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Загроза SLA</span>
            <span className="text-2xl font-bold text-amber-400">{slaWarningCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400"><Clock size={20} /></div>
        </div>
        <div className="bg-card border border-red-500/30 p-4 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="flex flex-col">
            <span className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Прострочено</span>
            <span className="text-2xl font-bold text-red-500">{slaBreachedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500"><AlertCircle size={20} /></div>
        </div>
      </div>

      {dataLoading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Завантаження тікетів...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map(column => (
            <div key={column.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-gray-300">
                  {getColumnIcon(column.id)} <span>{column.title}</span>
                </div>
                <span className="bg-secondary border border-border text-xs py-0.5 px-2.5 rounded-md font-mono text-foreground font-bold">{column.count}</span>
              </div>

              <div className="flex flex-col gap-3 min-h-[500px]">
                <AnimatePresence mode="popLayout">
                  {filteredTickets.filter(t => t.status === column.id).map(ticket => (
                    <motion.div 
                      layout key={ticket.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                      className="bg-card border border-border p-4 rounded-xl flex flex-col gap-3 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(var(--primary),0.08)] transition-all duration-300 shadow-sm group relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 font-mono"><Ticket size={14} className="text-gray-600" />{ticket.id}</div>
                        <span className={`text-[9px] tracking-wider uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                      </div>

                      <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-primary transition-colors pr-6">{ticket.title.replace('[ПРОСТРОЧЕНО] ', '')}</h3>

                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${getSLAStatus(ticket).color}`}>
                          <Clock size={10} /> SLA: {getSLAStatus(ticket).text}
                        </span>
                      </div>

                      {canEdit && (
                        <button onClick={() => handleDeleteTicket(ticket.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Видалити заявку">
                          <Trash2 size={14} />
                        </button>
                      )}

                      <div className="flex gap-2 mt-1">
                        {canEdit && ticket.status === 'open' && (
                          <button onClick={() => handleMoveStatus(ticket.id, 'in_progress')} className="w-full text-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-bold py-1.5 rounded-md border border-blue-500/20 transition-colors flex items-center justify-center gap-1">
                            В роботу <ArrowRight size={12} />
                          </button>
                        )}
                        {canEdit && ticket.status === 'in_progress' && (
                          <>
                            <button onClick={() => handleMoveStatus(ticket.id, 'open')} className="px-2 bg-white/5 hover:bg-white/10 text-gray-400 py-1.5 rounded-md border border-white/5 transition-colors" title="Повернути назад"><ArrowLeft size={12} /></button>
                            <button onClick={() => handleMoveStatus(ticket.id, 'resolved')} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold py-1.5 rounded-md border border-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                              Вирішено <CheckCircle size={12} />
                            </button>
                          </>
                        )}
                        {canEdit && ticket.status === 'resolved' && (
                          <button onClick={() => handleMoveStatus(ticket.id, 'in_progress')} className="w-full text-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold py-1.5 rounded-md border border-amber-500/20 transition-colors flex items-center justify-center gap-1">
                            <ArrowLeft size={12} /> Перевідкрити
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-gray-300"><User size={11} /></div>
                          <span className="truncate max-w-[120px]">{ticket.requester}</span>
                        </div>
                        <div className="text-xs text-gray-500">{ticket.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {filteredTickets.filter(t => t.status === column.id).length === 0 && (
                  <div className="text-xs text-gray-600 text-center py-8 border border-dashed border-border rounded-xl bg-card">Порожньо</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}