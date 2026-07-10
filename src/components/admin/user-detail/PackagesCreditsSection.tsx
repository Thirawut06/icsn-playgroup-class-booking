import React from 'react';
import { Ticket, Coins, History, CalendarPlus } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

interface PackagesCreditsSectionProps {
  data: any;
  onOpenCreditModal: () => void;
  onOpenBookingModal: () => void;
}

export function PackagesCreditsSection({ data, onOpenCreditModal, onOpenBookingModal }: PackagesCreditsSectionProps) {
  const totalCredits = data?.packages?.reduce((sum: number, pkg: any) => sum + (pkg.credits_remaining || 0), 0) || 0;

  if (!data) return null;

  return (
    <div className="border-b border-border pb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Ticket className="w-5 h-5 text-icsn-navy" />
          แพ็กเกจ และ เครดิต
        </h3>
        {data.packages && data.packages.length > 0 && (
          <div className="text-right bg-icsn-teal/10 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-icsn-navy mr-2">ยอดรวมทั้งหมด</span>
            <span className="text-base font-bold text-icsn-teal">
              {totalCredits} เครดิต
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          onClick={onOpenCreditModal}
          className="w-full py-3 bg-white border-2 border-icsn-teal text-icsn-teal hover:bg-icsn-teal/5 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Coins className="w-5 h-5" /> ปรับปรุงเครดิต
        </button>
        <button
          onClick={onOpenBookingModal}
          className="w-full py-3 bg-icsn-teal text-white hover:bg-icsn-teal/90 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-icsn-teal/20"
        >
          <CalendarPlus className="w-5 h-5" /> ลงวันจองคลาส
        </button>
      </div>

      {data.packages && data.packages.length > 0 ? (
        <div className="space-y-4 mb-6">
          {data.packages.map((pkg: any) => {
            // Calculate the original credits added for this package
            const originalCredits = data.credit_transactions?.reduce((sum: number, tx: any) => {
              if (tx.package_id === pkg.id && tx.amount > 0) {
                return sum + tx.amount;
              }
              return sum;
            }, 0) || pkg.credits_remaining;

            return (
              <div key={pkg.id} className="flex items-center justify-between border-l-4 border-info pl-4 py-1">
                <div>
                  <p className="font-medium text-foreground text-base">
                    {pkg.type === 'trial' 
                      ? '✅ แพ็กเกจทดลองเรียน (Trial)' 
                      : pkg.type === 'manual_adjustment' 
                        ? '🔧 แอดมินปรับเครดิตให้ (Manual)' 
                        : `💎 สมัครแพ็กเกจ: ${pkg.type}`}
                  </p>
                  <p className="text-sm text-muted-foreground">ทำรายการเมื่อ: {formatDateShort(pkg.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-icsn-teal">
                    +{originalCredits} เครดิต
                  </p>
                  <p className="text-xs text-muted-foreground">
                    คงเหลือ {pkg.credits_remaining} เครดิต
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-base text-muted-foreground mb-6">ไม่พบประวัติแพ็กเกจ (Walk-in)</p>
      )}

      {data.credit_transactions && data.credit_transactions.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-4 text-sm flex items-center gap-2">
            <History className="w-4 h-4" /> ประวัติเครดิตล่าสุด
          </h4>
          <div className="space-y-3">
            {data.credit_transactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex justify-between items-start text-base border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-foreground">{log.notes || log.action_type}</p>
                  <p className="text-sm text-muted-foreground">{formatDateShort(log.created_at)}</p>
                </div>
                <span className={`font-semibold ${log.amount > 0 ? 'text-success' : 'text-error'}`}>
                  {log.amount > 0 ? '+' : ''}{log.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
