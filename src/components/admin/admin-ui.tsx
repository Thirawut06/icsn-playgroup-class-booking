import React from 'react';
import type { LucideIcon } from 'lucide-react';

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
}: {
  headers: { label: string; align?: 'left' | 'center' | 'right' }[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-muted/50/80 border-b border-border/50 text-sm">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-6 py-4 font-bold text-foreground/80 ${
                    h.align === 'center' ? 'text-center' : h.align === 'right' ? 'text-right' : 'text-left'
                  }`}
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
