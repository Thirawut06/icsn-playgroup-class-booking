import React, { useState } from 'react';
import { Mail, Lock, User, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ParentService } from '@/lib/supabase';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';

export function SignupForm() {
  const router = useRouter();
  const { dict, lang } = useDictionary();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const submitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const cleanPhone = phone.trim().replace(/\D/g, "");
      if (cleanPhone.length < 9 || cleanPhone.length > 10) {
        throw new Error(dict.auth.phoneInvalid);
      }
      if (password.length < 6) {
        throw new Error(dict.auth.passwordTooShort);
      }
      if (!parentName.trim()) {
        throw new Error(dict.auth.nameRequired);
      }

      await ParentService.signUp(email.trim(), password, parentName.trim(), cleanPhone);
      
      window.location.href = ROUTES.APPLY(lang);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error && error.message ? error.message : dict.auth.signupFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitSignUp} className="space-y-6">
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
              minLength={6}
              placeholder={dict.auth.passwordMinLength}
              className="block w-full pl-11 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:border-icsn-teal text-foreground bg-muted/50 transition-colors min-h-12 text-base leading-normal"
            />
          </div>
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
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              required
              placeholder={dict.auth.nameExample}
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder={dict.auth.phonePlaceholder}
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
        disabled={loading}
        className="w-full mt-4 bg-icsn-teal hover:bg-icsn-teal/90 text-white py-3 px-4 rounded-full font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer h-[52px] text-lg shrink-0 disabled:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-100"
      >
        {!loading ? (
          <div className="flex items-center gap-2 justify-center w-full">
            <span>{dict.auth.signUpBtn}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5 text-white" />
            <span>{dict.auth.signingUp}</span>
          </div>
        )}
      </button>
    </form>
  );
}
