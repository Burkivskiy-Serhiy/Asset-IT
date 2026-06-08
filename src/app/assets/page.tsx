'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Database, Laptop, Server, Monitor, Printer, Network, Pencil, Trash2, X, Search, User } from 'lucide-react';
import { useSession } from 'next-auth/react';

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

  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    category: 'Ноутбук',
    brand: '',
    model: '',
    serial_number: '',
    specs: '',
    assignedTo: '' 
  });

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
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
    setEditId(asset.id);
    setFormData({
      name: asset.name,
      status: asset.status,
      category: asset.category,
      brand: asset.brand || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      specs: asset.specs || '',
      assignedTo: asset.assignedTo || '' 
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: '', status: 'active', category: 'Ноутбук', brand: '', model: '', serial_number: '', specs: '', assignedTo: '' });
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

      const dataToSend = { ...formData };
      if (['retired', 'missing'].includes(dataToSend.status)) {
        dataToSend.assignedTo = '';
      }

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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Каталог ІТ-активів</h1>
          <p className="text-muted-foreground mt-2">Централізований реєстр обладнання</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ФОРМА */}
        <div className="glass-panel p-6 h-fit sticky top-4 border border-white/5 rounded-xl bg-black/20 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Plus size={20} className={isEditing ? "text-amber-400" : "text-primary"} />
              {isEditing ? 'Редагувати актив' : 'Новий актив'}
            </h2>
            {isEditing && (
              <button onClick={cancelEdit} className="text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Назва</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-primary focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Категорія</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-primary focus:outline-none">
                  <option>Ноутбук</option>
                  <option>Монітор</option>
                  <option>Сервер</option>
                  <option>Принтер</option>
                  <option>Мережа</option>
                  <option>Інше</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Статус</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-primary focus:outline-none">
                  <option value="active">Активний</option>
                  <option value="maintenance">В ремонті</option>
                  <option value="retired">Списаний</option>
                  <option value="missing">Втрачений</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Бренд</label>
                <input type="text" placeholder="Dell" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Модель</label>
                <input type="text" placeholder="XPS 15" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-primary focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Серійний номер / S/N</label>
                <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 flex items-center gap-1"><User size={14} /> Закріплено за</label>
                <select 
                  value={formData.assignedTo} 
                  onChange={e => setFormData({...formData, assignedTo: e.target.value})} 
                  disabled={['retired', 'missing'].includes(formData.status)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-primary focus:outline-none disabled:opacity-50"
                >
                  <option value="">-- На складі --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400">Характеристики</label>
              <textarea rows={2} value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-primary focus:outline-none"></textarea>
            </div>

            <button type="submit" className={`w-full font-medium py-2 rounded-lg mt-2 transition-colors text-white ${
              isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'
            }`}>
              {isEditing ? 'Зберегти зміни' : 'Зберегти в каталог'}
            </button>
          </form>
        </div>

        {/* ТАБЛИЦЯ ТА ПАНЕЛЬ ФІЛЬТРІВ */}
        <div className="lg:col-span-2 glass-panel p-6 border border-white/5 rounded-xl bg-black/20 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Пошук за назвою, S/N або співробітником..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            
            <div className="flex gap-4">
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white focus:border-primary focus:outline-none transition-colors"
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
                className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white focus:border-primary focus:outline-none transition-colors"
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
                  <tr className="border-b border-white/10 text-sm text-gray-400">
                    <th className="pb-3 font-medium">Обладнання</th>
                    <th className="pb-3 font-medium">Модель / S/N</th>
                    <th className="pb-3 font-medium">Статус</th>
                    <th className="pb-3 font-medium">Користувач</th>
                    <th className="pb-3 font-medium text-right">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <motion.tr 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      key={asset.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                            {getCategoryIcon(asset.category)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{asset.name}</p>
                            <p className="text-xs text-gray-500">{asset.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-gray-300">{asset.brand} {asset.model !== '-' && asset.model}</p>
                        <p className="text-xs text-gray-500 font-mono">{asset.serial_number || 'S/N відсутній'}</p>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          asset.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          asset.status === 'maintenance' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                          asset.status === 'retired' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                          {asset.status === 'active' ? 'Активний' : asset.status === 'maintenance' ? 'В ремонті' : asset.status === 'retired' ? 'Списаний' : 'Втрачений'}
                        </span>
                      </td>
                      <td className="py-4">
                        {asset.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                              {asset.assignedTo.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-300">{asset.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600 italic">На складі</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
      </div>
    </div>
  );
}