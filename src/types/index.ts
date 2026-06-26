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
}

export interface Package {
  id: string;
  parent_id: string;
  type: 'trial' | 'purchase';
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
}

export interface Session {
  id: string;
  session_date: string;
  time_label?: string;
  total_capacity: number;
  booked_count?: number;
  is_active: boolean;
  theme?: string;
  activity_desc?: string;
}

export interface Booking {
  id: string;
  session_id: string;
  child_id: string;
  parent_id: string;
  session_date: string;
  status: 'confirmed' | 'cancelled';
  booking_date: string;
  session?: Session;
  child?: Child;
}
