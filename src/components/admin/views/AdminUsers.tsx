"use client";

import React from 'react';
import { Users } from 'lucide-react';
import { AdminPanel, AdminPanelHeader, AdminTabs, AdminSearch, AdminPagination } from '../admin-ui';
import { UserDetailDrawer } from '../UserDetailDrawer';
import { useAdminUsers, Category } from './users/useAdminUsers';
import { UserTable } from './users/UserTable';

export function AdminUsers() {
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    loading,
    filteredUsers,
    paginatedUsers,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    drawerOpen,
    setDrawerOpen,
    selectedParentId,
    openDrawer
  } = useAdminUsers();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={Users} title="จัดการผู้ใช้งาน (Users & Credits)" />

        <div className="p-6 space-y-6">
          
          {/* Top Controls: Search & Tabs */}
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4 w-full min-w-0">
            
            {/* Segmented Control */}
            <AdminTabs
              tabs={[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'payment', label: 'สมาชิกปกติ (Payment)' },
                { id: 'trial', label: 'ทดลองเรียน (Trial)' },
                { id: 'registered', label: 'ลงทะเบียนใหม่ (ยังไม่มีแพ็กเกจ)' },
                { id: 'walk-in', label: 'Walk-in (ลูกค้าหน้างาน)' }
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as Category)}
            />

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <AdminSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="ค้นหาชื่อ, เบอร์, ชื่อเล่นลูก..."
                className="w-full sm:w-64"
              />
            </div>
          </div>

          <UserTable
            loading={loading}
            users={paginatedUsers}
            openDrawer={openDrawer}
          />

          {/* Pagination Controls */}
          {!loading && filteredUsers.length > 0 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
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
