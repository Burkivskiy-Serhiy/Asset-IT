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

interface HelpdeskTicket {
  id: string;
  title: string;
  requester: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  time: string;
}

export default function HelpdeskPage() {
  const { settings, loading } = useSettings();
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', requester: '', priority: 'low' });
  const [searchQuery, setSearchQuery] = useState('');

  // Допоміжна функція для отримання поточного часу рядком HH:MM:SS
  const getCurrentTimeStr = () => {
    return new Date().toTimeString().split(' ')[0];
  };

  // Допоміжна функція для відправки логів
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

  // Завантаження заявок з БД
  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch('/api/tickets');
        if (res.ok) {
          const data = await res.json();
          setTickets(data);
        }
      } catch (err) {
        console.error("Помилка завантаження заявок:", err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchTickets();
  }, []);

  // Створення нової заявки
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const ticketData: HelpdeskTicket = {
      id: `INC-${Math.floor(Math.random() * 9000) + 1000}`,
      title: newTicket.title,
      requester: newTicket.requester,
      priority: newTicket.priority as 'low' | 'medium' | 'high' | 'critical',
      status: 'open',
      time: 'Щойно',
    };

    // Оптимістичне оновлення UI
    setTickets([ticketData, ...tickets]);
    setIsModalOpen(false);
    setNewTicket({ title: '', requester: '', priority: 'low' });

    // Відправка в БД + Логування
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

  // Зміна статусу тікета
  const handleMoveStatus = async (id: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    const currentTicket = tickets.find(t => t.id === id);
    
    // Мапа статусів для красивого тексту в логах
    const statusNames = {
      open: 'Відкрито / Перевідкрито',
      in_progress: 'В роботі',
      resolved: 'Вирішено'
    };

    // Оптимістичне оновлення UI
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    // Оновлення в БД + Логування
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

  // Видалення тікета
  const handleDeleteTicket = async (id: string) => {
    const currentTicket = tickets.find(t => t.id === id);
    if (!confirm(`Ви впевнені, що хочете видалити заявку ${id}?`)) return;

    // Оптимістичне оновлення UI
    setTickets(prev => prev.filter(t => t.id !== id));
    
    // Видалення з БД + Логування
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

  const columns = [
    { id: 'open', title: 'Відкриті заявки', count: tickets.filter(t => t.status === 'open').length },
    { id: 'in_progress', title: 'В роботі', count: tickets.filter(t => t.status === 'in_progress').length },
    { id: 'resolved', title: 'Вирішені', count: tickets.filter(t => t.status === 'resolved').length },
  ];

  return (
    <div className="flex flex-col gap-6 min-h-screen text-white relative">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Служба підтримки</h1>
          <p className="text-muted-foreground text-sm">
            Управління інцидентами під контролем: <span className="text-indigo-400 font-medium">{loading ? '...' : settings.adminName}</span>
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:brightness-110 text-white font-semibold transition-all self-start sm:self-center">
              + Створити заявку
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#141416] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Нова заявка</DialogTitle>
              <DialogDescription className="text-gray-400">
                Зафіксуйте новий інцидент або запит на обслуговування в системі.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="grid gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Короткий опис проблеми</label>
                <Input required value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} className="bg-white/5 border-white/10 focus:border-primary text-white" placeholder="Наприклад: Не працює мишка" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Хто повідомляє?</label>
                <Input required value={newTicket.requester} onChange={e => setNewTicket({...newTicket, requester: e.target.value})} className="bg-white/5 border-white/10 focus:border-primary text-white" placeholder="ПІБ або назва відділу" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Рівень критичності</label>
                <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})} className="h-10 rounded-md bg-neutral-900 border border-white/10 px-3 text-sm text-white focus:border-primary focus:outline-none">
                  <option value="low">Низький</option>
                  <option value="medium">Середній</option>
                  <option value="high">Високий</option>
                  <option value="critical">Критичний</option>
                </select>
              </div>
              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-white/10 hover:bg-white/5 text-white">Скасувати</Button>
                <Button type="submit" className="bg-primary hover:brightness-110 text-white">Створити тікет</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="w-full max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input type="text" placeholder="Пошук за назвою, користувачем чи ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-[#141416]/60 border-white/5 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-primary rounded-xl" />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={16} /></button>
        )}
      </div>

      {dataLoading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Завантаження тікетів...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map(column => (
            <div key={column.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-[#141416]/60 backdrop-blur-md p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-gray-300">
                  {getColumnIcon(column.id)} <span>{column.title}</span>
                </div>
                <span className="bg-white/5 border border-white/5 text-xs py-0.5 px-2.5 rounded-md font-mono text-white font-bold">{column.count}</span>
              </div>

              <div className="flex flex-col gap-3 min-h-[500px]">
                <AnimatePresence mode="popLayout">
                  {filteredTickets.filter(t => t.status === column.id).map(ticket => (
                    <motion.div 
                      layout key={ticket.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                      className="bg-[#141416]/40 backdrop-blur-sm border border-white/5 p-4 rounded-xl flex flex-col gap-3 hover:border-primary/30 transition-colors shadow-sm group relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 font-mono"><Ticket size={14} className="text-gray-600" />{ticket.id}</div>
                        <span className={`text-[9px] tracking-wider uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                      </div>

                      <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-primary transition-colors pr-6">{ticket.title}</h3>

                      <button onClick={() => handleDeleteTicket(ticket.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Видалити заявку">
                        <Trash2 size={14} />
                      </button>

                      <div className="flex gap-2 mt-1">
                        {ticket.status === 'open' && (
                          <button onClick={() => handleMoveStatus(ticket.id, 'in_progress')} className="w-full text-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-bold py-1.5 rounded-md border border-blue-500/20 transition-colors flex items-center justify-center gap-1">
                            В роботу <ArrowRight size={12} />
                          </button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <>
                            <button onClick={() => handleMoveStatus(ticket.id, 'open')} className="px-2 bg-white/5 hover:bg-white/10 text-gray-400 py-1.5 rounded-md border border-white/5 transition-colors" title="Повернути назад"><ArrowLeft size={12} /></button>
                            <button onClick={() => handleMoveStatus(ticket.id, 'resolved')} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold py-1.5 rounded-md border border-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                              Вирішено <CheckCircle size={12} />
                            </button>
                          </>
                        )}
                        {ticket.status === 'resolved' && (
                          <button onClick={() => handleMoveStatus(ticket.id, 'in_progress')} className="w-full text-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold py-1.5 rounded-md border border-amber-500/20 transition-colors flex items-center justify-center gap-1">
                            <ArrowLeft size={12} /> Перевідкрити
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <div className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-300"><User size={11} /></div>
                          <span className="truncate max-w-[120px]">{ticket.requester}</span>
                        </div>
                        <div className="text-xs text-gray-500">{ticket.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {filteredTickets.filter(t => t.status === column.id).length === 0 && (
                  <div className="text-xs text-gray-600 text-center py-8 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">Порожньо</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}