export type AdminTab =
  | 'dashboard'
  | 'daily_ops'
  | 'slips'
  | 'users'
  | 'settings'
  | 'timeslot';

export interface AdminTabProps {
  onRefresh?: () => void;
}
