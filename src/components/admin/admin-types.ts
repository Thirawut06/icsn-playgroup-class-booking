export type AdminTab =
  | 'daily'
  | 'slips'
  | 'credits'
  | 'cancel'
  | 'export'
  | 'packages';

export interface AdminTabProps {
  onRefresh?: () => void;
}
