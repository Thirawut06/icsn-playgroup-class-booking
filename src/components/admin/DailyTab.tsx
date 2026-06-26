"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Printer, Users, XCircle } from 'lucide-react';
import { AppDB, invokeAdminAction } from '@/lib/supabase';
import type { DailyAttendanceRow, Session } from '@/types';
import { AdminEmptyState, AdminFieldLabel, AdminPanel, AdminPanelHeader, AdminPrimaryButton } from './admin-ui';
import { formatAgeDisplay, formatThaiFullDate } from './admin-utils';

interface DailyTabProps {
  onRefresh?: () => void;
}

export function DailyTab({ onRefresh }: DailyTabProps) {
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<DailyAttendanceRow[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [walkinFree, setWalkinFree] = useState(false);
  const [walkinLoading, setWalkinLoading] = useState(false);
  const [capacityEdit, setCapacityEdit] = useState('');
  const [savingCapacity, setSavingCapacity] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, sess] = await Promise.all([
        AppDB.getDailyAttendance(dailyDate),
        AppDB.getSessionForDate(dailyDate),
      ]);
      setAttendance(rows);
      setSession(sess);
      setCapacityEdit(sess ? String(sess.total_capacity) : '15');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dailyDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinPhone || !walkinName) return;
    setWalkinLoading(true);
    try {
      const sess = await AppDB.getOrCreateSession(dailyDate);
      const { child_id } = await AppDB.adminAddWalkin(walkinPhone, walkinName);
      await AppDB.adminBookClass(child_id, sess.id, walkinFree);
      setWalkinPhone('');
      setWalkinName('');
      await loadData();
      onRefresh?.();
      alert('เธเธฑเธเธ—เธถเธ Walk-in เธชเธณเน€เธฃเนเธ!');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setWalkinLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('เน€เธซเธ•เธธเธเธฅเนเธเธเธฒเธฃเธขเธเน€เธฅเธดเธ (เธเธณเน€เธเนเธ):', 'Admin cancelled from daily tab');
    if (!reason?.trim()) return;
    if (!confirm('เนเธเนเนเธเธซเธฃเธทเธญเนเธกเนเธงเนเธฒเธ•เนเธญเธเธเธฒเธฃเธขเธเน€เธฅเธดเธเธเธฒเธฃเธเธญเธเธเธตเน? (เธฃเธฐเธเธเธเธฐเธเธทเธเน€เธเธฃเธ”เธดเธ•เนเธซเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด)')) return;
    try {
      await invokeAdminAction('cancel-booking', { bookingId, cancelReason: reason.trim() });
      await loadData();
      onRefresh?.();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSaveCapacity = async () => {
    if (!session) {
      alert('เธขเธฑเธเนเธกเนเธกเธต session เธชเธณเธซเธฃเธฑเธเธงเธฑเธเธเธตเน โ€” เธชเธฃเนเธฒเธเน€เธกเธทเนเธญเธกเธตเธเธฒเธฃเธเธญเธเธซเธฃเธทเธญ walk-in');
      return;
    }
    const cap = parseInt(capacityEdit, 10);
    if (!cap || cap < 1) {
      alert('เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธณเธเธงเธเธ—เธตเนเธเธฑเนเธเธ—เธตเนเธ–เธนเธเธ•เนเธญเธ');
      return;
    }
    setSavingCapacity(true);
    try {
      const updated = await AppDB.updateSessionCapacity(session.id, cap);
      setSession(updated);
      alert('เธญเธฑเธเน€เธ”เธ•เธเธณเธเธงเธเธ—เธตเนเธเธฑเนเธเธชเธณเน€เธฃเนเธ');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingCapacity(false);
    }
  };

  const bookedCount = session?.booked_count ?? attendance.length;
  const totalCapacity = session?.total_capacity ?? (parseInt(capacityEdit, 10) || 15);

  return (
    <div className="space-y-6">
      <AdminPanel className="no-print">
        <AdminPanelHeader
          icon={CalendarDays}
          title="เธ•เธฒเธฃเธฒเธเธเธฒเธเน€เธเนเธฒเน€เธฃเธตเธขเธเธฃเธฒเธขเธงเธฑเธ (Daily Schedule List)"
        />

        <div className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between bg-gray-50 p-6 rounded-2xl border border-gray-200">
          <div className="flex-1">
            <AdminFieldLabel>เน€เธฅเธทเธญเธเธงเธฑเธเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเธชเธ–เธดเธ•เธด:</AdminFieldLabel>
            <input
              type="date"
              value={dailyDate}
              onChange={e => setDailyDate(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-icsn-teal focus:outline-none bg-white text-sm text-gray-700 h-12"
            />
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm font-bold py-3 px-6 rounded-xl transition shadow-sm h-12 cursor-pointer"
          >
            <Printer className="w-5 h-5 text-emerald-600" />
            <span>เธเธดเธกเธเนเนเธเน€เธเนเธเธเธทเนเธญ (Print Checklist)</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-between">
          <div>
            <span className="block text-sm text-emerald-800 font-bold uppercase">
              เธเธณเธเธงเธเธเธฑเธเน€เธฃเธตเธขเธเธ—เธตเนเธฅเธเธ—เธฐเน€เธเธตเธขเธเนเธเธงเธฑเธเธเธตเน:
            </span>
            <span className="block text-2xl font-black text-emerald-700 mt-1">
              {bookedCount} / {totalCapacity} เธเธ
            </span>
          </div>
          <div className="w-12 h-12 bg-icsn-teal text-white rounded-full flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
          <div>
            <AdminFieldLabel>เนเธเนเนเธเธ—เธตเนเธเธฑเนเธ (Capacity)</AdminFieldLabel>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={capacityEdit}
                onChange={e => setCapacityEdit(e.target.value)}
                className="border border-gray-200 px-4 py-3 rounded-xl text-sm w-24 h-12 bg-white font-bold"
              />
              <AdminPrimaryButton onClick={handleSaveCapacity} disabled={savingCapacity}>
                {savingCapacity ? '...' : 'เธเธฑเธเธ—เธถเธ'}
              </AdminPrimaryButton>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleWalkin}
          className="p-6 bg-teal-50/50 border border-teal-100 rounded-2xl flex flex-wrap items-end gap-4"
        >
          <div>
            <AdminFieldLabel>เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน / Phone</AdminFieldLabel>
            <input
              type="text"
              required
              value={walkinPhone}
              onChange={e => setWalkinPhone(e.target.value)}
              placeholder="08XXXXXXXX"
              className="border border-gray-200 px-4 py-3 rounded-xl text-sm w-44 h-12 bg-white"
            />
          </div>
          <div>
            <AdminFieldLabel>เธเธทเนเธญเน€เธฅเนเธเธเนเธญเธ / Nickname</AdminFieldLabel>
            <input
              type="text"
              required
              value={walkinName}
              onChange={e => setWalkinName(e.target.value)}
              placeholder="เธเธทเนเธญเน€เธฅเนเธ"
              className="border border-gray-200 px-4 py-3 rounded-xl text-sm w-44 h-12 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 pb-3">
            <input
              type="checkbox"
              id="walkinFree"
              checked={walkinFree}
              onChange={e => setWalkinFree(e.target.checked)}
              className="rounded border-gray-300 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="walkinFree" className="text-sm font-semibold text-gray-700 cursor-pointer">
              เนเธซเนเน€เธเนเธฒเธเธฃเธต (เนเธกเนเธซเธฑเธเน€เธเธฃเธ”เธดเธ•)
            </label>
          </div>
          <button
            type="submit"
            disabled={walkinLoading}
            className="bg-icsn-navy hover:bg-[#1a1040] text-white px-6 py-3 rounded-xl text-sm font-bold h-12 cursor-pointer disabled:opacity-50"
          >
            {walkinLoading ? 'เธเธณเธฅเธฑเธเธเธฑเธเธ—เธถเธ...' : '+ เน€เธเธดเนเธก Walk-in'}
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-500 py-10 text-base font-medium">เธเธณเธฅเธฑเธเนเธซเธฅเธ”...</p>
        ) : attendance.length === 0 ? (
          <AdminEmptyState message="เนเธกเนเธกเธตเธเธดเธเธเธฃเธฃเธกเธเธญเธเธชเธดเธ—เธเธดเนเน€เธเนเธฒเน€เธฃเธตเธขเธเนเธเธงเธฑเธเธเธตเน" />
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
            <table className="w-full text-left text-sm border-collapse bg-white">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-bold">
                  <th className="p-4">Nickname (เธเธทเนเธญเน€เธฅเนเธ)</th>
                  <th className="p-4">Age (เธญเธฒเธขเธธ)</th>
                  <th className="p-4">Allergies (เนเธเนเธญเธฒเธซเธฒเธฃ)</th>
                  <th className="p-4">Parent / Contact (เธเธนเนเธเธเธเธฃเธญเธ)</th>
                  <th className="p-4 text-center print:hidden">เธเธฑเธ”เธเธฒเธฃ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-bold text-gray-900 text-base">{row.nickname}</td>
                    <td className="p-4 text-gray-700">{formatAgeDisplay(row.age)}</td>
                    <td className="p-4">
                      {row.food_allergy ? (
                        <span className="inline-flex px-3 py-1 bg-red-100 text-red-700 rounded-lg font-bold text-xs border border-red-200 uppercase">
                          {row.food_allergy}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800 text-sm">{row.parent_name}</p>
                      <p className="text-gray-500 font-mono text-sm mt-0.5">{row.parent_phone}</p>
                    </td>
                    <td className="p-4 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleCancel(row.id)}
                        className="text-rose-500 hover:text-white hover:bg-rose-500 p-2.5 rounded-xl transition cursor-pointer"
                        title="เธขเธเน€เธฅเธดเธเธเธฒเธฃเธเธญเธ"
                        aria-label="เธขเธเน€เธฅเธดเธเธเธฒเธฃเธเธญเธ"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <div id="print-area" className="hidden print:block p-10 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">ICSN Panda Playgroup Play & Learn</h1>
          <h2 className="text-md font-bold text-gray-700">เนเธเธ•เธฃเธงเธเธชเธญเธเธฃเธฒเธขเธเธทเนเธญเธเธฑเธเน€เธฃเธตเธขเธเน€เธเนเธเธญเธดเธเธซเนเธญเธเธเธดเธเธเธฃเธฃเธก</h2>
          <h3 className="text-sm font-semibold text-emerald-600">
            เธเธฃเธฐเธเธณเธฃเธญเธเธงเธฑเธเธ—เธตเน: {formatThaiFullDate(dailyDate)} (เธเธณเธเธงเธเธ—เธฑเนเธเธซเธกเธ” {bookedCount} / {totalCapacity} เธเธ)
          </h3>
        </div>

        <table className="w-full border-collapse border border-gray-900 text-left text-xs">
          <thead>
            <tr className="bg-gray-100 border border-gray-900 text-gray-800 font-bold">
              <th className="border border-gray-900 p-2 w-12 text-center">No. (เธฅเธณเธ”เธฑเธ)</th>
              <th className="border border-gray-900 p-2">Nickname (เธเธทเนเธญเน€เธฅเนเธ)</th>
              <th className="border border-gray-900 p-2 w-16">Age (เธญเธฒเธขเธธ)</th>
              <th className="border border-gray-900 p-2">Allergies (เธเธฃเธฐเธงเธฑเธ•เธดเนเธเนเธญเธฒเธซเธฒเธฃ)</th>
              <th className="border border-gray-900 p-2">Parent / Contact (เธเธนเนเธเธเธเธฃเธญเธ)</th>
              <th className="border border-gray-900 p-2 w-28 text-center">Signature (เธฅเธฒเธขเน€เธเนเธ)</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-900 p-4 text-center text-gray-400">
                  เนเธกเนเธกเธตเธเธดเธเธเธฃเธฃเธกเธเธญเธเนเธเธงเธฑเธเธเธตเน
                </td>
              </tr>
            ) : (
              attendance.map((row, idx) => (
                <tr key={row.id} className="border border-gray-900">
                  <td className="border border-gray-900 p-2 text-center font-bold">{idx + 1}</td>
                  <td className="border border-gray-900 p-2 font-bold">{row.nickname}</td>
                  <td className="border border-gray-900 p-2">{formatAgeDisplay(row.age)}</td>
                  <td className="border border-gray-900 p-2">
                    {row.food_allergy ? (
                      <span className="font-bold text-red-600 border border-red-500 rounded px-1 text-xs">
                        {row.food_allergy}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="border border-gray-900 p-2 text-xs">
                    <span className="font-bold text-gray-900">{row.parent_name}</span>
                    {' '}
                    (<span>{row.parent_phone}</span>)
                  </td>
                  <td className="border border-gray-900 p-2 text-center text-gray-300 font-mono">
                    [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pt-10 flex justify-between text-xs font-bold text-gray-600">
          <p>
            เธเธดเธกเธเนเธฃเธฒเธขเธเธฒเธเน€เธกเธทเนเธญ:{' '}
            {new Date().toLocaleString('th-TH')}
          </p>
          <p>เธฅเธเธเธทเนเธญเธเธธเธ“เธเธฃเธนเธเธนเนเธ”เธนเนเธฅ: _______________________</p>
        </div>
      </div>
    </div>
  );
}

