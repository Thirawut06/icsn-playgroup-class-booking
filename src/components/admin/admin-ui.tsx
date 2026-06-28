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
    <div className={`bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-xs space-y-6 ${className}`}>
      {children}
    </div>
  );
}

export function AdminPanelHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
}) {
  return (
    <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-3 border-b border-gray-100 pb-4">
      <Icon className="text-icsn-teal w-6 h-6 shrink-0" strokeWidth={2} />
      <span>{title}</span>
    </h2>
  );
}

export function AdminEmptyState({
  message,
  icon: Icon,
}: {
  message: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="text-center py-12 sm:py-16 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 space-y-4">
      {Icon ? (
        <div className="inline-flex p-4 bg-gray-50 text-gray-300 rounded-full">
          <Icon className="w-8 h-8" />
        </div>
      ) : null}
      <p className="text-base font-medium">{message}</p>
    </div>
  );
}

export function AdminFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-2">{children}</label>
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
      className={`bg-icsn-teal hover:bg-icsn-teal/90 text-white py-3 px-6 rounded-xl text-sm font-bold h-12 transition disabled:opacity-50 cursor-pointer shadow-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
