"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Search, Loader2, Edit, X, History } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import {
  AdminPanel,
  AdminPanelHeader,
  AdminFieldLabel,
} from './admin-ui';

interface ParentCreditRow {
  id: string;
  name: string;
  phone: string;
  children_nicknames: string;
  total_credits: number;
}

export function CreditsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [parents, setParents] = useState<ParentCreditRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [selectedParent, setSelectedParent] = useState<ParentCreditRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [creditOffset, setCreditOffset] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  // History Modal State
  const [historyParent, setHistoryParent] = useState<ParentCreditRow | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getAllParentsWithCredits();
      setParents(data);
    } catch (err) {
      alert('Error fetching parents: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const filteredParents = useMemo(() => {
    if (!searchTerm.trim()) return parents;
    const lower = searchTerm.toLowerCase();
    return parents.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.phone.includes(lower) || 
      p.children_nicknames.toLowerCase().includes(lower)
    );
  }, [parents, searchTerm]);

  const openEditModal = (parent: ParentCreditRow) => {
    setSelectedParent(parent);
    setEditName(parent.name);
    setEditPhone(parent.phone);
    setCreditOffset('');
    setReason('');
  };

  const closeEditModal = () => {
    setSelectedParent(null);
  };

  const openHistoryModal = async (parent: ParentCreditRow) => {
    setHistoryParent(parent);
    setLoadingHistory(true);
    try {
      const logs = await AdminService.getCreditLogs(parent.id);
      setHistoryLogs(logs);
    } catch (err) {
      alert('Error fetching history: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeHistoryModal = () => {
    setHistoryParent(null);
    setHistoryLogs([]);
  };

  const handleSave = async () => {
    if (!selectedParent) return;

    const numOffset = typeof creditOffset === 'number' ? creditOffset : 0;
    if (numOffset !== 0 && !reason.trim()) {
      alert('กรุณาระบุเหตุผลในการปรับเครดิต');
      return;
    }

    if (!editName.trim() || !editPhone.trim()) {
      alert('กรุณาระบุชื่อและเบอร์โทรศัพท์ให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      const nameChanged = editName.trim() !== selectedParent.name;
      const phoneChanged = editPhone.trim() !== selectedParent.phone;
      
      let finalTotal = selectedParent.total_credits;

      // 1. Update Profile if changed
      if (nameChanged || phoneChanged) {
        await AdminService.adminEditUser('parents', selectedParent.id, {
          name: editName.trim(),
          phone: editPhone.trim()
        });
      }

      // 2. Adjust Credits if offset != 0
      if (numOffset !== 0) {
        finalTotal = await AdminService.adjustCredits(selectedParent.id, numOffset, reason.trim());
      }
      
      // Update local state instantly
      setParents(curr => curr.map(p => 
        p.id === selectedParent.id 
          ? { ...p, name: editName.trim(), phone: editPhone.trim(), total_credits: finalTotal } 
          : p
      ));
      
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      closeEditModal();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPanel className="no-print">
      <AdminPanelHeader
        icon={Ticket}
        title="จัดการสิทธิ์เข้าเรียน (Manage Credits & Profiles)"
      />

      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-4 border border-gray-200 rounded shadow-sm flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <AdminFieldLabel>ค้นหาข้อมูลผู้ปกครอง (ชื่อ, เบอร์โทร, ชื่อเล่นน้อง):</AdminFieldLabel>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="พิมพ์ค้นหาแบบ Real-time..."
                className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded h-10 bg-white focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-gray-300 shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                <th className="border border-gray-300 px-3 py-2">ชื่อผู้ปกครอง</th>
                <th className="border border-gray-300 px-3 py-2">เบอร์โทรศัพท์</th>
                <th className="border border-gray-300 px-3 py-2">ชื่อนักเรียน</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-28">สิทธิ์คงเหลือ</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-40">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredParents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    ไม่พบข้อมูลผู้ปกครอง
                  </td>
                </tr>
              ) : (
                filteredParents.map((parent) => (
                  <tr key={parent.id} className="hover:bg-blue-50/50 transition">
                    <td className="border border-gray-300 px-3 py-1.5 font-bold text-gray-900">{parent.name}</td>
                    <td className="border border-gray-300 px-3 py-1.5 font-mono text-gray-700">{parent.phone}</td>
                    <td className="border border-gray-300 px-3 py-1.5 text-gray-700">{parent.children_nicknames || '-'}</td>
                    <td className="border border-gray-300 px-3 py-1.5 text-center">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 font-bold text-gray-800 border border-gray-300 rounded min-w-[2.5rem]">
                        {parent.total_credits}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openHistoryModal(parent)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-300 rounded shadow-sm text-xs transition"
                          title="ดูประวัติการใช้/เติมเครดิต"
                        >
                          <History className="w-3.5 h-3.5" /> ประวัติ
                        </button>
                        <button
                          onClick={() => openEditModal(parent)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-300 rounded shadow-sm text-xs transition"
                          title="แก้ไขข้อมูลและสิทธิ์"
                        >
                          <Edit className="w-3.5 h-3.5" /> แก้ไข
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Edit Modal */}
      {selectedParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded shadow-xl w-full max-w-md border border-gray-300 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">แก้ไขข้อมูล & สิทธิ์เข้าเรียน</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อผู้ปกครอง</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 my-2 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-900">ปรับเพิ่ม/ลด เครดิต (Current: {selectedParent.total_credits})</label>
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={creditOffset}
                    onChange={e => setCreditOffset(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="เช่น 5, -1"
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-mono text-center"
                  />
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="เหตุผล (จำเป็นเมื่อมีการปรับ)"
                    disabled={creditOffset === 0 || creditOffset === ''}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-300 bg-gray-50 justify-end">
              <button
                onClick={closeEditModal}
                disabled={saving}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-50 transition text-sm disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded shadow-xl w-full max-w-2xl border border-gray-300 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50 sticky top-0">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600" />
                ประวัติเครดิต: {historyParent.name}
              </h3>
              <button onClick={closeHistoryModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white whitespace-nowrap">
                <thead className="sticky top-0 bg-gray-100 shadow-sm z-10">
                  <tr className="text-gray-700 font-bold border-b border-gray-300">
                    <th className="border-r border-gray-300 px-3 py-2 w-32">วันที่-เวลา</th>
                    <th className="border-r border-gray-300 px-3 py-2 w-24">ประเภท</th>
                    <th className="border-r border-gray-300 px-3 py-2 w-20 text-center">จำนวน</th>
                    <th className="px-3 py-2">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        กำลังโหลด...
                      </td>
                    </tr>
                  ) : historyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-gray-500 bg-gray-50">
                        ยังไม่มีประวัติเครดิต
                      </td>
                    </tr>
                  ) : (
                    historyLogs.map(log => {
                      const isAdd = log.action_type === 'add' || log.action_type === 'package' || log.amount > 0;
                      return (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="border-r border-gray-100 px-3 py-2 text-gray-500 font-mono text-xs">
                            {new Date(log.created_at).toLocaleString('th-TH')}
                          </td>
                          <td className="border-r border-gray-100 px-3 py-2 font-bold capitalize text-gray-700">
                            {log.action_type}
                          </td>
                          <td className="border-r border-gray-100 px-3 py-2 text-center font-bold">
                            <span className={isAdd ? 'text-emerald-600' : 'text-rose-600'}>
                              {isAdd ? '+' : ''}{log.amount}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-normal min-w-[200px]">
                            {log.notes || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-300 bg-gray-50 flex justify-end">
              <button
                onClick={closeHistoryModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-50 transition text-sm"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}
