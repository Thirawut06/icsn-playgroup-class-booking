"use client";

import React, { useState } from 'react';
import { Mail, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';

export function ForgotPasswordForm() {
  const { dict, lang } = useDictionary();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/${lang}/auth/callback?next=${ROUTES.RESET_PASSWORD(lang)}`,
      });

      if (error) throw error;
      
      setSuccess(true);
    } catch (error: any) {
      let msg = dict.auth.genericError || 'An error occurred';
      if (error?.message && error.message !== '{}') {
        msg = error.message;
      } else if (typeof error === 'string') {
        msg = error;
      }
      setErrorMessage(msg);
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
        <h3 className="text-xl font-bold text-foreground mb-2">{dict.auth.resetLinkSent}</h3>
      </div>
    );
  }

  return (
    <form onSubmit={submitReset} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block mb-1.5 text-base font-bold text-foreground">
            {dict.auth.emailLabel}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/70 z-10">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={dict.auth.emailPlaceholder}
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
        disabled={loading || !email.trim()}
        className="w-full bg-icsn-navy hover:bg-icsn-navy/90 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 flex justify-center items-center h-12 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            {dict.auth.sendingResetLink}
          </>
        ) : (
          dict.auth.sendResetLink
        )}
      </button>
    </form>
  );
}
