export type AdminTab =
  | 'dashboard'
  | 'daily_ops'
  | 'slips'
  | 'users'
  | 'packages'
  | 'settings'
  | 'timeslot'
  | 'holidays';

export interface AdminTabProps {
  onRefresh?: () => void;
}
