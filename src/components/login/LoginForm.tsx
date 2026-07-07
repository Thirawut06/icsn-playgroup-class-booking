import React, { useState } from 'react';
import { Mail, Lock, User, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ParentService, supabase } from '@/lib/supabase';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';

export function LoginForm() {
  const router = useRouter();
  const { dict, lang } = useDictionary();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [completeName, setCompleteName] = useState('');
  const [completePhone, setCompletePhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (isCompletingProfile) {
        const cleanPhone = completePhone.trim().replace(/\D/g, "");
        if (cleanPhone.length < 9 || cleanPhone.length > 10) {
          throw new Error(dict.auth.phoneInvalid);
        }
        if (!completeName.trim()) {
          throw new Error(dict.auth.nameRequired);
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error(dict.auth.userNotFound);

        await ParentService.completeProfile(user.id, completeName.trim(), cleanPhone);
        
        window.location.href = ROUTES.APPLY(lang);
        return;
      }

      if (!email.trim() || !password.trim()) {
        throw new Error(dict.auth.emailPasswordRequired);
      }

      const parent = await ParentService.signIn(email.trim(), password);

      const children = await ParentService.getChildren(parent.id);
      if (children && children.length > 0) {
        window.location.href = ROUTES.BOOK(lang);
      } else {
        window.location.href = ROUTES.APPLY(lang);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'PROFILE_MISSING') {
        setIsCompletingProfile(true);
        setErrorMessage('');
      } else {
        const msg = error instanceof Error && error.message ? error.message : dict.auth.loginFailed;
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitLogin} className="space-y-6">
      <div className="space-y-4">
        {isCompletingProfile ? (
          <>
            <div className="bg-warning/10 p-4 rounded-xl border border-warning/30 mb-6">
              <p className="text-warning text-[15px] font-medium text-center whitespace-pre-wrap leading-relaxed">
                {dict.auth.profileIncomplete}
              </p>
            </div>
            <div>
              <label className="block mb-1.5 text-base font-bold text-foreground">
                {dict.auth.nameLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/70 z-10">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={completeName}
                  onChange={(e) => setCompleteName(e.target.value)}
                  required
                  placeholder={dict.auth.namePlaceholder}
                  className="block w-full pl-11 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-foreground bg-muted/50 transition-colors min-h-12 text-base leading-normal"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-base font-bold text-foreground">
                {dict.auth.phoneLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/70 z-10">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={completePhone}
                  onChange={(e) => setCompletePhone(e.target.value)}
                  required
                  placeholder={dict.auth.phonePlaceholder}
                  className="block w-full pl-11 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-foreground bg-muted/50 transition-colors min-h-12 text-base leading-normal"
                />
              </div>
            </div>
          </>
        ) : (
          <>
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

            <div>
              <label className="block mb-1.5 text-base font-bold text-foreground">
                {dict.auth.passwordLabel}
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
          </>
        )}
      </div>

      {errorMessage && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm border border-error/20 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{errorMessage}</p>
            {!isCompletingProfile && (
              <p className="text-xs text-error mt-1">
                {dict.auth.loginError}
              </p>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-icsn-navy hover:bg-icsn-navy/90 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 flex justify-center items-center h-12 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            {isCompletingProfile ? dict.auth.saveProfile : dict.auth.signingIn}
          </>
        ) : (
          isCompletingProfile ? dict.auth.saveProfile : dict.auth.signInBtn
        )}
      </button>
    </form>
  );
}
