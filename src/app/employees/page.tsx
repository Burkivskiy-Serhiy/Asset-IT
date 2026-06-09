'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Mail, Briefcase,
  Trash2, Pencil, Eye, Laptop, Monitor, 
  Mouse, Smartphone, Tag
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AssignedAsset {
  id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serial_number?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  status: string;
  assets: AssignedAsset[];
}

const INITIAL_FORM_DATA = {
  firstName: '', 
  lastName: '', 
  email: '', 
  position: '', 
  department: '', 
  status: 'Активний'
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        
        const formattedEmployees = data.map((emp: any) => {
          const [firstName, ...lastNameParts] = (emp.name || '').split(' ');
          return {
            id: emp.id.toString(),
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            email: emp.email,
            position: emp.role,
            department: emp.dept,
            status: emp.status === 'active' ? 'Активний' : emp.status,
            assets: emp.assetsList || [] 
          };
        });
        
        setEmployees(formattedEmployees);
      }
    } catch (error) {
      console.error('Помилка завантаження співробітників:', error);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormData(INITIAL_FORM_DATA); 
    setIsEditMode(false); 
    setEditingId(null); 
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setFormData({ 
      firstName: emp.firstName, 
      lastName: emp.lastName, 
      email: emp.email, 
      position: emp.position, 
      department: emp.department, 
      status: emp.status 
    });
    setIsEditMode(true); 
    setEditingId(emp.id); 
    setIsFormModalOpen(true);
  };

  const handleOpenProfile = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsProfileOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    
    if (isEditMode && editingId) {
      const dbPayload = {
        id: editingId,
        name: fullName,
        role: formData.position,
        dept: formData.department,
        email: formData.email,
        status: formData.status
      };

      try {
        const res = await fetch('/api/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbPayload)
        });

        if (res.ok) {
          await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: `log-${Date.now()}`,
              time: timeStr,
              type: 'warning',
              source: 'EMPLOYEES',
              text: `Оновлено дані співробітника: "${fullName}" [Посада: ${formData.position}]`
            }),
          });

          await fetchEmployees();
          setIsFormModalOpen(false);
        } else {
          const errData = await res.json();
          alert(`Помилка: ${errData.error || 'Не вдалося оновити запис у БД'}`);
        }
      } catch (error) {
        console.error('Помилка при відправці форми:', error);
      }
    } else {
      const dbPayload = {
        name: fullName,
        role: formData.position,
        dept: formData.department,
        email: formData.email,
        status: formData.status === 'Активний' ? 'active' : formData.status,
        dateJoined: new Date().toISOString().split('T')[0] 
      };

      try {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbPayload)
        });

        if (res.ok) {
          await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: `log-${Date.now()}`,
              time: timeStr,
              type: 'info',
              source: 'EMPLOYEES',
              text: `Додано нового співробітника: "${fullName}" [Відділ: ${formData.department}]`
            }),
          });

          await fetchEmployees();
          setIsFormModalOpen(false);
        } else {
          const errData = await res.json();
          alert(`Помилка: ${errData.error || 'Не вдалося зберегти в БД'}`);
        }
      } catch (error) {
        console.error('Помилка при відправці форми:', error);
      }
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Ви впевнені, що хочете видалити цього співробітника? Автоматично закріплені активи повернуться на склад.')) {
      
      const empToDelete = employees.find(e => e.id === id);

      try {
        const res = await fetch(`/api/employees?id=${id}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          if (empToDelete) {
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];
            
            await fetch('/api/logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: `log-${Date.now()}`,
                time: timeStr,
                type: 'error',
                source: 'EMPLOYEES',
                text: `Видалено профіль співробітника: "${empToDelete.firstName} ${empToDelete.lastName}"`
              }),
            });
          }

          setEmployees(employees.filter(emp => emp.id !== id));
        } else {
          alert('Не вдалося видалити співробітника з бази даних.');
        }
      } catch (error) {
        console.error('Помилка при видаленні:', error);
      }
    }
  };

  const getAssetIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('laptop') || cat.includes('ноутбук') || cat.includes('комп')) return <Laptop size={16} className="text-blue-400" />;
    if (cat.includes('monitor') || cat.includes('монітор')) return <Monitor size={16} className="text-indigo-400" />;
    if (cat.includes('phone') || cat.includes('телефон') || cat.includes('смартфон')) return <Smartphone size={16} className="text-emerald-400" />;
    if (cat.includes('mouse') || cat.includes('keyboard') || cat.includes('перифер')) return <Mouse size={16} className="text-amber-400" />;
    return <Tag size={16} className="text-gray-400" />;
  };

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto">
      {/* Шапка */}
      <header className="border-b border-border pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sticky top-0 bg-background/80 backdrop-blur-xl z-20 pt-4 -mt-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-1 flex items-center gap-3">
            <Users size={28} className="text-blue-400" /> Співробітники
          </h1>
          <p className="text-muted-foreground text-sm font-light">Управління персоналом та закріпленими за ними активами (Neon DB).</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white transition-all duration-300">
          <Plus size={16} /> Додати співробітника
        </Button>
      </header>

      {/* МОДАЛКА: Створення / Редагування */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Редагувати дані' : 'Новий співробітник'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Ім'я</label>
                <Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="bg-secondary/50 border-border text-foreground" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Прізвище</label>
                <Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="bg-secondary/50 border-border text-foreground" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase">Email</label>
              <Input type="text" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-secondary/50 border-border text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Посада</label>
                <Input required value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="bg-secondary/50 border-border text-foreground" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Відділ</label>
                <Input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="bg-secondary/50 border-border text-foreground" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase">Статус</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="h-10 rounded-md bg-secondary/50 border border-border px-3 text-sm text-foreground">
                <option value="Активний">Активний</option>
                <option value="Вiдпустка">Вiдпустка</option>
                <option value="Звільнений">Звільнений</option>
              </select>
            </div>
            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)} className="border-border text-foreground hover:bg-secondary">Скасувати</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">{isEditMode ? 'Зберегти' : 'Додати'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* МОДАЛКА: Профіль співробітника та Активи */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[550px] bg-card border-border text-foreground p-0 overflow-hidden">
          <DialogTitle className="sr-only">Профіль співробітника</DialogTitle>
          
          {selectedEmployee && (
            <>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-border flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center text-xl font-bold text-primary shadow-lg">
                  {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                  <p className="text-blue-300 font-medium">{selectedEmployee.position} • {selectedEmployee.department}</p>
                </div>
              </div>
              
              <div className="p-6 pt-4 flex flex-col gap-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Видана техніка ({selectedEmployee.assets.length})</h3>
                  {selectedEmployee.assets.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {selectedEmployee.assets.map(asset => (
                        <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-white/5 border border-white/5">
                              {getAssetIcon(asset.category)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-200">{asset.name}</div>
                              <div className="text-xs font-mono text-gray-500 mt-0.5">{asset.serial_number || 'С/Н відсутній'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-lg bg-white/[0.01]">
                      <Laptop className="mx-auto text-gray-600 mb-2 opacity-50" size={24} />
                      <p className="text-sm text-gray-400">За співробітником ще не закріплено жодного активу.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Панель пошуку */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Пошук за ім'ям чи посадою..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-secondary/50 border-border text-foreground" />
        </div>
      </div>

      {/* Таблиця */}
      <Card className="bg-card border border-border overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-secondary/30 text-gray-500 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Співробітник</th>
                <th scope="col" className="px-6 py-4 font-medium">Посада / Відділ</th>
                <th scope="col" className="px-6 py-4 font-medium">Активи</th>
                <th scope="col" className="px-6 py-4 font-medium">Статус</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                    Співробітників не знайдено або база даних порожня.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-secondary/20 transition-colors group cursor-pointer" onDoubleClick={() => handleOpenProfile(emp)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-primary">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={12} /> {emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-300 flex items-center gap-1.5"><Briefcase size={14} className="text-gray-500" /> {emp.position}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{emp.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/5 text-gray-300 border border-white/10">
                        <Laptop size={12} className={emp.assets.length > 0 ? "text-blue-400" : "text-gray-500"} /> 
                        {emp.assets.length} од.
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                        emp.status === 'Активний' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        emp.status === 'Звільнений' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenProfile(emp); }} className="text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10" title="Профіль">
                          <Eye size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenEdit(emp); }} className="text-gray-500 hover:text-blue-400 hover:bg-blue-500/10" title="Редагувати">
                          <Pencil size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id); }} className="text-gray-500 hover:text-red-400 hover:bg-red-500/10" title="Видалити">
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}