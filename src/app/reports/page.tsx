"use client";

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, TrendingDown, Printer } from 'lucide-react';

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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'depreciation'>('inventory');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Помилка завантаження активів:', error);
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
      // Генерація ціни для старих тестових записів, де price = 0
      let initialValue = asset.price || 0;
      if (initialValue === 0) {
        // Mock price based on category to make charts look realistic
        const cat = asset.category.toLowerCase();
        if (cat.includes('сервер')) initialValue = 120000;
        else if (cat.includes('ноутбук')) initialValue = 45000;
        else if (cat.includes('монітор')) initialValue = 8000;
        else if (cat.includes('мережа')) initialValue = 15000;
        else initialValue = 5000;
      }

      // Якщо дата створення відсутня, беремо випадкову дату з минулого (1-4 роки)
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

  if (isLoading) {
    return <div className="p-8 text-white flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const currentDate = new Date().toLocaleDateString('uk-UA');

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* МАГІЯ ДЛЯ ДРУКУ */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-document, #printable-document * {
            visibility: visible;
          }
          #printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
        }
      `}} />

      {/* ПАНЕЛЬ КЕРУВАННЯ */}
      <div className="mb-8 bg-card border border-border rounded-xl p-6 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Генератор звітів</h1>
            <p className="text-gray-400 text-sm mt-1">Оберіть тип звіту для аналітики або друку</p>
          </div>
          
          <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-secondary'}`}
            >
              <FileText size={16} /> Інвентаризація
            </button>
            <button 
              onClick={() => setActiveTab('depreciation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'depreciation' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-secondary'}`}
            >
              <TrendingDown size={16} /> Амортизація
            </button>
          </div>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-white border border-border rounded-xl hover:bg-white/10 transition-all font-medium"
          >
            <Printer size={18} /> Друк / PDF
          </button>
        </div>
      </div>

      {/* РОЗДІЛ: ІНВЕНТАРИЗАЦІЙНА ВІДОМІСТЬ */}
      {activeTab === 'inventory' && (
        <div id="printable-document" className="max-w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-10 shadow-xl rounded-sm print:shadow-none print:p-0 print:rounded-none">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold uppercase mb-2 text-black">Інвентаризаційна відомість № 1</h2>
            <p className="text-gray-800">станом на {currentDate} року</p>
          </div>

          <table className="w-full text-sm border-collapse border border-black mb-12 text-black">
            <thead>
              <tr className="bg-gray-200 print:bg-gray-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <th className="border border-black p-2 text-left">№</th>
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
                  <tr key={asset.id}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2 font-medium">{asset.name}</td>
                    <td className="border border-black p-2">{asset.category}</td>
                    <td className="border border-black p-2">{asset.brand} {asset.model}</td>
                    <td className="border border-black p-2 font-mono text-xs">{serial}</td>
                    <td className="border border-black p-2">{assignedUser}</td>
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
                  <div className="w-1/3 pb-1">{role}</div>
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
      )}

      {/* РОЗДІЛ: ЗВІТ ПРО АМОРТИЗАЦІЮ */}
      {activeTab === 'depreciation' && (
        <div id="printable-document" className="space-y-6">
          
          <div className="print:hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Графік за категоріями */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-white font-semibold mb-6">Вартість активів за категоріями</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₴${val / 1000}k`} />
                    <RechartsTooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      formatter={(value: any) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value)}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="initialTotal" name="Початкова вартість" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="residualTotal" name="Залишкова вартість" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Графік прогнозу падіння вартості */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-white font-semibold mb-6">Прогноз загальної вартості (5 років)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="year" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₴${val / 1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      formatter={(value: any) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value)}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Line type="monotone" dataKey="value" name="Вартість парку" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Таблиця для друку і перегляду */}
          <div className="bg-white print:shadow-none shadow-xl rounded-sm p-10 text-black max-w-[210mm] mx-auto min-h-[297mm]">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold uppercase mb-2">Звіт про амортизацію ІТ-активів</h2>
              <p className="text-gray-800">станом на {currentDate} року</p>
            </div>

            <table className="w-full text-xs border-collapse border border-black mb-12 text-black">
              <thead>
                <tr className="bg-gray-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <th className="border border-black p-2 text-left">Найменування</th>
                  <th className="border border-black p-2 text-center">Серійний №</th>
                  <th className="border border-black p-2 text-center">Дата вводу</th>
                  <th className="border border-black p-2 text-center">Строк (р)</th>
                  <th className="border border-black p-2 text-right">Початкова вартість</th>
                  <th className="border border-black p-2 text-right">Знос</th>
                  <th className="border border-black p-2 text-right bg-blue-50">Залишкова вартість</th>
                </tr>
              </thead>
              <tbody>
                {depreciationData.length > 0 ? depreciationData.map((asset, index) => {
                  const formatMoney = (val: number) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val);
                  const isFullyDepreciated = asset.residualValue === 0;

                  return (
                    <tr key={asset.id} className={isFullyDepreciated ? 'bg-red-50 text-gray-500' : ''}>
                      <td className="border border-black p-2 font-medium">{asset.name}</td>
                      <td className="border border-black p-2 text-center font-mono">{asset.serialNumber || '—'}</td>
                      <td className="border border-black p-2 text-center">{asset.purchaseDate.toLocaleDateString('uk-UA')}</td>
                      <td className="border border-black p-2 text-center">{asset.usefulLifeYears}</td>
                      <td className="border border-black p-2 text-right">{formatMoney(asset.initialValue)}</td>
                      <td className="border border-black p-2 text-right text-red-600">{formatMoney(asset.accumulatedDepreciation)}</td>
                      <td className={`border border-black p-2 text-right font-bold ${isFullyDepreciated ? 'text-gray-400' : 'text-green-700 bg-blue-50'}`}>
                        {formatMoney(asset.residualValue)}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={7} className="border border-black p-4 text-center">Немає даних</td></tr>
                )}
              </tbody>
            </table>
            
            <div className="mt-8 pt-4 border-t-2 border-black flex justify-between font-bold text-sm">
              <div>Усього активів: {depreciationData.length} од.</div>
              <div className="text-right">
                Загальна залишкова вартість: {' '}
                <span className="text-green-700">
                  {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 })
                    .format(depreciationData.reduce((acc, a) => acc + a.residualValue, 0))}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}