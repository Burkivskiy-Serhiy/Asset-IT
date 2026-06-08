'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Monitor, 
  Database,
  Key, 
  Settings, 
  ChevronRight,
  Activity,
  Ticket,
  Users,
  LogOut,
  FileText,
  Bell 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Дашборд', href: '/', allowedRoles: ['admin', 'tech', 'user'] },
  { icon: Database, label: 'ІТ-Активи', href: '/assets', allowedRoles: ['admin', 'tech', 'user'] },
  { icon: Key, label: 'Ліцензії та ПЗ', href: '/licenses', allowedRoles: ['admin', 'tech'] }, 
  { icon: FileText, label: 'Звіти та відомості', href: '/reports', allowedRoles: ['admin', 'tech'] },
  { icon: Ticket, label: 'Служба підтримки', href: '/helpdesk', allowedRoles: ['admin', 'tech', 'user'] },
  { icon: Activity, label: 'Моніторинг', href: '/monitoring', allowedRoles: ['admin', 'tech'] },
  { icon: Users, label: 'Співробітники', href: '/employees', allowedRoles: ['admin', 'tech'] },
  { icon: Settings, label: 'Налаштування', href: '/settings', allowedRoles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
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

  if (pathname === '/login') {
    return null;
  }

  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userRole = (session?.user as any)?.role || 'guest';
  const filteredMenuItems = menuItems.filter(item => item.allowedRoles.includes(userRole));

  const displayName = session?.user?.name || 'Користувач';
  const displayEmail = session?.user?.email || 'user@it.local';
  const isDataLoading = status === 'loading';

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'adm';
      case 'tech': return 'tch';
      case 'user': return 'usr';
      default: return '';
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <aside className="w-[260px] h-[calc(100vh-32px)] m-4 flex flex-col sticky top-4 z-50 glass-panel border-border">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <Monitor className="text-primary" />
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            IT-Asset
          </span>
        </div>
      </div>
      
      <nav className="flex-1 px-3 flex flex-col gap-2">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div 
                className={cn(
                  "flex items-center p-3 rounded-xl text-muted-foreground transition-all duration-200 relative gap-3 group",
                  isActive ? "text-primary bg-primary/10" : "hover:text-foreground hover:bg-white/5"
                )}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon size={20} />
                <span className="text-[15px] font-medium flex-1">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                  />
                )}
                <ChevronRight className="opacity-0 group-hover:opacity-50 transition-opacity" size={16} />
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* НИЖНІЙ БЛОК КОРИСТУВАЧА */}
      <div className="p-4 sm:p-6 border-t border-border relative">
        <div className="flex items-center gap-2 sm:gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-sm text-white shrink-0 relative group">
            {isDataLoading ? "..." : getInitials(displayName)}
            
            {userRole !== 'guest' && (
              <span className={cn(
                "absolute -top-1 -right-1 px-1 text-[8px] font-extrabold rounded uppercase border tracking-wider",
                userRole === 'admin' ? "bg-red-500/20 text-red-400 border-red-500/30" : 
                userRole === 'tech' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : 
                "bg-green-500/20 text-green-400 border-green-500/30"
              )}>
                {getRoleBadge(userRole)}
              </span>
            )}
          </div>
          
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold truncate text-white">
              {isDataLoading ? "Завантаження..." : displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isDataLoading ? "..." : displayEmail}
            </p>
          </div>

          {/* КНОПКА ДЗВІНОЧКА */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "p-2 rounded-lg transition-colors relative",
              showNotifications ? "text-white bg-white/10" : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
            title="Сповіщення"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-gray-900"></span>
            )}
          </button>

          {session && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Вийти"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* ВИПАДАЮЧЕ ВІКНО СПОВІЩЕНЬ */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-2 right-2 mb-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                <span className="font-semibold text-sm text-white">Сповіщення</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
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
                        "p-3 border-b border-gray-800/50 text-sm hover:bg-gray-800/50 transition-colors cursor-pointer", 
                        n.read ? "opacity-60" : "bg-gray-800/20"
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
    </aside>
  );
}