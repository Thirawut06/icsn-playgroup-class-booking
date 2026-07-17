import React from 'react';
import { Search, X, ChevronLeft, ChevronRight, Loader2, AlertTriangle, type LucideIcon } from 'lucide-react';

export function AdminPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  );
}

export function AdminTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = '',
}: {
  tabs: { id: T; label: string }[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex p-1 bg-muted rounded-xl w-full xl:w-auto max-w-full overflow-x-auto custom-scrollbar shrink-0 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2 rounded-lg font-bold text-sm transition ${
            activeTab === tab.id
              ? 'bg-white text-icsn-teal shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function AdminPanelHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-3">
        <Icon className="text-icsn-teal w-6 h-6 shrink-0" strokeWidth={2} />
        <span>{title}</span>
      </h2>
      {action && <div>{action}</div>}
    </div>
  );
}

export function AdminEmptyState({
  message,
  icon: Icon,
  action,
}: {
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12 sm:py-16 border-2 border-dashed border rounded-2xl text-muted-foreground/70 space-y-4">
      {Icon ? (
        <div className="inline-flex p-4 bg-muted text-muted-foreground/70 rounded-full">
          <Icon className="w-8 h-8" />
        </div>
      ) : null}
      <p className="text-base font-medium">{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function AdminFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-foreground mb-2">{children}</label>
  );
}

export function AdminStepBadge({ step, label, className = '' }: { step: number | string; label: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="bg-icsn-teal/15 text-icsn-teal w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-sm font-black">
        {step}
      </span>
      <h5 className="font-bold text-sm text-foreground/80">{label}</h5>
    </div>
  );
}

export function AdminPrimaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`bg-icsn-teal hover:bg-icsn-teal/90 text-white py-3 px-6 rounded-xl text-sm font-bold h-12 transition disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 🌍 World-Class Component Library Extensions
// ---------------------------------------------------------------------------

export function AdminTimeRangePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  // value is expected to be "HH.mm - HH.mm" or "HH:mm - HH:mm"
  const normalizedValue = value.replace(/:/g, '.');
  const parts = normalizedValue.split(' - ');
  const start = parts[0] || '09.00';
  const end = parts[1] || '12.00';

  const [startH, startM] = start.includes('.') ? start.split('.') : start.split(':');
  const [endH, endM] = end.includes('.') ? end.split('.') : end.split(':');

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')); // 00, 05, 10...

  const handleChange = (type: 'startH' | 'startM' | 'endH' | 'endM', val: string) => {
    let newStartH = startH;
    let newStartM = startM;
    let newEndH = endH;
    let newEndM = endM;

    if (type === 'startH') newStartH = val;
    if (type === 'startM') newStartM = val;
    if (type === 'endH') newEndH = val;
    if (type === 'endM') newEndM = val;

    onChange(`${newStartH}.${newStartM} - ${newEndH}.${newEndM}`);
  };

  const SelectBox = ({ val, options, onChangeField }: { val: string, options: string[], onChangeField: (v: string) => void }) => (
    <select 
      value={val}
      onChange={(e) => onChangeField(e.target.value)}
      className="bg-white border border-border/80 rounded-md px-3 py-1.5 text-base font-bold text-icsn-navy focus:outline-none focus:border-icsn-teal shadow-sm cursor-pointer"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-1.5 bg-muted/40 p-2 rounded-lg border border-border/50">
        <SelectBox val={startH} options={hours} onChangeField={(v) => handleChange('startH', v)} />
        <span className="font-bold text-muted-foreground mx-0.5">:</span>
        <SelectBox val={startM} options={minutes} onChangeField={(v) => handleChange('startM', v)} />
      </div>
      <span className="font-bold text-muted-foreground/40">-</span>
      <div className="flex items-center gap-1.5 bg-muted/40 p-2 rounded-lg border border-border/50">
        <SelectBox val={endH} options={hours} onChangeField={(v) => handleChange('endH', v)} />
        <span className="font-bold text-muted-foreground mx-0.5">:</span>
        <SelectBox val={endM} options={minutes} onChangeField={(v) => handleChange('endM', v)} />
      </div>
    </div>
  );
}

export function AdminInfoBox({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description: React.ReactNode;
  icon: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-info/10/50 p-4 rounded-xl border border-info/20">
      <div className="flex gap-3">
        <div className="mt-0.5">
          <Icon className="w-5 h-5 text-info" />
        </div>
        <div className="text-sm">
          <p className="font-bold text-info">{title}</p>
          <div className="text-info/80 mt-1">{description}</div>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function AdminToggle({
  isActive,
  onClick,
  disabled,
}: {
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-icsn-teal focus:ring-offset-2 disabled:opacity-50 transition-colors ${
        isActive ? 'bg-icsn-teal' : 'bg-muted'
      }`}
      title={isActive ? 'กดเพื่อปิดใช้งาน' : 'กดเพื่อเปิดใช้งาน'}
    >
      <span className="sr-only">Toggle</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isActive ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function AdminIconButton({
  icon: Icon,
  variant = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'danger';
}) {
  const baseClasses = "p-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center";
  let variantClasses = "";

  switch (variant) {
    case 'primary':
      variantClasses = "text-info hover:bg-info/10";
      break;
    case 'danger':
      variantClasses = "text-error hover:bg-error/10";
      break;
    default:
      variantClasses = "text-muted-foreground hover:bg-muted";
      break;
  }

  return (
    <button type="button" className={`${baseClasses} ${variantClasses} ${props.className || ''}`} {...props}>
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function AdminDataTable({
  headers,
  children,
  minWidth = "min-w-[600px]",
}: {
  headers: { label: string; align?: 'left' | 'center' | 'right'; width?: string }[];
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className={`w-full text-left border-collapse ${minWidth}`}>
          <thead>
            <tr className="bg-muted/50/80 border-b border-border/50 text-sm">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-6 py-4 font-bold text-foreground/80 ${
                    h.align === 'center' ? 'text-center' : h.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  style={{ width: h.width }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50/50">
          <h3 className="text-lg font-bold text-icsn-navy">{title}</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}


export function AdminSearch({
  value,
  onChange,
  placeholder = "ค้นหา...",
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 h-[44px] border border-border rounded-xl focus:border-icsn-teal focus:ring-2 focus:ring-icsn-teal/20 outline-none text-foreground text-sm bg-white shadow-sm transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
      <p className="text-sm text-muted-foreground">
        {totalItems && itemsPerPage ? (
          <>
            แสดงผล <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> ถึง <span className="font-bold text-foreground">{Math.min(currentPage * itemsPerPage, totalItems)}</span> จากทั้งหมด <span className="font-bold text-foreground">{totalItems}</span> รายการ
          </>
        ) : (
          <>
            หน้า <span className="font-bold text-foreground">{currentPage}</span> จาก <span className="font-bold text-foreground">{totalPages}</span>
          </>
        )}
      </p>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1 hidden sm:flex">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            // Show current, first, last, and pages around current
            if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    currentPage === pageNum ? 'bg-icsn-teal text-white shadow-sm' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {pageNum}
                </button>
              );
            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
              return <span key={pageNum} className="text-muted-foreground w-9 text-center">...</span>;
            }
            return null;
          })}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function AdminButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  isLoading = false,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'icon';
  icon?: LucideIcon;
  isLoading?: boolean;
}) {
  const baseClasses = "inline-flex items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  
  let variantClasses = "";
  switch (variant) {
    case 'primary':
      variantClasses = "bg-icsn-teal text-white hover:bg-icsn-teal/90 shadow-sm";
      break;
    case 'secondary':
      variantClasses = "bg-white text-foreground border border-border hover:bg-muted hover:text-icsn-navy shadow-sm";
      break;
    case 'danger':
      variantClasses = "bg-error text-white hover:bg-error/90 shadow-sm";
      break;
    case 'ghost':
      variantClasses = "text-muted-foreground hover:bg-muted hover:text-foreground";
      break;
    case 'icon': // Special variant for action icons in tables
      variantClasses = "text-muted-foreground hover:bg-muted rounded-lg";
      break;
  }
  
  // Override icon size styles
  let sizeClasses = "";
  if (variant === 'icon') {
    sizeClasses = "w-8 h-8";
  } else {
    switch (size) {
      case 'sm':
        sizeClasses = "px-3 py-1.5 text-sm rounded-lg";
        break;
      case 'md':
      default:
        sizeClasses = "px-4 py-2.5 text-sm rounded-xl";
        break;
      case 'icon':
        sizeClasses = "w-10 h-10 rounded-xl";
        break;
    }
  }

  return (
    <button 
      type="button"
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={`${variant === 'icon' ? 'w-4 h-4' : 'w-4 h-4 mr-2'} animate-spin`} />
      ) : Icon ? (
        <Icon className={`${variant === 'icon' ? 'w-4 h-4' : 'w-4 h-4 mr-2'} ${!children ? '!mr-0' : ''}`} />
      ) : null}
      {children}
    </button>
  );
}

export function AdminBadge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  className?: string;
}) {
  let variantClasses = "";
  switch (variant) {
    case 'success':
      variantClasses = "bg-success/10 text-success border-success/20";
      break;
    case 'warning':
      variantClasses = "bg-warning/10 text-warning border-warning/20";
      break;
    case 'error':
      variantClasses = "bg-error/10 text-error border-error/20";
      break;
    case 'info':
      variantClasses = "bg-info/10 text-info border-info/30";
      break;
    default:
      variantClasses = "bg-muted text-muted-foreground border-border";
      break;
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}

export function AdminInput({
  label,
  error,
  leftIcon: LeftIcon,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  leftIcon?: LucideIcon | string; // Can pass text like '฿'
}) {
  return (
    <div className={className}>
      {label && <AdminFieldLabel>{label}</AdminFieldLabel>}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold flex items-center justify-center">
            {typeof LeftIcon === 'string' ? LeftIcon : <LeftIcon className="w-5 h-5" />}
          </div>
        )}
        <input
          className={`w-full ${LeftIcon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 bg-white border ${error ? 'border-error' : 'border-border focus:border-icsn-teal/50'} rounded-xl focus:ring-2 focus:ring-icsn-teal/20 outline-none transition-all text-foreground text-sm`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

export function AdminSelect({
  label,
  error,
  options,
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className={className}>
      {label && <AdminFieldLabel>{label}</AdminFieldLabel>}
      <select
        className={`w-full px-4 py-2.5 bg-white border ${error ? 'border-error' : 'border-border focus:border-icsn-teal/50'} rounded-xl focus:ring-2 focus:ring-icsn-teal/20 outline-none transition-all text-foreground text-sm appearance-none cursor-pointer`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

export function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  isDestructive = false,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${isDestructive ? 'bg-error/10 text-error' : 'bg-info/10 text-info'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-icsn-navy">{title}</h3>
              <div className="text-muted-foreground mt-2 text-sm leading-relaxed">{message}</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-muted/50 border-t border-border flex justify-end gap-3">
          <AdminButton variant="secondary" onClick={onClose} disabled={isLoading}>{cancelText}</AdminButton>
          <AdminButton 
            variant={isDestructive ? 'danger' : 'primary'} 
            onClick={onConfirm} 
            isLoading={isLoading}
          >
            {confirmText}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

export function AdminTableEmpty({
  message = "ไม่พบข้อมูล",
  colSpan,
}: {
  message?: string;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-muted-foreground font-medium">
        {message}
      </td>
    </tr>
  );
}
