-- Database Schema for ICSN Panda Playgroup Booking System
-- Copy and paste this script into the Supabase SQL Editor.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: parents
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Table: children
CREATE TABLE IF NOT EXISTS children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    full_name TEXT,
    dob DATE,
    age INT NOT NULL,
    food_allergy TEXT,
    media_perm TEXT,
    no_photo_perm BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Table: packages
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'trial' or 'purchase'
    credits_remaining INT NOT NULL,
    non_refundable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' or 'cancelled'
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by TEXT, -- 'parent' or 'admin'
    cancel_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Table: slip_uploads
CREATE TABLE IF NOT EXISTS slip_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'approved'
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Table: sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_date DATE UNIQUE NOT NULL,
    capacity INT DEFAULT 12 NOT NULL,
    booked_count INT DEFAULT 0 NOT NULL
);

-- 7. Table: package_options (Dynamic packages managed by admin)
CREATE TABLE IF NOT EXISTS package_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price INT NOT NULL,
    credits INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable Row Level Security (RLS) on all tables (as requested, but config-friendly)
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE slip_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_options ENABLE ROW LEVEL SECURITY;

-- Creating public policies for anonymous client access (phone-based login scenario)
-- Since parents login with phone number (without traditional password authentication),
-- the client will pass queries filtered by parents.id.

-- Parents policies
CREATE POLICY "Allow public select parents" ON parents FOR SELECT USING (true);
CREATE POLICY "Allow public insert parents" ON parents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update parents" ON parents FOR UPDATE USING (true);

-- Children policies
CREATE POLICY "Allow public select children" ON children FOR SELECT USING (true);
CREATE POLICY "Allow public insert children" ON children FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update children" ON children FOR UPDATE USING (true);

-- Packages policies
CREATE POLICY "Allow public select packages" ON packages FOR SELECT USING (true);
CREATE POLICY "Allow public insert packages" ON packages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update packages" ON packages FOR UPDATE USING (true);

-- Bookings policies
CREATE POLICY "Allow public select bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update bookings" ON bookings FOR UPDATE USING (true);

-- Slip uploads policies
CREATE POLICY "Allow public select slip_uploads" ON slip_uploads FOR SELECT USING (true);
CREATE POLICY "Allow public insert slip_uploads" ON slip_uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update slip_uploads" ON slip_uploads FOR UPDATE USING (true);

-- Sessions policies
CREATE POLICY "Allow public select sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public update sessions" ON sessions FOR UPDATE USING (true);

-- Package options policies
CREATE POLICY "Allow public select active packages" ON package_options FOR SELECT USING (is_active = true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parents_phone ON parents(phone);
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_packages_parent ON packages(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parent ON bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(session_date);
CREATE INDEX IF NOT EXISTS idx_slips_parent ON slip_uploads(parent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
