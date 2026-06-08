"use client";

import { useState, useEffect } from 'react';

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
}

export default function ReportsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        console.log("Ось що приходить з бази:", data); 
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

  if (isLoading) {
    return <div className="p-8 text-white">Завантаження даних...</div>;
  }

  const currentDate = new Date().toLocaleDateString('uk-UA');

  return (
    <div className="min-h-screen p-4 md:p-8">
      
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
      <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-md print:hidden flex flex-col sm:flex-row justify-between items-center border border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-white">Генератор звітів</h1>
          <p className="text-gray-400 text-sm mt-1">Оберіть параметри та згенеруйте PDF для друку</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
          >
            🖨 Друк / Зберегти як PDF
          </button>
        </div>
      </div>

      {/* САМ ДОКУМЕНТ (Вигляд А4) */}
      <div 
        id="printable-document" 
        className="max-w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-10 md:p-12 shadow-2xl rounded-sm print:shadow-none print:p-0 print:rounded-none"
      >
        
        {/* Шапка документа */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase mb-2 text-black">Інвентаризаційна відомість № 1</h2>
          <p className="text-gray-800">станом на {currentDate} року</p>
        </div>

        {/* Таблиця з технікою */}
        <table className="w-full text-sm border-collapse border border-black mb-12 text-black">
          <thead>
            <tr className="bg-gray-200 print:bg-gray-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <th className="border border-black p-2 text-left text-black">№</th>
              <th className="border border-black p-2 text-left text-black">Найменування</th>
              <th className="border border-black p-2 text-left text-black">Категорія</th>
              <th className="border border-black p-2 text-left text-black">Бренд / Модель</th>
              <th className="border border-black p-2 text-left text-black">Серійний номер</th>
              <th className="border border-black p-2 text-left text-black">Закріплено за</th>
            </tr>
          </thead>
          <tbody>
            {assets.length > 0 ? (
              assets.map((asset, index) => {
                
                const serial = asset.serialNumber || asset.serial || asset.serial_number || asset.sn || '—';
                
                let assignedUser = 'Не призначено';
                if (typeof asset.user === 'string') {
                  assignedUser = asset.user;
                } else if (asset.user && asset.user.name) {
                  assignedUser = asset.user.name;
                } else if (asset.assignedTo) {
                  assignedUser = asset.assignedTo;
                } else if (asset.userName) {
                  assignedUser = asset.userName;
                }

                return (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="border border-black p-2 text-center text-black">{index + 1}</td>
                    <td className="border border-black p-2 font-medium text-black">{asset.name}</td>
                    <td className="border border-black p-2 text-black">{asset.category}</td>
                    <td className="border border-black p-2 text-black">{asset.brand} {asset.model}</td>
                    <td className="border border-black p-2 font-mono text-xs text-black">{serial}</td>
                    <td className="border border-black p-2 text-black">{assignedUser}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="border border-black p-4 text-center text-gray-800">
                  Немає даних для відображення
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Блок для підписів (Комісія) */}
        <div className="mt-16 text-sm text-black">
          <p className="font-bold mb-8 text-black">Комісія у складі:</p>
          
          {/* Голова комісії */}
          <div className="mb-8">
            <div className="flex items-end">
              <div className="w-1/3 text-black pb-1">Голова комісії:</div>
              <div className="w-1/3 border-b border-black mx-2"></div>
              <div className="w-1/4 border-b border-black ml-auto"></div>
            </div>
            <div className="flex">
              <div className="w-1/3"></div>
              <div className="w-1/3 text-center text-[10px] text-gray-500 pt-1">(підпис)</div>
              <div className="w-1/4 text-center text-[10px] text-gray-500 pt-1 ml-auto">(П.І.Б.)</div>
            </div>
          </div>

          {/* Матеріально відповідальна особа */}
          <div className="mb-8">
            <div className="flex items-end">
              <div className="w-1/3 text-black pb-1">Матеріально відповідальна особа:</div>
              <div className="w-1/3 border-b border-black mx-2"></div>
              <div className="w-1/4 border-b border-black ml-auto"></div>
            </div>
            <div className="flex">
              <div className="w-1/3"></div>
              <div className="w-1/3 text-center text-[10px] text-gray-500 pt-1">(підпис)</div>
              <div className="w-1/4 text-center text-[10px] text-gray-500 pt-1 ml-auto">(П.І.Б.)</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}