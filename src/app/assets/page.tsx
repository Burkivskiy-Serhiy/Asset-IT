'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Plus, Database, Laptop, Server, Monitor, Printer, Network, Pencil, Trash2, X, Search, User, MapPin, QrCode } from 'lucide-react';
import { useSession } from 'next-auth/react';
import QRCodeModal from '@/components/ui/QRCodeModal';
import QRScannerModal from '@/components/ui/QRScannerModal';
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Ноутбук': return <Laptop size={16} />;
    case 'Сервер': return <Server size={16} />;
    case 'Монітор': return <Monitor size={16} />;
    case 'Принтер': return <Printer size={16} />;
    case 'Мережа': return <Network size={16} />;
    default: return <Database size={16} />;
  }
};
export default function AssetsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'guest';
  const canEdit = userRole === 'admin' || userRole === 'tech';
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedQRAsset, setSelectedQRAsset] = useState<any | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    category: 'Ноутбук',
    brand: '',
    model: '',
    serial_number: '',
    specs: '',
    assignedTo: '',
    locationOffice: 'Головний офіс',
    locationFloor: '',
    locationRoom: '',
    warrantyExpires: ''
  });
  const fetchAssets = async () => {
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/assets?t=${timestamp}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAssets(data);
      } else if (data && Array.isArray(data.assets)) {
        setAssets(data.assets);
      } else {
        console.error("API повернув не масив:", data);
        setAssets([]); 
      }
    } catch (error) {
      console.error("Помилка завантаження активів:", error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      }
    } catch (error) {
      console.error("Помилка завантаження працівників для селекту:", error);
    }
  };
  useEffect(() => {
    fetchAssets();
    fetchEmployees(); 
  }, []);
  const handleEditClick = (asset: any) => {
    setIsEditing(true);
    setIsFormModalOpen(true);
    setEditId(asset.id);
    let parsedLocation = { office: 'Головний офіс', floor: '', room: '' };
    try {
      const parsed = JSON.parse(asset.location || '{}');
      parsedLocation = { ...parsedLocation, ...parsed };
    } catch (e) {
      if (asset.location) parsedLocation.office = asset.location;
    }
    setFormData({
      name: asset.name,
      status: asset.status,
      category: asset.category,
      brand: asset.brand || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      specs: asset.specs || '',
      assignedTo: asset.assignedTo || '',
      locationOffice: parsedLocation.office || 'Головний офіс',
      locationFloor: parsedLocation.floor || '',
      locationRoom: parsedLocation.room || '',
      warrantyExpires: asset.warrantyExpires ? new Date(asset.warrantyExpires).toISOString().split('T')[0] : ''
    });
  };
  const cancelEdit = () => {
    setIsEditing(false);
    setIsFormModalOpen(false);
    setEditId(null);
    setFormData({ name: '', status: 'active', category: 'Ноутбук', brand: '', model: '', serial_number: '', specs: '', assignedTo: '', locationOffice: 'Головний офіс', locationFloor: '', locationRoom: '', warrantyExpires: '' });
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей актив з каталогу?')) return;
    const assetToDelete = assets.find(a => a.id === id);
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (assetToDelete) {
          const now = new Date();
          const timeStr = now.toTimeString().split(' ')[0];
          const currentActor = session?.user?.name || session?.user?.email || 'Система';
          const deleteLog = {
            id: `log-${Date.now()}`,
            time: timeStr,
            type: 'error',
            actor: currentActor,
            source: 'ASSETS',
            text: `Безповоротно видалено актив: "${assetToDelete.name}" [S/N: ${assetToDelete.serial_number || 'Немає'}]`
          };
          await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deleteLog),
          });
        }
        fetchAssets();
        if (editId === id) cancelEdit(); 
      } else {
        const errData = await res.json();
        alert(`Помилка видалення: ${errData.error || 'Щось пішло не так'}`);
      }
    } catch (error) {
      console.error('Помилка видалення', error);
      alert('Мережева помилка при спробі видалити актив.');
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/assets/${editId}` : '/api/assets';
      const method = isEditing ? 'PUT' : 'POST';
      const dataToSend: any = { ...formData };
      if (['retired', 'missing'].includes(dataToSend.status)) {
        dataToSend.assignedTo = '';
      }
      dataToSend.location = JSON.stringify({
        office: formData.locationOffice,
        floor: formData.locationFloor,
        room: formData.locationRoom
      });
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (res.ok) {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const logType = isEditing ? 'warning' : 'info';
        const actionText = isEditing ? 'Оновлено дані активу' : 'Додано новий актив';
        const currentActor = session?.user?.name || session?.user?.email || 'Система';
        const auditLog = {
          id: `log-${Date.now()}`,
          time: timeStr,
          type: logType,
          actor: currentActor, 
          source: 'ASSETS',
          text: `${actionText}: "${dataToSend.name}" [Категорія: ${dataToSend.category}]`
        };
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditLog),
        });
        cancelEdit();
        fetchAssets();
      } else {
        const errData = await res.json();
        alert(`Помилка збереження: ${errData.error || 'Щось пішло не так'}`);
      }
    } catch (error) {
      console.error('Помилка відправки форми', error);
      alert('Мережева помилка при збереженні форми.');
    }
  };
  const safeAssets = Array.isArray(assets) ? assets : [];
  const filteredAssets = safeAssets.filter((asset) => {
    const matchesSearch = 
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase()); 
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-gradient tracking-tight">Каталог ІТ-активів</h1>
          <p className="text-muted-foreground mt-2 font-light">Централізований реєстр обладнання</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => { setIsEditing(false); setIsFormModalOpen(true); }}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Додати актив</span>
          </button>
        )}
      </div>
      {isFormModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-2xl relative m-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Plus size={20} className={isEditing ? "text-amber-400" : "text-primary"} />
                {isEditing ? 'Редагувати актив' : 'Новий актив'}
              </h2>
              <button onClick={cancelEdit} className="text-gray-400 hover:text-white transition-colors p-1 bg-white/5 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400">Назва обладнання</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Статус</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                  <option value="active">Активний</option>
                  <option value="maintenance">В ремонті</option>
                  <option value="retired">Списаний</option>
                  <option value="missing">Втрачений</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400">Категорія</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                  <option>Ноутбук</option>
                  <option>Монітор</option>
                  <option>Сервер</option>
                  <option>Принтер</option>
                  <option>Мережа</option>
                  <option>Інше</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Бренд</label>
                <input type="text" placeholder="Dell" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Модель</label>
                <input type="text" placeholder="XPS 15" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Серійний номер / S/N</label>
                <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs text-gray-400 flex items-center gap-1"><User size={12} /> Закріплено за</label>
                <select 
                  value={formData.assignedTo} 
                  onChange={e => setFormData({...formData, assignedTo: e.target.value})} 
                  disabled={['retired', 'missing'].includes(formData.status)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all disabled:opacity-50"
                >
                  <option value="">-- На складі --</option>
                  {employees
                    .filter(emp => emp.status !== 'Звільнений')
                    .map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-1"><MapPin size={14} className="text-primary"/> Геолокація</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className="text-[10px] uppercase text-gray-500">Офіс / Будівля</label>
                  <select value={formData.locationOffice} onChange={e => setFormData({...formData, locationOffice: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                    <option value="Головний офіс">Головний офіс</option>
                    <option value="Склад">Склад</option>
                    <option value="Віддалено">Віддалено</option>
                    <option value="Філіал 1">Філіал 1</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] uppercase text-gray-500">Поверх</label>
                  <input type="text" placeholder="3" value={formData.locationFloor} onChange={e => setFormData({...formData, locationFloor: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] uppercase text-gray-500">Кімната</label>
                  <input type="text" placeholder="304" value={formData.locationRoom} onChange={e => setFormData({...formData, locationRoom: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-400">Характеристики</label>
                <input type="text" placeholder="RAM, CPU, тощо" value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-400">Гарантія діє до</label>
                <input type="date" value={formData.warrantyExpires} onChange={e => setFormData({...formData, warrantyExpires: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
              </div>
            </div>
            <button type="submit" className={`w-full font-semibold py-2.5 rounded-lg mt-4 shadow-lg transition-all text-white ${
              isEditing ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20' : 'bg-gradient-to-r from-primary to-blue-600 hover:from-primary/80 hover:to-blue-500 shadow-primary/20'
            }`}>
              {isEditing ? 'Зберегти зміни' : 'Додати в каталог'}
            </button>
          </form>
          </motion.div>
        </div>,
        document.body
      )}
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl w-full">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Пошук за назвою, S/N або співробітником..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all duration-300"
              />
            </div>
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 font-medium shrink-0"
              title="Сканувати QR або штрих-код"
            >
              <QrCode size={18} />
              <span className="hidden sm:inline">Сканувати</span>
            </button>
            <div className="flex gap-4">
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all duration-300"
              >
                <option value="all">Всі категорії</option>
                <option value="Ноутбук">Ноутбук</option>
                <option value="Монітор">Монітор</option>
                <option value="Сервер">Сервер</option>
                <option value="Принтер">Принтер</option>
                <option value="Мережа">Мережа</option>
                <option value="Інше">Інше</option>
              </select>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all duration-300"
              >
                <option value="all">Всі статуси</option>
                <option value="active">Активні</option>
                <option value="maintenance">В ремонті</option>
                <option value="retired">Списані</option>
                <option value="missing">Втрачені</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="text-center text-gray-500 py-10">Завантаження каталогу...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Обладнання</th>
                    <th className="px-4 py-3 font-medium">Модель / S/N</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium">Користувач</th>
                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: index * 0.03 }}
                      key={asset.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-all duration-200 group"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-secondary/50 rounded-xl text-gray-300 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            {getCategoryIcon(asset.category)}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p className="font-medium text-white leading-tight">{asset.name}</p>
                            <p className="text-xs text-gray-500">{asset.category}</p>
                            {asset.warrantyExpires && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-400/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                                Гарантія до {new Date(asset.warrantyExpires).toLocaleDateString('uk-UA')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-gray-300">{asset.brand} {asset.model !== '-' && asset.model}</p>
                        <p className="text-xs text-gray-500 font-mono">{asset.serial_number || 'S/N відсутній'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                          asset.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          asset.status === 'maintenance' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                          asset.status === 'retired' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                          {asset.status === 'active' ? 'Активний' : asset.status === 'maintenance' ? 'В ремонті' : asset.status === 'retired' ? 'Списаний' : 'Втрачений'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {asset.assignedTo ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {asset.assignedTo.charAt(0)}
                              </div>
                              <span className="text-sm text-gray-300">{asset.assignedTo}</span>
                            </div>
                            {asset.location && (
                              <div className="flex flex-col text-[11px] text-gray-500 pl-8">
                                {(() => {
                                  try {
                                    const loc = JSON.parse(asset.location);
                                    if (loc.office === 'Віддалено') return <span className="flex items-center gap-1"><MapPin size={10} /> Віддалено</span>;
                                    const parts = [];
                                    if (loc.office) parts.push(loc.office);
                                    if (loc.floor) parts.push(`пов. ${loc.floor}`);
                                    if (loc.room) parts.push(`кім. ${loc.room}`);
                                    return <span className="flex items-center gap-1"><MapPin size={10} /> {parts.join(', ')}</span>;
                                  } catch (e) {
                                    return <span className="flex items-center gap-1"><MapPin size={10} /> {asset.location}</span>;
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm text-gray-600 italic">На складі</span>
                            {asset.location && (
                              <div className="flex flex-col text-[11px] text-gray-500">
                                {(() => {
                                  try {
                                    const loc = JSON.parse(asset.location);
                                    const parts = [];
                                    if (loc.office) parts.push(loc.office);
                                    if (loc.floor) parts.push(`пов. ${loc.floor}`);
                                    if (loc.room) parts.push(`кім. ${loc.room}`);
                                    return <span className="flex items-center gap-1"><MapPin size={10} /> {parts.join(', ')}</span>;
                                  } catch (e) {
                                    return <span className="flex items-center gap-1"><MapPin size={10} /> {asset.location}</span>;
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setSelectedQRAsset(asset); setIsQRModalOpen(true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            title="Показати QR-код"
                          >
                            <QrCode size={15} />
                          </button>
                          {canEdit && (
                            <>
                              <button 
                                onClick={() => handleEditClick(asset)}
                                className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                                title="Редагувати"
                              >
                                <Pencil size={15} />
                              </button>
                              <button 
                                onClick={() => handleDelete(asset.id)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                title="Видалити"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredAssets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">
                        {safeAssets.length === 0 
                          ? 'Каталог порожній. Додайте перший актив!' 
                          : 'За вашим запитом нічого не знайдено.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      <QRCodeModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        asset={selectedQRAsset} 
      />
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={(decodedText) => {
          setSearchQuery(decodedText);
        }} 
      />
    </div>
  );
}