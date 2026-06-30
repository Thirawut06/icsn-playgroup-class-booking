import { User } from '@supabase/supabase-js';

export type TrustedRole = 'admin' | 'parent' | 'guest';

export function getTrustedRole(user: User | null | undefined): TrustedRole {
  if (!user) {
    return 'guest';
  }

  return user.app_metadata?.role === 'admin' ? 'admin' : 'parent';
}

export function isAdminUser(user: User | null | undefined): boolean {
  return getTrustedRole(user) === 'admin';
}
