"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Loader2, Info } from 'lucide-react';
import { AdminPanel, AdminPanelHeader, AdminDataTable } from '../admin-ui';
import { AdminService } from '@/lib/supabase';
import type { ClassifiedUser } from '@/types';
import { UserDetailDrawer } from '../UserDetailDrawer';
import toast from 'react-hot-toast';

type Category = 'all' | 'payment' | 'trial' | 'walk-in';

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState<Category>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<ClassifiedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getAllUsersClassified();
      setUsers(data);
    } catch (err: unknown) {
      toast.error("Failed to fetch users: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchUsers();
  }, []);

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
            <div className="flex p-1 bg-muted rounded-xl w-full md:w-auto overflow-x-auto custom-scrollbar">
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
                    activeTab === tab.id ? 'bg-white text-icsn-teal shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/70">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, เบอร์, ชื่อเล่นลูก..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-sm bg-muted/50"
                />
              </div>
            </div>
          </div>

          <AdminDataTable
            headers={[
              { label: 'ผู้ปกครอง' },
              { label: 'ชื่อนักเรียน' },
              { label: 'ยอดจองสำเร็จ', align: 'center' },
              { label: 'เครดิตคงเหลือ', align: 'center' },
              { label: 'จัดการ', align: 'center' },
            ]}
          >
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              <>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-icsn-navy">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.phone} • {user.email || '-'}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                        user.category === 'payment' ? 'bg-info/10 text-info' :
                        user.category === 'trial' ? 'bg-warning/10 text-warning' :
                        user.category === 'walk-in' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{user.children_nicknames || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center min-w-[3rem] h-8 rounded-full font-bold text-sm bg-info/10 text-info border border-info/30">
                        {user.total_bookings}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center min-w-[3rem] h-8 rounded-full font-bold text-sm border ${
                        user.total_credits > 0 ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {user.total_credits}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openDrawer(user.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-muted text-icsn-navy border border-border rounded-xl text-sm font-bold shadow-sm transition-colors"
                        >
                          <Info className="w-4 h-4" />
                          ดูรายละเอียด
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </AdminDataTable>
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
