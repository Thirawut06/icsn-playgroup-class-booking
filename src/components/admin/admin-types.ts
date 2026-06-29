export type AdminTab =
  | 'dashboard'
  | 'slips'
  | 'users'
  | 'settings';

export interface AdminTabProps {
  onRefresh?: () => void;
}
