export interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface Child {
  id: string;
  parent_id: string;
  nickname: string;
  full_name: string;
  dob: string | null;
  age: number;
  food_allergy: string | null;
  media_perm: boolean | null;
  no_photo_perm: boolean;
  parent_photo_url?: string;
  photo_url?: string;
}

export interface Package {
  id: string;
  parent_id: string;
  type: string;
  credits_remaining: number;
  non_refundable: boolean;
  created_at?: string;
}

export interface SlipUpload {
  id: string;
  parent_id: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  created_at: string;
}

export interface PackageOption {
  id: string;
  name: string;
  price: number;
  credits: number;
  is_active?: boolean;
}

export interface DailyAttendanceRow {
  id: string;
  nickname: string;
  full_name?: string;
  dob?: string;
  age: number;
  food_allergy: string | null;
  parent_name: string;
  parent_phone: string;
  created_at: string;
  is_walkin?: boolean;
  is_trial?: boolean;
  signature_url?: string | null;
  checkin_at?: string | null;
}

export interface TransactionHistoryRow {
  id: string;
  parent_id: string;
  parent_name: string;
  parent_phone: string;
  children_nicknames: string;
  package_name: string;
  price: number;
  credits: number;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

export interface PendingSlipRow {
  id: string;
  parent_id: string;
  file_url: string;
  status: string;
  created_at: string;
  package_id?: string | null;
  parent_name: string;
  parent_phone: string;
  child_nickname: string;
  credits_to_add: number;
}

export interface ConfirmedBookingRow {
  id: string;
  session_date: string;
  parent_name: string;
  parent_phone: string;
  child_nickname: string;
}


export interface ParentWithDetails extends Parent {
  children?: Child[];
  packages?: Package[];
}

export interface Session {
  id: string;
  session_date: string;
  time_label?: string;
  total_capacity: number;
  trial_capacity?: number;
  booked_count?: number;
  trial_booked_count?: number;
  is_active: boolean;
  theme?: string;
  activity_desc?: string;
}

export interface Booking {
  id: string;
  session_id: string;
  child_id: string | null;
  parent_id: string | null;
  session_date: string;
  status: 'confirmed' | 'cancelled';
  booking_date: string;
  is_trial?: boolean;
  package_id?: string;
  child_name_snapshot?: string | null;
  parent_phone_snapshot?: string | null;
  session?: Session;
  child?: Child | null;
}

export interface CreditTransaction {
  id: string;
  parent_id: string;
  package_id?: string | null;
  amount: number;
  action_type: 'booking' | 'refund' | 'topup' | 'admin_adjustment';
  reason?: string;
  created_at: string;
}

export interface SessionTemplate {
  id: string;
  time_label: string;
  capacity: number;
  trial_capacity?: number;
  is_active: boolean;
  day_of_week?: number[] | null;
  created_at: string;
}

export interface ClassifiedUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  children_nicknames: string;
  children_list: { nickname: string, full_name?: string }[];
  total_credits: number;
  total_bookings: number;
  category: 'payment' | 'trial' | 'registered' | 'walk-in';
  latestActivity: number;
  raw_parent?: unknown;
}

export interface SubmitChildPayload {
  parentId: string;
  childName: string;
  childNickname: string;
  childDob: string;
  childPhotoFile: File | null;
  parentPhotoFile: File | null;
  allergy: string;
  info: string;
  mediaPerm: boolean;
  noPhotoPerm: boolean;
}

export interface SchoolClosure {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  time_label?: string | null;
  is_force_open?: boolean;
}