'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Database,
  Key, 
  Settings, 
  Activity,
  Ticket,
  Users,
  FileText,
  Cpu,
  Wrench
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const menuItems = [
  { 
    group: 'Головне меню',
    items: [
      { icon: LayoutDashboard, label: 'Дашборд', href: '/', allowedRoles: ['admin', 'tech', 'user'] },
    ]
  },
  {
    group: 'Інфраструктура',
    items: [
      { icon: Database, label: 'ІТ-Активи', href: '/assets', allowedRoles: ['admin', 'tech', 'user'] },
      { icon: Key, label: 'Ліцензії та ПЗ', href: '/licenses', allowedRoles: ['admin', 'tech'] }, 
      { icon: Activity, label: 'Моніторинг', href: '/monitoring', allowedRoles: ['admin', 'tech'] },
    ]
  },
  {
    group: 'Управління',
    items: [
      { icon: Ticket, label: 'Служба підтримки', href: '/helpdesk', allowedRoles: ['admin', 'tech', 'user'] },
      { icon: Wrench, label: 'Планове ТО', href: '/maintenance', allowedRoles: ['admin', 'tech'] },
      { icon: FileText, label: 'Звіти та відомості', href: '/reports', allowedRoles: ['admin', 'tech'] },
      { icon: Users, label: 'Співробітники', href: '/employees', allowedRoles: ['admin', 'tech'] },
    ]
  },
  {
    group: 'Налаштування',
    items: [
      { icon: Settings, label: 'Налаштування', href: '/settings', allowedRoles: ['admin'] },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  if (pathname === '/login') {
    return null;
  }

  const userRole = (session?.user as any)?.role || 'guest';

  return (
    <aside className="w-[260px] h-screen bg-card border-r border-border flex flex-col sticky top-0 z-50">
      <div className="px-6 h-24 flex items-center gap-3 border-b border-border">
        <div className="relative flex items-center justify-center">
          <Cpu className="text-primary" size={32} strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">
          Asset<span className="text-primary">-IT</span>
        </span>
      </div>
      
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 flex flex-col gap-6">
        {menuItems.map((group, idx) => {
          const groupItems = group.items.filter(item => item.allowedRoles.includes(userRole));
          
          if (groupItems.length === 0) return null;

          return (
            <div key={idx} className="px-4">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {group.group}
              </h3>
              <div className="flex flex-col gap-1">
                {groupItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div 
                        className={cn(
                          "flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="sidebar-active"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                          />
                        )}
                        <item.icon size={18} className={cn("mr-3", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-300")} />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}