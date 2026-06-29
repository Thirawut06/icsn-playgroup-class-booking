export type AdminTab =
  | 'dashboard'
  | 'daily'
  | 'calendar'
  | 'slips'
  | 'credits'
  | 'children'
  | 'cancel'
  | 'packages'
  | 'settings';

export interface AdminTabProps {
  onRefresh?: () => void;
}
