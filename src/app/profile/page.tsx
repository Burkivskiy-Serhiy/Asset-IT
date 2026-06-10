'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Key, Clock, Settings, Laptop, Ticket, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
export default function ProfilePage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'guest';
  const userName = session?.user?.name || 'Невідомий користувач';
  const userEmail = session?.user?.email || 'Немає email';
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  useEffect(() => {
    if (userName) {
      fetch('/api/logs')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const myLogs = data.filter(log => log.actor === userName || log.actor === userEmail);
            setLogs(myLogs.slice(0, 10)); 
          }
          setLoadingLogs(false);
        })
        .catch(() => setLoadingLogs(false));
    }
  }, [userName, userEmail]);
  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'admin': return 'Головний Адміністратор';
      case 'tech': return 'Технічний Спеціаліст';
      case 'user': return 'Співробітник';
      default: return 'Гість';
    }
  };
  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-3xl overflow-hidden bg-[#141414] border border-border shadow-2xl">
        <div className="h-48 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden flex items-end pb-6 px-8 sm:px-12">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay" />
          <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between sm:items-end gap-4 ml-36">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{userName}</h1>
              <p className="text-gray-200 font-medium flex items-center gap-2 text-sm opacity-90">
                <Mail size={14} /> {userEmail}
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto pb-1">
              <div className="px-4 py-1.5 bg-background/40 backdrop-blur-md border border-primary/40 text-primary rounded-xl font-semibold flex items-center gap-2 text-sm shadow-xl">
                <Shield size={16} />
                {getRoleLabel(userRole)}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-8 top-32 z-20">
          <div className="w-32 h-32 rounded-full border-[6px] border-[#141414] bg-[#0a0a0a] flex items-center justify-center text-4xl font-black text-primary shadow-2xl relative">
            {getInitials(userName)}
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-primary rounded-full border-2 border-[#141414]" title="Онлайн" />
          </div>
        </div>
        <div className="h-20 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
          <Card className="bg-card border-border rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-border pb-4">
                <User size={18} className="text-blue-400" /> Особисті дані
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Повне ім'я</p>
                  <p className="text-sm font-semibold text-gray-200">{userName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Email адреса</p>
                  <p className="text-sm font-semibold text-gray-200">{userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Дата реєстрації</p>
                  <p className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" /> Червень 2026
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-border pb-4">
                <Key size={18} className="text-amber-400" /> Безпека
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-200">Двофакторна автентифікація</p>
                    <p className="text-xs text-gray-500">Додатковий захист акаунту</p>
                  </div>
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-md">Вимкнено</span>
                </div>
                <button className="w-full py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors">
                  Змінити пароль
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-card/80 to-card p-6 rounded-2xl flex items-center gap-5 border border-border shadow-lg">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500"><Laptop size={24} /></div>
              <div><p className="text-sm font-medium text-gray-400">Мої активи</p><h3 className="text-2xl font-black text-white">0 од.</h3></div>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-card/80 to-card p-6 rounded-2xl flex items-center gap-5 border border-border shadow-lg">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-500"><Ticket size={24} /></div>
              <div><p className="text-sm font-medium text-gray-400">Відкриті тікети</p><h3 className="text-2xl font-black text-white">0 шт.</h3></div>
            </motion.div>
          </div>
          <Card className="bg-card border-border rounded-2xl min-h-[400px]">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-border pb-4 mb-6">
                <Clock size={18} className="text-emerald-400" /> Останні дії
              </h3>
              {loadingLogs ? (
                <div className="flex justify-center items-center h-[250px]">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : logs.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {logs.map(log => (
                    <div key={log.id} className="flex gap-4 p-3 bg-secondary/30 rounded-xl border border-white/5">
                      <div className="mt-1">
                        {log.type?.toLowerCase().includes('error') ? <AlertTriangle size={16} className="text-red-400" /> : 
                         log.type?.toLowerCase().includes('warn') ? <AlertTriangle size={16} className="text-amber-400" /> : 
                         <Settings size={16} className="text-blue-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{log.text}</p>
                        <div className="flex gap-2 text-xs text-gray-500 mt-1 font-mono">
                          <span>{log.time || new Date(log.createdAt).toLocaleString('uk-UA')}</span>
                          <span>•</span>
                          <span className="uppercase text-primary/70">{log.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Settings size={24} className="opacity-50" />
                  </div>
                  <p>Ви ще не здійснювали жодних дій у системі.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
