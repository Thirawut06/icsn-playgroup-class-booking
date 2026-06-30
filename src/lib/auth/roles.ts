export type TrustedRole = 'admin' | 'parent' | 'guest';

type UserWithAppMetadata = {
  app_metadata?: {
    role?: unknown;
  } | null;
} | null | undefined;

export function getTrustedRole(user: UserWithAppMetadata): TrustedRole {
  if (!user) {
    return 'guest';
  }

  return user.app_metadata?.role === 'admin' ? 'admin' : 'parent';
}

export function isAdminUser(user: UserWithAppMetadata): boolean {
  return getTrustedRole(user) === 'admin';
}
