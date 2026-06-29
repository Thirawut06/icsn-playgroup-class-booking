"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Loader2, Info } from 'lucide-react';
import { AdminPanel, AdminPanelHeader } from '../admin-ui';
import { AdminService } from '@/lib/supabase';
import { UserDetailDrawer } from '../UserDetailDrawer';
import toast from 'react-hot-toast';

type Category = 'all' | 'payment' | 'trial' | 'walk-in';

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState<Category>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getAllUsersClassified();
      setUsers(data);
    } catch (err: any) {
      toast.error("Failed to fetch users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(u => u.category === activeTab);
    }

    // Filter by search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(lower) || 
        u.phone.includes(lower) || 
        u.children_nicknames.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [users, activeTab, searchTerm]);

  const openDrawer = (parentId: string) => {
    setSelectedParentId(parentId);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={Users} title="จัดการผู้ใช้งาน (Users & Credits)" />

        <div className="p-6 space-y-6">
          
          {/* Top Controls: Search & Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Segmented Control */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto overflow-x-auto custom-scrollbar">
              {[
                { id: 'all', label: 'ทั้งหมด (All)' },
                { id: 'payment', label: 'สมาชิกปกติ (Payment)' },
                { id: 'trial', label: 'ทดลองเรียน (Trial)' },
                { id: 'walk-in', label: 'Walk-in (ไม่มีแพ็กเกจ)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Category)}
                  className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm transition ${
                    activeTab === tab.id ? 'bg-white text-icsn-teal shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาชื่อ, เบอร์, ชื่อเล่นลูก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-icsn-teal text-sm bg-gray-50/50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-sm">
                    <th className="px-6 py-4 font-bold text-gray-600">ผู้ปกครอง</th>
                    <th className="px-6 py-4 font-bold text-gray-600">ชื่อนักเรียน</th>
                    <th className="px-6 py-4 font-bold text-gray-600 text-center">เครดิตคงเหลือ</th>
                    <th className="px-6 py-4 font-bold text-gray-600 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.phone} • {user.email || '-'}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                            user.category === 'payment' ? 'bg-blue-100 text-blue-700' :
                            user.category === 'trial' ? 'bg-amber-100 text-amber-700' :
                            user.category === 'walk-in' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.category.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{user.children_nicknames || '-'}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center justify-center min-w-[3rem] h-8 rounded-full font-bold text-sm ${
                            user.total_credits > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.total_credits}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openDrawer(user.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Info className="w-4 h-4" />
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminPanel>

      <UserDetailDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        parentId={selectedParentId} 
      />
    </div>
  );
}
