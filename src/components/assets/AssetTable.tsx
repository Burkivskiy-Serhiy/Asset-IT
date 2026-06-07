'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Laptop, 
  Server, 
  Wifi,
  Trash2,
  Edit,
  Check,
  Download // Додали іконку для завантаження
} from 'lucide-react';
import { Asset, AssetStatus, AssetType } from '@/types/asset';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AssetTableProps {
  assets: Asset[];
  onDelete: (id: string) => void;
  onEdit: (asset: Asset) => void;
}

const getStatusStyles = (status: AssetStatus) => {
  switch (status) {
    case 'active': return 'text-emerald-500 bg-emerald-500/10';
    case 'maintenance': return 'text-amber-500 bg-amber-500/10';
    case 'retired': return 'text-slate-500 bg-slate-500/10';
    case 'missing': return 'text-red-500 bg-red-500/10';
    default: return 'text-slate-500 bg-slate-500/10';
  }
};

const getStatusLabel = (status: AssetStatus) => {
  switch (status) {
    case 'active': return 'Активний';
    case 'maintenance': return 'Обслуговування';
    case 'retired': return 'Списаний';
    case 'missing': return 'Відсутній';
    default: return status;
  }
};

export default function AssetTable({ assets = [], onDelete, onEdit }: AssetTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (asset.owner || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || asset.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Функція для експорту поточної (відфільтрованої) таблиці в Excel/CSV
  const handleExportCSV = () => {
    if (filteredAssets.length === 0) return;

    // Заголовки стовпців (додаємо BOM символ \uFEFF для коректного відображення кирилиці в Excel)
    const headers = ['Назва активу', 'Серійний номер', 'Тип', 'Статус', 'Власник', 'Локація', 'Дата придбання'];
    
    const rows = filteredAssets.map(asset => [
      asset.name,
      asset.serialNumber || asset.id,
      asset.type,
      getStatusLabel(asset.status),
      asset.owner,
      asset.location,
      asset.purchaseDate
    ]);

    const csvContent = '\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `it_assets_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel p-6 overflow-hidden border-none">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Пошук за назвою або власником..." 
            className="pl-10 bg-white/5 border-white/10 focus:ring-primary text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          {/* Кнопка Експорту */}
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="gap-2 border-white/10 text-white bg-white/5 hover:bg-white/10"
            disabled={filteredAssets.length === 0}
          >
            <Download size={18} />
            <span>Експорт</span>
          </Button>

          {/* Випадаюче меню для фільтрів */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "gap-2 border-white/10 text-white hover:bg-white/10",
                  filterType !== 'all' ? "bg-indigo-500/20 border-indigo-500/50" : "bg-white/5"
                )}
              >
                <Filter size={18} />
                <span>
                  {filterType === 'all' && 'Всі типи'}
                  {filterType === 'hardware' && 'Тільки Hardware'}
                  {filterType === 'network' && 'Тільки Network'}
                  {filterType === 'software' && 'Тільки Software'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#121212] border-white/10 text-white min-w-[180px]">
              <DropdownMenuItem onClick={() => setFilterType('all')} className="gap-2 cursor-pointer focus:bg-white/5 focus:text-white flex justify-between">
                <span>Усі типи</span>
                {filterType === 'all' && <Check size={14} className="text-indigo-400" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => setFilterType('hardware')} className="gap-2 cursor-pointer focus:bg-white/5 focus:text-white flex justify-between">
                <div className="flex items-center gap-2"><Laptop size={14} /> Hardware</div>
                {filterType === 'hardware' && <Check size={14} className="text-indigo-400" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('network')} className="gap-2 cursor-pointer focus:bg-white/5 focus:text-white flex justify-between">
                <div className="flex items-center gap-2"><Server size={14} /> Network</div>
                {filterType === 'network' && <Check size={14} className="text-indigo-400" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('software')} className="gap-2 cursor-pointer focus:bg-white/5 focus:text-white flex justify-between">
                <div className="flex items-center gap-2"><Wifi size={14} /> Software</div>
                {filterType === 'software' && <Check size={14} className="text-indigo-400" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="font-bold text-white">Назва активу</TableHead>
              <TableHead className="font-bold text-white">Статус</TableHead>
              <TableHead className="font-bold text-white">Власник</TableHead>
              <TableHead className="font-bold text-white">Локація</TableHead>
              <TableHead className="font-bold text-white">Дата придбання</TableHead>
              <TableHead className="text-right font-bold text-white">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.length === 0 ? (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Активів не знайдено за вашим запитом.
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map((asset) => (
                <TableRow key={asset.id} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                        {asset.type === 'hardware' && <Laptop size={16} />}
                        {asset.type === 'network' && <Server size={16} />}
                        {asset.type === 'software' && <Wifi size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-[15px] text-white">{asset.name}</div>
                        <div className="text-xs text-muted-foreground">{asset.serialNumber || asset.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold",
                      getStatusStyles(asset.status)
                    )}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      {getStatusLabel(asset.status)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-white">{asset.owner}</TableCell>
                  <TableCell className="text-muted-foreground">{asset.location}</TableCell>
                  <TableCell className="text-muted-foreground">{asset.purchaseDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/5">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#121212] border-white/10 text-white min-w-[140px]">
                        <DropdownMenuItem onClick={() => onEdit(asset)} className="gap-2 cursor-pointer focus:bg-white/5 focus:text-white">
                          <Edit size={14} />
                          <span>Редагувати</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(asset.id)} className="gap-2 text-red-400 focus:text-red-400 cursor-pointer focus:bg-red-500/10">
                          <Trash2 size={14} />
                          <span>Видалити</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}