import React, { memo } from 'react';
import { Loader2, Info } from 'lucide-react';
import { AdminDataTable, AdminButton, AdminBadge } from '../../admin-ui';
import type { ClassifiedUser } from '@/types';

interface UserTableProps {
  loading: boolean;
  users: ClassifiedUser[];
  openDrawer: (parentId: string) => void;
}

const UserTableRow = memo(({ user, openDrawer }: { user: ClassifiedUser, openDrawer: (id: string) => void }) => {
  return (
    <tr 
      className="hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => openDrawer(user.id)}
    >
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
        <AdminBadge 
          variant={
            user.category === 'payment' ? 'info' :
            user.category === 'trial' ? 'warning' : 'default'
          }
          className="mt-1.5"
        >
          {user.category.toUpperCase()}
        </AdminBadge>
      </td>
      <td className="px-4 py-4">
        <p className="font-medium text-foreground/80 text-sm">{user.name}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{user.phone}</p>
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
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
          <AdminButton
            variant="secondary"
            size="sm"
            icon={Info}
            onClick={(e) => {
              e.stopPropagation();
              openDrawer(user.id);
            }}
          >
            รายละเอียด
          </AdminButton>
        </div>
      </td>
    </tr>
  );
});
UserTableRow.displayName = 'UserTableRow';

export const UserTable = memo(({
  loading,
  users,
  openDrawer
}: UserTableProps) => {
  return (
    <AdminDataTable
      minWidth="min-w-[900px]"
      headers={[
        { label: 'ชื่อนักเรียน' },
        { label: 'ผู้ปกครอง' },
        { label: 'อีเมล' },
        { label: 'จองสำเร็จ', align: 'center', width: 'w-[100px]' },
        { label: 'เครดิต', align: 'center', width: 'w-[100px]' },
        { label: 'จัดการ', align: 'center', width: 'w-[120px]' },
      ]}
    >
      {loading ? (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
          </td>
        </tr>
      ) : users.length === 0 ? (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
            ไม่พบข้อมูล
          </td>
        </tr>
      ) : (
        <>
          {users.map((user) => (
            <UserTableRow key={user.id} user={user} openDrawer={openDrawer} />
          ))}
        </>
      )}
    </AdminDataTable>
  );
});
UserTable.displayName = 'UserTable';
