'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Search, Bell, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Header() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Не вдалося завантажити сповіщення:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const displayName = session?.user?.name || 'Користувач';
  const role = (session?.user as any)?.role || 'guest';
  
  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'admin': return 'Адміністратор';
      case 'tech': return 'Технік';
      case 'user': return 'Співробітник';
      default: return 'Гість';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  const currentDate = new Date().toLocaleDateString('uk-UA', dateOptions);

  return (
    <header className="w-full flex items-center justify-between py-6 px-8 bg-background border-b border-border sticky top-0 z-40">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl text-white font-medium">
          Добрий ранок, <span className="font-semibold">{loading ? "..." : displayName}</span>
          <span className="text-gray-400 font-normal text-sm ml-2 italic">
            {getRoleLabel(role)}
          </span>
        </h1>
        <p className="text-sm text-gray-500 capitalize">{currentDate}</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Шукати будь-що..." 
            className="bg-secondary/50 border border-border text-white text-sm rounded-full pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-400 hover:text-white transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full right-0 mt-4 w-72 bg-card rounded-xl border border-border shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-border flex justify-between items-center bg-secondary/30">
                  <span className="font-semibold text-sm text-white">Сповіщення</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] text-primary hover:text-primary/80 transition-colors"
                    >
                      Прочитано
                    </button>
                  )}
                </div>
                <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "p-3 border-b border-border text-sm hover:bg-secondary/50 transition-colors cursor-pointer", 
                          n.read ? "opacity-60" : "bg-primary/5"
                        )}
                      >
                        <p className={cn("text-xs mb-1", n.read ? "text-gray-400" : "text-white font-medium")}>
                          {n.text}
                        </p>
                        <span className="text-[10px] text-gray-500">{n.time}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-500">
                      Немає нових подій
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3 border-l border-border pl-6 relative group cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
            {getInitials(displayName)}
          </div>
          
          <div className="absolute top-full right-0 mt-4 w-48 bg-card rounded-xl border border-border shadow-2xl z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <div className="p-2">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Вийти
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
