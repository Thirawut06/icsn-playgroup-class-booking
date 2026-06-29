export const ROUTES = {
  HOME: '/',
  ADMIN: '/admin',
  LOGIN: (tab?: 'login' | 'signup') => tab ? `/login?tab=${tab}` : '/login',
  APPLY: '/apply',
  APPLY_ADD_CHILD: '/apply?addChild=true',
};
