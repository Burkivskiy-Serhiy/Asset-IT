"use client";

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, TrendingDown, Printer, ArrowRightLeft, Download, Zap, DollarSign, Package, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { useSettings } from '@/context/SettingsContext';

interface Asset {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber?: string;
  serial?: string;
  serial_number?: string;
  sn?: string;
  user?: any; 
  assignedTo?: string;
  userName?: string;
  price?: number;
  createdAt?: string;
}

const getUsefulLife = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('сервер')) return 7;
  if (cat.includes('ноутбук') || cat.includes('пк') || cat.includes('комп')) return 3;
  if (cat.includes('монітор') || cat.includes('мережа')) return 5;
  return 5;
};

export default function ReportsPage() {
  const { settings } = useSettings();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'depreciation' | 'transfers'>('inventory');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assetsRes, transfersRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/reports/transfers')
      ]);
      
      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(data);
      }
      
      if (transfersRes.ok) {
        const data = await transfersRes.json();
        setTransfers(data);
      }
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // РОЗРАХУНОК АМОРТИЗАЦІЇ
  const depreciationData = useMemo(() => {
    return assets.map(asset => {
      let initialValue = asset.price || 0;
      if (initialValue === 0) {
        const cat = asset.category.toLowerCase();
        if (cat.includes('сервер')) initialValue = 120000;
        else if (cat.includes('ноутбук')) initialValue = 45000;
        else if (cat.includes('монітор')) initialValue = 8000;
        else if (cat.includes('мережа')) initialValue = 15000;
        else initialValue = 5000;
      }

      const mockAgeYears = Math.floor(Math.random() * 4) + 1;
      const purchaseDate = asset.createdAt ? new Date(asset.createdAt) : new Date(Date.now() - mockAgeYears * 365 * 24 * 60 * 60 * 1000);
      const currentDate = new Date();
      
      const usefulLifeYears = getUsefulLife(asset.category);
      const ageInMonths = (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 + (currentDate.getMonth() - purchaseDate.getMonth());
      const ageInYears = Math.max(0, ageInMonths / 12);
      
      const yearlyDepreciation = initialValue / usefulLifeYears;
      const accumulatedDepreciation = Math.min(initialValue, yearlyDepreciation * ageInYears);
      const residualValue = Math.max(0, initialValue - accumulatedDepreciation);

      return {
        ...asset,
        initialValue,
        usefulLifeYears,
        ageInYears,
        accumulatedDepreciation,
        residualValue,
        purchaseDate
      };
    });
  }, [assets]);

  // ДАНІ ДЛЯ ГРАФІКІВ
  const categoryChartData = useMemo(() => {
    const grouped: Record<string, { category: string, initialTotal: number, residualTotal: number }> = {};
    depreciationData.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = { category: item.category, initialTotal: 0, residualTotal: 0 };
      }
      grouped[item.category].initialTotal += item.initialValue;
      grouped[item.category].residualTotal += item.residualValue;
    });
    return Object.values(grouped);
  }, [depreciationData]);

  const forecastChartData = useMemo(() => {
    const data = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 5; i++) {
      const year = currentYear + i;
      let projectedValue = 0;
      
      depreciationData.forEach(item => {
        const ageInFuture = item.ageInYears + i;
        const yearlyDepreciation = item.initialValue / item.usefulLifeYears;
        const accumulated = Math.min(item.initialValue, yearlyDepreciation * ageInFuture);
        projectedValue += Math.max(0, item.initialValue - accumulated);
      });

      data.push({
        year: year.toString(),
        value: Math.round(projectedValue)
      });
    }
    return data;
  }, [depreciationData]);

  // CSV EXPORT
  const exportToCSV = () => {
    let csvContent = '\uFEFF'; 
    let filename = '';

    if (activeTab === 'inventory') {
      filename = 'inventory_report.csv';
      csvContent += '№,Найменування,Категорія,Бренд/Модель,Серійний номер,Закріплено за\n';
      assets.forEach((asset, index) => {
        const serial = asset.serialNumber || asset.serial || asset.serial_number || asset.sn || '—';
        let assignedUser = 'Не призначено';
        if (typeof asset.user === 'string') assignedUser = asset.user;
        else if (asset.user?.name) assignedUser = asset.user.name;
        else if (asset.assignedTo) assignedUser = asset.assignedTo;
        else if (asset.userName) assignedUser = asset.userName;
        
        const row = [
          index + 1,
          `"${asset.name.replace(/"/g, '""')}"`,
          `"${asset.category.replace(/"/g, '""')}"`,
          `"${(asset.brand + ' ' + asset.model).replace(/"/g, '""')}"`,
          `"${serial}"`,
          `"${assignedUser}"`
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (activeTab === 'depreciation') {
      filename = 'depreciation_report.csv';
      csvContent += 'Найменування,Серійний №,Дата вводу,Строк (р),Початкова вартість,Знос,Залишкова вартість\n';
      depreciationData.forEach(asset => {
        const row = [
          `"${asset.name.replace(/"/g, '""')}"`,
          `"${asset.serialNumber || '—'}"`,
          asset.purchaseDate.toLocaleDateString('uk-UA'),
          asset.usefulLifeYears,
          asset.initialValue.toFixed(2),
          asset.accumulatedDepreciation.toFixed(2),
          asset.residualValue.toFixed(2)
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (activeTab === 'transfers') {
      filename = 'transfers_report.csv';
      csvContent += 'Дата,Час,Актив,Передано від,Передано до,Попередня локація,Нова локація\n';
      transfers.forEach(transfer => {
        const date = new Date(transfer.date).toLocaleDateString('uk-UA');
        const time = new Date(transfer.date).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        const row = [
          date,
          time,
          `"${transfer.assetName.replace(/"/g, '""')}"`,
          `"${transfer.fromUser || 'Склад'}"`,
          `"${transfer.toUser || 'Склад'}"`,
          `"${transfer.fromLocation || '-'}"`,
          `"${transfer.toLocation || '-'}"`
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh]"><Zap className="animate-pulse mb-4 text-primary" size={32}/>Генерування звітів...</div>;
  }

  const currentDate = new Date().toLocaleDateString('uk-UA');
  const totalAssetsValue = depreciationData.reduce((acc, a) => acc + a.residualValue, 0);
  const totalAssetsInitial = depreciationData.reduce((acc, a) => acc + a.initialValue, 0);

  // РЕНДЕР ТАБЛИЦІ ІНВЕНТАРИЗАЦІЇ
  const renderInventoryDocument = (isPrintMode: boolean = false) => (
    <div className={cn("w-full bg-white text-black transition-transform", isPrintMode ? "" : "max-w-[210mm] min-h-[297mm] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm mx-auto")}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold uppercase mb-2 text-black tracking-wider">Інвентаризаційна відомість № 1</h2>
        <p className="text-gray-800 font-medium">станом на {currentDate} року</p>
      </div>

      <table className="w-full text-sm border-collapse border border-black mb-12 text-black">
        <thead>
          <tr className="bg-gray-200 font-bold" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <th className="border border-black p-2 text-center w-12">№</th>
            <th className="border border-black p-2 text-left">Найменування</th>
            <th className="border border-black p-2 text-left">Категорія</th>
            <th className="border border-black p-2 text-left">Бренд / Модель</th>
            <th className="border border-black p-2 text-left">Серійний номер</th>
            <th className="border border-black p-2 text-left">Закріплено за</th>
          </tr>
        </thead>
        <tbody>
          {assets.length > 0 ? assets.map((asset, index) => {
            const serial = asset.serialNumber || asset.serial || asset.serial_number || asset.sn || '—';
            let assignedUser = 'Не призначено';
            if (typeof asset.user === 'string') assignedUser = asset.user;
            else if (asset.user?.name) assignedUser = asset.user.name;
            else if (asset.assignedTo) assignedUser = asset.assignedTo;
            else if (asset.userName) assignedUser = asset.userName;

            return (
              <tr key={asset.id} className={!isPrintMode ? "hover:bg-gray-50" : ""}>
                <td className="border border-black p-2 text-center">{index + 1}</td>
                <td className="border border-black p-2 font-medium">{asset.name}</td>
                <td className="border border-black p-2 text-xs">{asset.category}</td>
                <td className="border border-black p-2 text-xs">{asset.brand} {asset.model}</td>
                <td className="border border-black p-2 font-mono text-xs">{serial}</td>
                <td className="border border-black p-2 text-xs font-semibold">{assignedUser}</td>
              </tr>
            );
          }) : (
            <tr><td colSpan={6} className="border border-black p-4 text-center">Немає даних</td></tr>
          )}
        </tbody>
      </table>

      <div className="mt-16 text-sm">
        <p className="font-bold mb-8">Комісія у складі:</p>
        {['Голова комісії:', 'Матеріально відповідальна особа:'].map((role, i) => (
          <div key={i} className="mb-8">
            <div className="flex items-end">
              <div className="w-1/3 pb-1 font-medium">{role}</div>
              <div className="w-1/3 border-b border-black mx-2"></div>
              <div className="w-1/4 border-b border-black ml-auto"></div>
            </div>
            <div className="flex">
              <div className="w-1/3"></div>
              <div className="w-1/3 text-center text-[10px] text-gray-500 pt-1">(підпис)</div>
              <div className="w-1/4 text-center text-[10px] text-gray-500 pt-1 ml-auto">(П.І.Б.)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // РЕНДЕР ТАБЛИЦІ АМОРТИЗАЦІЇ
  const renderDepreciationDocument = (isPrintMode: boolean = false) => (
    <div className={cn("w-full bg-white text-black transition-transform", isPrintMode ? "" : "max-w-[210mm] min-h-[297mm] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm mx-auto")}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold uppercase mb-2 text-black tracking-wider">Звіт про амортизацію ІТ-активів</h2>
        <p className="text-gray-800 font-medium">станом на {currentDate} року</p>
      </div>

      <table className="w-full text-xs border-collapse border border-black mb-12 text-black">
        <thead>
          <tr className="bg-gray-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <th className="border border-black p-2 text-left">Найменування</th>
            <th className="border border-black p-2 text-center">Серійний №</th>
            <th className="border border-black p-2 text-center">Дата вводу</th>
            <th className="border border-black p-2 text-center w-12">Строк (р)</th>
            <th className="border border-black p-2 text-right">Початкова вартість</th>
            <th className="border border-black p-2 text-right">Знос</th>
            <th className="border border-black p-2 text-right bg-blue-100 font-bold">Залишкова вартість</th>
          </tr>
        </thead>
        <tbody>
          {depreciationData.length > 0 ? depreciationData.map((asset) => {
            const formatMoney = (val: number) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: settings?.currency || 'UAH', maximumFractionDigits: 0 }).format(val);
            const isFullyDepreciated = asset.residualValue === 0;

            return (
              <tr key={asset.id} className={isFullyDepreciated ? 'bg-red-50/50 text-gray-500' : (!isPrintMode ? 'hover:bg-gray-50' : '')}>
                <td className="border border-black p-2 font-medium">{asset.name}</td>
                <td className="border border-black p-2 text-center font-mono">{asset.serialNumber || '—'}</td>
                <td className="border border-black p-2 text-center">{asset.purchaseDate.toLocaleDateString('uk-UA')}</td>
                <td className="border border-black p-2 text-center">{asset.usefulLifeYears}</td>
                <td className="border border-black p-2 text-right">{formatMoney(asset.initialValue)}</td>
                <td className="border border-black p-2 text-right text-red-600 font-medium">{formatMoney(asset.accumulatedDepreciation)}</td>
                <td className={`border border-black p-2 text-right font-bold ${isFullyDepreciated ? 'text-gray-400' : 'text-green-700 bg-blue-50/50'}`}>
                  {formatMoney(asset.residualValue)}
                </td>
              </tr>
            );
          }) : (
            <tr><td colSpan={7} className="border border-black p-4 text-center">Немає даних</td></tr>
          )}
        </tbody>
      </table>
      
      <div className="mt-8 pt-6 border-t-2 border-black flex justify-between font-bold text-sm">
        <div>Усього активів: {depreciationData.length} од.</div>
        <div className="text-right">
          Загальна залишкова вартість: {' '}
          <span className="text-green-700 ml-2">
            {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: settings?.currency || 'UAH', maximumFractionDigits: 0 }).format(totalAssetsValue)}
          </span>
        </div>
      </div>
    </div>
  );

  // РЕНДЕР ТАБЛИЦІ ПЕРЕМІЩЕНЬ
  const renderTransfersDocument = (isPrintMode: boolean = false) => (
    <div className={cn("w-full bg-white text-black transition-transform", isPrintMode ? "" : "max-w-[210mm] min-h-[297mm] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm mx-auto")}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold uppercase mb-2 text-black tracking-wider">Журнал переміщень ІТ-активів</h2>
        <p className="text-gray-800 font-medium">станом на {currentDate} року</p>
      </div>

      <table className="w-full text-sm border-collapse border border-black mb-12 text-black">
        <thead>
          <tr className="bg-gray-200 font-bold" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <th className="border border-black p-2 text-left w-24">Дата / Час</th>
            <th className="border border-black p-2 text-left">Актив</th>
            <th className="border border-black p-2 text-left">Передано від</th>
            <th className="border border-black p-2 text-left">Передано до</th>
            <th className="border border-black p-2 text-left">Зміна локації</th>
          </tr>
        </thead>
        <tbody>
          {transfers.length > 0 ? transfers.map((transfer) => {
            const date = new Date(transfer.date).toLocaleDateString('uk-UA');
            const time = new Date(transfer.date).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
            
            return (
              <tr key={transfer.id} className={!isPrintMode ? "hover:bg-gray-50" : ""}>
                <td className="border border-black p-2 text-center text-xs text-gray-600 font-medium">{date} <br/> <span className="text-gray-400">{time}</span></td>
                <td className="border border-black p-2 font-bold">{transfer.assetName}</td>
                <td className="border border-black p-2 text-red-600 font-medium">{transfer.fromUser || 'Склад / Новий'}</td>
                <td className="border border-black p-2 text-green-600 font-medium">{transfer.toUser || 'Склад / Списано'}</td>
                <td className="border border-black p-2 text-xs">
                  {transfer.fromLocation !== transfer.toLocation ? (
                    <div className="flex items-center gap-1">
                      <span className="line-through text-gray-500">{transfer.fromLocation || '-'}</span>
                      <ArrowRightLeft size={10} className="text-black" />
                      <span className="font-semibold">{transfer.toLocation || '-'}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Без змін</span>
                  )}
                </td>
              </tr>
            );
          }) : (
            <tr><td colSpan={5} className="border border-black p-4 text-center">Історія переміщень порожня</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="p-6 max-w-[1600px] mx-auto space-y-8 text-white print:hidden">
        
        {/* Шапка та навігація */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-border pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-1 flex items-center gap-3">
              <FileText size={32} className="text-blue-400" /> Генератор звітів
            </h1>
            <p className="text-muted-foreground font-light text-sm">Аналітика, амортизація активів та підготовка документів до друку.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="flex bg-secondary/40 p-1.5 rounded-xl border border-border/50 backdrop-blur-md w-full sm:w-auto overflow-x-auto">
              <button 
                onClick={() => setActiveTab('inventory')}
                className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap", activeTab === 'inventory' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-secondary/60')}
              >
                <Package size={16} /> Інвентаризація
              </button>
              <button 
                onClick={() => setActiveTab('depreciation')}
                className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap", activeTab === 'depreciation' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-secondary/60')}
              >
                <TrendingDown size={16} /> Амортизація
              </button>
              <button 
                onClick={() => setActiveTab('transfers')}
                className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap", activeTab === 'transfers' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-secondary/60')}
              >
                <Shuffle size={16} /> Журнал переміщень
              </button>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={exportToCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-white border border-border rounded-xl hover:bg-secondary/80 transition-all font-medium text-sm">
                <Download size={16} /> CSV
              </button>
              <button onClick={handlePrint} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-medium text-sm shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                <Printer size={16} /> Друк
              </button>
            </div>
          </div>
        </div>

        {/* ВІДЖЕТИ СТАТИСТИКИ */}
        <AnimatePresence mode="wait">
          {activeTab === 'inventory' && (
            <motion.div key="stats-inv" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-card/80 to-card p-6 rounded-2xl flex items-center gap-5 border border-border/50 shadow-lg backdrop-blur-xl">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500"><Package size={24} /></div>
                <div><p className="text-sm font-medium text-gray-400">Усього техніки</p><h3 className="text-2xl font-bold">{assets.length} од.</h3></div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'depreciation' && (
            <motion.div key="stats-dep" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-card/80 to-card p-6 rounded-2xl flex items-center gap-5 border border-border/50 shadow-lg backdrop-blur-xl">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500"><DollarSign size={24} /></div>
                <div><p className="text-sm font-medium text-gray-400">Залишкова вартість</p><h3 className="text-2xl font-bold">₴{(totalAssetsValue / 1000).toFixed(1)}k</h3></div>
              </div>
              <div className="bg-gradient-to-br from-card/80 to-card p-6 rounded-2xl flex items-center gap-5 border border-border/50 shadow-lg backdrop-blur-xl">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500"><TrendingDown size={24} /></div>
                <div><p className="text-sm font-medium text-gray-400">Початкова вартість</p><h3 className="text-2xl font-bold">₴{(totalAssetsInitial / 1000).toFixed(1)}k</h3></div>
              </div>
              <div className="bg-gradient-to-br from-card/80 to-card p-6 rounded-2xl flex items-center gap-5 border border-border/50 shadow-lg backdrop-blur-xl">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500"><Zap size={24} /></div>
                <div><p className="text-sm font-medium text-gray-400">Амортизовано</p><h3 className="text-2xl font-bold">{((1 - totalAssetsValue/totalAssetsInitial) * 100).toFixed(1)}%</h3></div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transfers' && (
            <motion.div key="stats-tr" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-card/80 to-card p-6 rounded-2xl flex items-center gap-5 border border-border/50 shadow-lg backdrop-blur-xl">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-500"><Shuffle size={24} /></div>
                <div><p className="text-sm font-medium text-gray-400">Всього переміщень</p><h3 className="text-2xl font-bold">{transfers.length} записів</h3></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* КОНТЕНТ ЗВІТУ (ЕКРАННИЙ ПЕРЕГЛЯД) */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {activeTab === 'depreciation' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Графіки для амортизації */}
                <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-xl">
                  <h3 className="text-white font-bold mb-6 flex items-center gap-2"><DollarSign size={18} className="text-emerald-400"/> Вартість активів за категоріями</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="category" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₴${val / 1000}k`} />
                        <RechartsTooltip 
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                          formatter={(value: any) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value)}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar dataKey="initialTotal" name="Початкова вартість" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="residualTotal" name="Залишкова вартість" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-xl">
                  <h3 className="text-white font-bold mb-6 flex items-center gap-2"><TrendingDown size={18} className="text-amber-400"/> Прогноз загальної вартості (5 років)</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="year" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₴${val / 1000}k`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                          formatter={(value: any) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value)}
                          labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Line type="monotone" dataKey="value" name="Вартість парку" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, fill: '#18181b', stroke: '#f59e0b', strokeWidth: 3 }} activeDot={{ r: 8, fill: '#f59e0b' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card/30 backdrop-blur-md p-6 lg:p-10 rounded-3xl border border-border shadow-2xl mx-auto flex justify-center">
              {activeTab === 'inventory' && renderInventoryDocument(false)}
              {activeTab === 'depreciation' && renderDepreciationDocument(false)}
              {activeTab === 'transfers' && renderTransfersDocument(false)}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* МАГІЯ ПОРТАЛУ ДЛЯ ДРУКУ */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div id="print-root" className="hidden print:block w-full bg-white text-black">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body {
                background: white !important;
              }
              body > *:not(#print-root) {
                display: none !important;
              }
              @page {
                size: A4;
                margin: 15mm;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
            }
          `}} />
          {activeTab === 'inventory' && renderInventoryDocument(true)}
          {activeTab === 'depreciation' && renderDepreciationDocument(true)}
          {activeTab === 'transfers' && renderTransfersDocument(true)}
        </div>,
        document.body
      )}
    </>
  );
}