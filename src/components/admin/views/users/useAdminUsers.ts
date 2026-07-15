import { useState, useEffect, useMemo } from 'react';
import { AdminService } from '@/lib/supabase';
import type { ClassifiedUser } from '@/types';
import toast from 'react-hot-toast';

export type Category = 'all' | 'payment' | 'trial' | 'registered' | 'walk-in';

export function useAdminUsers() {
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
    fetchUsers();
  }, []);

  const stats = useMemo(() => ({
    total: users.length,
    payment: users.filter(u => u.category === 'payment').length,
    trial: users.filter(u => u.category === 'trial').length,
    registered: users.filter(u => u.category === 'registered').length,
    walkin: users.filter(u => u.category === 'walk-in').length,
  }), [users]);

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

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    loading,
    stats,
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
  };
}
