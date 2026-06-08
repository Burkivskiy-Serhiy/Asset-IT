'use client';

import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
import { AuthProvider } from "@/providers/AuthProvider"; 
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation"; 
import { AlertOctagon, ShieldAlert, LogOut } from "lucide-react";

function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useSettings();
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (loading || status === "loading") {
    return null; 
  }

  const userRole = session?.user?.role?.toUpperCase();
  const isAdmin = userRole === "ADMIN";

  if (isAdmin) {
    return <>{children}</>;
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (settings?.maintenanceMode) {
    const handleForceLogout = async () => {
      try {
        
        await fetch('/api/auth/signout', { method: 'POST' });
        
        document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        window.location.href = '/login';
      } catch (err) {
        window.location.href = '/login';
      }
    };

    return (
      <div className="fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center bg-[#0a0a0a] text-white p-6">
        {/* Декоративна сітка на бекграунді */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        
        <div className="relative z-10 flex flex-col items-center max-w-md text-center">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 mb-6 animate-pulse">
            <AlertOctagon size={44} />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">
            Система на технічному обслуговуванні
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Головний системний адміністратор зараз проводить планове оновлення модулів. Доступ для персоналу тимчасово обмежено.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-white/5 px-3 py-2 rounded-xl border border-white/5 h-10">
              <ShieldAlert size={14} className="text-amber-500" /> 
              Status: 503
            </div>

            <button
              onClick={handleForceLogout}
              className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-white/5 hover:bg-red-500/20 hover:text-red-400 px-4 py-2 rounded-xl border border-white/5 hover:border-red-500/30 transition-all duration-200 active:scale-95 h-10 cursor-pointer"
            >
              <LogOut size={14} />
              Змінити користувача (Вийти)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>
        <AuthProvider>
          <SettingsProvider>
            <MaintenanceGuard>
              <div className="layout-wrapper">
                <Sidebar />
                <main className="main-content">
                  {children}
                </main>
              </div>
            </MaintenanceGuard>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}