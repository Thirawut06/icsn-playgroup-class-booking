"use client";

import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';

export function ResetPasswordForm() {
  const router = useRouter();
  const { dict, lang } = useDictionary();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) return;

    if (password !== confirmPassword) {
      setErrorMessage(dict.auth.passwordsDoNotMatch);
      return;
    }

    if (password.length < 6) {
      setErrorMessage(dict.auth.passwordTooShort);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setSuccess(true);
      
      // Sign out so they can log in cleanly, or keep them signed in
      // For safety, let's keep them signed in and redirect to home/book
      setTimeout(() => {
        window.location.href = ROUTES.LOGIN(lang);
      }, 2000);
      
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : dict.auth.genericError || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-16 h-16 text-icsn-teal" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{dict.auth.passwordUpdated}</h3>
        <Loader2 className="w-6 h-6 animate-spin text-icsn-teal mx-auto mt-6" />
      </div>
    );
  }

  return (
    <form onSubmit={submitUpdate} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block mb-1.5 text-base font-bold text-foreground">
            {dict.auth.newPassword}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/70 z-10">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={dict.auth.passwordPlaceholder}
              className="block w-full pl-11 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-foreground bg-muted/50 transition-colors min-h-12 text-base leading-normal"
            />
          </div>
        </div>
        
        <div>
          <label className="block mb-1.5 text-base font-bold text-foreground">
            {dict.auth.confirmNewPassword}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/70 z-10">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={dict.auth.passwordPlaceholder}
              className="block w-full pl-11 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-foreground bg-muted/50 transition-colors min-h-12 text-base leading-normal"
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm border border-error/20 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !password.trim() || !confirmPassword.trim()}
        className="w-full bg-icsn-navy hover:bg-icsn-navy/90 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 flex justify-center items-center h-12 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            {dict.auth.updatingPassword}
          </>
        ) : (
          dict.auth.updatePassword
        )}
      </button>
    </form>
  );
}
