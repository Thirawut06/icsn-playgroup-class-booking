import React from 'react';
import { Loader2, Edit2, Trash2 } from 'lucide-react';
import { AdminDataTable, AdminTableEmpty, AdminToggle, AdminButton } from '../../admin-ui';
import type { PackageOption } from '@/types';

interface PackageTableProps {
  options: PackageOption[];
  loading: boolean;
  isProcessing: boolean;
  toggleActive: (pkg: PackageOption) => void;
  startEdit: (pkg: PackageOption) => void;
  setDeleteTarget: (pkg: PackageOption | null) => void;
}

export function PackageTable({
  options,
  loading,
  isProcessing,
  toggleActive,
  startEdit,
  setDeleteTarget
}: PackageTableProps) {
  return (
    <AdminDataTable
      headers={[
        { label: 'ชื่อแพ็กเกจ' },
        { label: 'ราคา (บาท)', align: 'center', width: 'w-[120px]' },
        { label: 'เครดิต', align: 'center', width: 'w-[120px]' },
        { label: 'สถานะ', align: 'center', width: 'w-[100px]' },
        { label: 'จัดการ', align: 'right', width: 'w-[180px]' },
      ]}
    >
      {loading ? (
        <tr>
          <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
          </td>
        </tr>
      ) : options.length === 0 ? (
        <AdminTableEmpty colSpan={5} message="ยังไม่มีแพ็กเกจในระบบ" />
      ) : (
        <>
          {options.map((pkg) => (
            <tr key={pkg.id} className={`hover:bg-muted/30 transition-colors ${!pkg.is_active ? 'opacity-60' : ''}`}>
              <td className="px-6 py-4">
                <p className={`font-bold text-icsn-navy ${!pkg.is_active ? 'line-through' : ''}`}>
                  {pkg.name}
                </p>
              </td>
              <td className="px-6 py-4 text-center">
                <p className="text-foreground font-medium">฿{pkg.price.toLocaleString()}</p>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 bg-muted text-foreground rounded-full text-sm font-bold border border-border">
                  {pkg.credits}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <AdminToggle 
                  isActive={!!pkg.is_active} 
                  onClick={() => toggleActive(pkg)} 
                  disabled={isProcessing} 
                />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <AdminButton 
                    variant="ghost" 
                    size="sm" 
                    icon={Edit2}
                    onClick={() => startEdit(pkg)} 
                  >
                    แก้ไข
                  </AdminButton>
                  <AdminButton 
                    variant="danger" 
                    size="sm" 
                    icon={Trash2}
                    onClick={() => setDeleteTarget(pkg)} 
                    disabled={isProcessing} 
                  >
                    ลบ
                  </AdminButton>
                </div>
              </td>
            </tr>
          ))}
        </>
      )}
    </AdminDataTable>
  );
}
