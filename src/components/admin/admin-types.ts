export type AdminTab =
  | 'daily'
  | 'slips'
  | 'credits'
  | 'cancel'
  | 'packages';

export interface AdminTabProps {
  onRefresh?: () => void;
}
