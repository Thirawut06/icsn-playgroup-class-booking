"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Loader2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminPanel, AdminPanelHeader, AdminDataTable, AdminTabs } from '../admin-ui';
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            <AdminTabs
              tabs={[
                { id: 'all', label: 'ทั้งหมด (All)' },
                { id: 'payment', label: 'สมาชิกปกติ (Payment)' },
                { id: 'trial', label: 'ทดลองเรียน (Trial)' },
                { id: 'walk-in', label: 'Walk-in (ไม่มีแพ็กเกจ)' }
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as Category)}
            />

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
              { label: 'ชื่อนักเรียน' },
              { label: 'ผู้ปกครอง' },
              { label: 'อีเมล' },
              { label: 'จองสำเร็จ', align: 'center' },
              { label: 'เครดิต', align: 'center' },
              { label: 'จัดการ', align: 'center' },
            ]}
          >
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              <>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      {user.children_list && user.children_list.length > 0 ? (
                        <div className="space-y-1">
                          {user.children_list.map((child, idx) => (
                            <p key={idx} className="font-semibold text-foreground text-sm">
                              {child.full_name || '-'} <span className="font-normal text-muted-foreground">({child.nickname})</span>
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="font-medium text-muted-foreground text-sm">-</p>
                      )}
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                        user.category === 'payment' ? 'bg-info/10 text-info' :
                        user.category === 'trial' ? 'bg-warning/10 text-warning' :
                        user.category === 'walk-in' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground/80 text-sm">{user.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{user.phone}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {user.email || '-'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center justify-center min-w-[2.5rem] h-7 rounded-full font-semibold text-sm bg-info/10 text-info border border-info/30">
                        {user.total_bookings}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={`inline-flex items-center justify-center min-w-[2.5rem] h-7 rounded-full font-semibold text-sm border ${
                        user.total_credits > 0 ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {user.total_credits}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openDrawer(user.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted text-icsn-navy border border-border rounded-lg text-sm font-medium transition-colors"
                        >
                          <Info className="w-4 h-4 text-muted-foreground" />
                          ดูรายละเอียด
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </AdminDataTable>

          {/* Pagination Controls */}
          {!loading && filteredUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                แสดงผล <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> ถึง <span className="font-bold text-foreground">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> จากทั้งหมด <span className="font-bold text-foreground">{filteredUsers.length}</span> รายการ
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    // Show current, first, last, and pages around current
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                            currentPage === pageNum ? 'bg-icsn-teal text-white' : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="text-muted-foreground">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
