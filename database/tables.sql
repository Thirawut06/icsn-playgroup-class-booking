-- ============================================================
-- ICSN Playgroup - Tables Schema Reference (Auto-generated)
-- Generated on: 2026-06-29T02:22:39.243Z
-- ============================================================

CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL,
  child_id uuid NOT NULL,
  session_date date NOT NULL,
  status text NOT NULL DEFAULT 'confirmed'::text,
  cancelled_at timestamp with time zone,
  cancelled_by text,
  cancel_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  booking_date timestamp with time zone DEFAULT now(),
  session_id uuid,
  child_name_snapshot text,
  parent_phone_snapshot text);

CREATE TABLE public.children (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL,
  nickname text NOT NULL,
  age integer NOT NULL,
  food_allergy text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  full_name text,
  dob date,
  media_perm boolean,
  no_photo_perm boolean DEFAULT false,
  parent_photo_url text,
  special_info text,
  photo_url text);

CREATE TABLE public.credit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid,
  package_id uuid,
  action_type character varying NOT NULL,
  amount integer NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()));

CREATE TABLE public.package_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  credits integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()));

CREATE TABLE public.packages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL,
  type text NOT NULL,
  credits_remaining integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  non_refundable boolean DEFAULT false);

CREATE TABLE public.parents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  phone text NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  email text);

CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_date date NOT NULL,
  capacity integer NOT NULL DEFAULT 12,
  booked_count integer NOT NULL DEFAULT 0,
  total_capacity integer DEFAULT 15,
  is_active boolean DEFAULT true,
  time_label text NOT NULL DEFAULT 'เช้า (09:00 - 12:00)'::text);

CREATE TABLE public.slip_uploads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  package_id text,
  non_refundable boolean DEFAULT false);

CREATE TABLE public.system_settings (
  key character varying NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
