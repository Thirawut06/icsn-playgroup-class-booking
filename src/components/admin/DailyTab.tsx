"use client";

import React from 'react';
import { CalendarDays, Printer, Users, XCircle, Power } from 'lucide-react';
import { AdminEmptyState, AdminFieldLabel, AdminPanel, AdminPanelHeader, AdminPrimaryButton } from './admin-ui';
import { formatAgeDisplay, formatThaiFullDate } from './admin-utils';
import { useDailyAttendance } from '@/hooks/useDailyAttendance';

interface DailyTabProps {
  onRefresh?: () => void;
}

export function DailyTab({ onRefresh }: DailyTabProps) {
  const {
    dailyDate,
    setDailyDate,
    attendance,
    loading,
    walkinPhone,
    setWalkinPhone,
    walkinName,
    setWalkinName,
    walkinFree,
    setWalkinFree,
    walkinLoading,
    capacityEdit,
    setCapacityEdit,
    savingCapacity,
    bookedCount,
    totalCapacity,
    sessionIsActive,
    togglingSession,
    handleWalkin,
    handleCancel,
    handleSaveCapacity,
    handleToggleSession,
  } = useDailyAttendance({ onRefresh });

  return (
    <div className="space-y-6">
      <AdminPanel className="no-print">
        <AdminPanelHeader
          icon={CalendarDays}
          title="ตารางคาบเข้าเรียนรายวัน (Daily Schedule List)"
        />

        {/* Desktop-optimized Layout for Controls */}
        <div className="bg-white p-5 border border-gray-200 rounded shadow-sm space-y-6">
          
          {/* Section 1: Date & Actions (Inline header style, no card) */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between pb-6 border-b border-gray-100">
            <div className="flex-1 max-w-sm">
              <AdminFieldLabel>เลือกวันที่ต้องการตรวจสอบสถิติ</AdminFieldLabel>
              <input
                type="date"
                value={dailyDate}
                onChange={e => setDailyDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-icsn-teal focus:outline-none bg-gray-50 text-sm text-gray-700 h-10 transition-shadow"
              />
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold py-2 px-5 rounded-lg transition-colors shadow-sm h-10 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>พิมพ์ใบเช็คชื่อ</span>
            </button>
            <button
              type="button"
              onClick={handleToggleSession}
              disabled={togglingSession}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold py-2 px-5 rounded-lg transition-colors shadow-sm h-10 cursor-pointer disabled:opacity-50 border ${
                sessionIsActive
                  ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
                  : 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{sessionIsActive ? 'ปิดคลาสวันนี้' : 'เปิดคลาสวันนี้'}</span>
            </button>
          </div>
          {!sessionIsActive && (
            <div className="bg-rose-50 border border-rose-200 rounded px-4 py-2 text-rose-700 text-sm font-bold">
              ⚠️ คลาสวันนี้ถูกปิดรับจอง — ผู้ปกครองจะไม่สามารถจองวันนี้ได้
            </div>
          )}

          {/* Section 2: Capacity Stats & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stats Highlight Card */}
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="block text-xs text-emerald-800 font-bold uppercase tracking-wider mb-1">
                  จำนวนนักเรียนที่ลงทะเบียนในวันนี้
                </span>
                <span className="block text-2xl font-black text-emerald-600">
                  {bookedCount} <span className="text-emerald-400 font-medium text-lg">/ {totalCapacity} คน</span>
                </span>
              </div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>
            
            {/* Inline Setting (Not a heavy card) */}
            <div className="p-5 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl flex flex-col justify-center">
              <AdminFieldLabel>กำหนดจำนวนที่นั่ง (Capacity)</AdminFieldLabel>
              <div className="flex gap-3">
                <input
                  type="number"
                  min={1}
                  value={capacityEdit}
                  onChange={e => setCapacityEdit(e.target.value)}
                  className="border border-gray-200 px-3 py-2 rounded-lg text-sm w-24 h-10 bg-white font-semibold focus:ring-1 focus:ring-icsn-teal focus:outline-none transition-shadow shadow-sm"
                />
                <button 
                  type="button" 
                  onClick={handleSaveCapacity} 
                  disabled={savingCapacity}
                  className="bg-white border border-gray-200 hover:border-icsn-teal text-icsn-teal px-5 py-2 rounded-lg text-sm font-semibold h-10 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {savingCapacity ? '...' : 'บันทึกการตั้งค่า'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Add Walk-in (Inline form, no outer card) */}
          <form
            onSubmit={handleWalkin}
            className="pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-end gap-4"
          >
            <div className="flex-1">
              <AdminFieldLabel>เบอร์โทรศัพท์ (Phone)</AdminFieldLabel>
              <input
                type="text"
                required
                value={walkinPhone}
                onChange={e => setWalkinPhone(e.target.value)}
                placeholder="08XXXXXXXX"
                className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm h-10 bg-gray-50 focus:ring-1 focus:ring-icsn-teal focus:outline-none transition-shadow"
              />
            </div>
            <div className="flex-1">
              <AdminFieldLabel>ชื่อเล่นน้อง (Nickname)</AdminFieldLabel>
              <input
                type="text"
                required
                value={walkinName}
                onChange={e => setWalkinName(e.target.value)}
                placeholder="กรอกชื่อเล่น..."
                className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm h-10 bg-gray-50 focus:ring-1 focus:ring-icsn-teal focus:outline-none transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2 pb-2.5 px-2">
              <input
                type="checkbox"
                id="walkinFree"
                checked={walkinFree}
                onChange={e => setWalkinFree(e.target.checked)}
                className="rounded border-gray-300 w-4 h-4 text-icsn-teal focus:ring-icsn-teal cursor-pointer"
              />
              <label htmlFor="walkinFree" className="text-sm font-semibold text-gray-700 cursor-pointer whitespace-nowrap">
                เข้าฟรี (Free)
              </label>
            </div>
            <button
              type="submit"
              disabled={walkinLoading}
              className="bg-icsn-navy hover:bg-icsn-navy/90 text-white px-6 py-2 rounded-lg text-sm font-semibold h-10 cursor-pointer disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
            >
              {walkinLoading ? '...' : '+ เพิ่ม Walk-in'}
            </button>
          </form>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10 text-sm font-medium">กำลังโหลด...</p>
        ) : attendance.length === 0 ? (
          <AdminEmptyState message="ไม่มีกิจกรรมจองสิทธิ์เข้าเรียนในวันนี้" />
        ) : (
          <div className="overflow-x-auto border border-gray-300 shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                  <th className="border border-gray-300 px-3 py-2">Nickname (ชื่อเล่น)</th>
                  <th className="border border-gray-300 px-3 py-2">Age (อายุ)</th>
                  <th className="border border-gray-300 px-3 py-2">Allergies (แพ้อาหาร)</th>
                  <th className="border border-gray-300 px-3 py-2">Parent / Contact (ผู้ปกครอง)</th>
                  <th className="border border-gray-300 px-3 py-2 text-center print:hidden w-16">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(row => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition">
                    <td className="border border-gray-300 px-3 py-1.5 font-bold text-gray-900">{row.nickname}</td>
                    <td className="border border-gray-300 px-3 py-1.5 text-gray-700">{formatAgeDisplay(row.age)}</td>
                    <td className="border border-gray-300 px-3 py-1.5">
                      {row.food_allergy ? (
                        <span className="font-bold text-red-600 uppercase">
                          {row.food_allergy}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{row.parent_name}</span>
                        <span className="text-gray-500 font-mono text-[11px] sm:text-xs">({row.parent_phone})</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleCancel(row.id)}
                        className="text-rose-500 hover:text-white hover:bg-rose-500 p-1.5 rounded transition cursor-pointer"
                        title="ยกเลิกการจอง"
                        aria-label="ยกเลิกการจอง"
                      >
                        <XCircle className="w-4 h-4 mx-auto" />
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
          <h2 className="text-md font-bold text-gray-700">ใบตรวจสอบรายชื่อนักเรียนเช็คอินห้องกิจกรรม</h2>
          <h3 className="text-sm font-semibold text-emerald-600">
            ประจำรอบวันที่: {formatThaiFullDate(dailyDate)} (จำนวนทั้งหมด {bookedCount} / {totalCapacity} คน)
          </h3>
        </div>

        <table className="w-full border-collapse border border-gray-900 text-left text-xs">
          <thead>
            <tr className="bg-gray-100 border border-gray-900 text-gray-800 font-bold">
              <th className="border border-gray-900 p-2 w-12 text-center">No. (ลำดับ)</th>
              <th className="border border-gray-900 p-2">Nickname (ชื่อเล่น)</th>
              <th className="border border-gray-900 p-2 w-16">Age (อายุ)</th>
              <th className="border border-gray-900 p-2">Allergies (ประวัติแพ้อาหาร)</th>
              <th className="border border-gray-900 p-2">Parent / Contact (ผู้ปกครอง)</th>
              <th className="border border-gray-900 p-2 w-28 text-center">Signature (ลายเซ็น)</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-900 p-4 text-center text-gray-400">
                  ไม่มีกิจกรรมจองในวันนี้
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
            พิมพ์รายงานเมื่อ:{' '}
            {new Date().toLocaleString('th-TH')}
          </p>
          <p>ลงชื่อคุณครูผู้ดูแล: _______________________</p>
        </div>
      </div>
    </div>
  );
}

