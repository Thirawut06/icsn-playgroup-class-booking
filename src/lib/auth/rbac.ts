import { supabase } from '../supabase';
import { getTrustedRole, type TrustedRole } from './roles';

export type AuthState = {
  isAuthenticated: boolean;
  user: any | null;
  role: TrustedRole;
};

export async function getCurrentUserRole(): Promise<AuthState> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { isAuthenticated: false, user: null, role: 'guest' };
  }
  
  return {
    isAuthenticated: true,
    user: user,
    role: getTrustedRole(user),
  };
}

export async function requireAdmin(): Promise<void> {
  const { role } = await getCurrentUserRole();
  if (role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}
