-- ============================================================
-- ICSN Panda Playgroup Booking System — Complete Database Schema
-- Last synced: 2026-06-26 (verified from live Supabase instance)
-- Run this in Supabase SQL Editor to recreate the database from scratch.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- 1. parents: ข้อมูลผู้ปกครอง (linked to Supabase Auth via id)
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. children: ข้อมูลเด็กแต่ละคน
CREATE TABLE IF NOT EXISTS children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    full_name TEXT,
    nickname TEXT NOT NULL,
    dob DATE,
    age INT NOT NULL,
    food_allergy TEXT,
    special_info TEXT,
    media_perm BOOLEAN,                       -- อนุญาตให้ใช้สื่อ
    no_photo_perm BOOLEAN DEFAULT false,       -- ยืนยันไม่ถ่ายรูปเด็กคนอื่น
    photo_url TEXT,                            -- รูปเด็ก (Supabase Storage)
    parent_photo_url TEXT,                     -- รูปผู้ปกครอง (Supabase Storage)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. sessions: คลาสเรียนแต่ละวัน (สร้างอัตโนมัติเมื่อมีการจอง)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_date DATE NOT NULL,
    time_label TEXT NOT NULL DEFAULT 'เช้า (09:00 - 12:00)',
    total_capacity INT DEFAULT 15,
    booked_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE (session_date, time_label)
);

-- 4. package_options: ตัวเลือกแพ็กเกจที่ Admin กำหนด
CREATE TABLE IF NOT EXISTS package_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    credits INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. packages: แพ็กเกจที่ผู้ปกครองแต่ละคนถือครอง
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    type TEXT NOT NULL,                        -- ชื่อแพ็กเกจ (ดึงจาก package_options.name)
    credits_remaining INT NOT NULL,
    non_refundable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. bookings: การจองคลาสเรียน
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,                -- วันที่คลาส (เก็บซ้ำเพื่อ query ง่าย)
    status TEXT NOT NULL DEFAULT 'confirmed',  -- confirmed | cancelled
    booking_date TIMESTAMPTZ DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    cancelled_by TEXT,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. slip_uploads: สลิปโอนเงินที่รอ Admin อนุมัติ
CREATE TABLE IF NOT EXISTS slip_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    package_id TEXT,                           -- ชื่อแพ็กเกจที่เลือก
    file_url TEXT NOT NULL,                    -- URL ของสลิปใน Supabase Storage
    status TEXT NOT NULL DEFAULT 'pending',    -- pending | approved | rejected
    non_refundable BOOLEAN DEFAULT false,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. credit_transactions: log การเพิ่ม/ตัดเครดิต
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    action_type VARCHAR NOT NULL,              -- 'topup' | 'booking' | 'cancel' | 'trial'
    amount INT NOT NULL,                       -- + เพิ่ม, - ตัด
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 9. system_settings: ตั้งค่าระบบ (เช่น admin_password)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE slip_uploads ENABLE ROW LEVEL SECURITY;

-- parents
CREATE POLICY "Allow public select parents" ON parents FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert parents" ON parents FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update parents" ON parents FOR UPDATE TO public USING (true);

-- children
CREATE POLICY "Allow public select children" ON children FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert children" ON children FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update children" ON children FOR UPDATE TO public USING (true);

-- sessions
CREATE POLICY "Allow public select sessions" ON sessions FOR SELECT TO public USING (true);
CREATE POLICY "Allow admin modify sessions" ON sessions FOR ALL TO public USING (true);
CREATE POLICY "Enable insert for authenticated users" ON sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable insert for anon users" ON sessions FOR INSERT TO anon WITH CHECK (true);

-- packages
CREATE POLICY "Allow public select packages" ON packages FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert packages" ON packages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update packages" ON packages FOR UPDATE TO public USING (true);

-- package_options
CREATE POLICY "Allow public read access to active packages" ON package_options FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Allow admin all access to packages" ON package_options FOR ALL TO public USING (true);

-- bookings
CREATE POLICY "Allow public select bookings" ON bookings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert bookings" ON bookings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update bookings" ON bookings FOR UPDATE TO public USING (true);
CREATE POLICY "Allow anon read bookings" ON bookings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert bookings" ON bookings FOR INSERT TO anon WITH CHECK (true);

-- slip_uploads
CREATE POLICY "Allow public select slip_uploads" ON slip_uploads FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert slip_uploads" ON slip_uploads FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update slip_uploads" ON slip_uploads FOR UPDATE TO public USING (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- book_class: จองคลาสเรียน (ตัดเครดิต + บันทึกการจอง)
CREATE OR REPLACE FUNCTION book_class(
    p_parent_id UUID,
    p_child_id UUID,
    p_session_id UUID,
    p_package_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_credits INT;
    v_capacity INT;
    v_booked INT;
    v_booking_id UUID;
    v_session_date DATE;
BEGIN
    -- ดึงวันที่จาก sessions table
    SELECT session_date INTO v_session_date FROM sessions WHERE id = p_session_id;
    IF v_session_date IS NULL THEN
        RAISE EXCEPTION 'Session not found / ไม่พบข้อมูลคลาส';
    END IF;

    -- ตรวจสอบเครดิต
    SELECT credits_remaining INTO v_credits FROM packages WHERE id = p_package_id AND parent_id = p_parent_id;
    IF v_credits IS NULL OR v_credits <= 0 THEN
        RAISE EXCEPTION 'Not enough credits / สิทธิ์ไม่เพียงพอ';
    END IF;

    -- ตรวจสอบที่ว่าง
    SELECT total_capacity INTO v_capacity FROM sessions WHERE id = p_session_id;
    SELECT count(*) INTO v_booked FROM bookings WHERE session_id = p_session_id AND status = 'confirmed';
    IF v_booked >= v_capacity THEN
        RAISE EXCEPTION 'Session is full / คลาสเรียนเต็มแล้ว';
    END IF;

    -- ตัดเครดิต
    UPDATE packages SET credits_remaining = credits_remaining - 1 WHERE id = p_package_id;

    -- บันทึกการจอง
    INSERT INTO bookings (session_id, session_date, child_id, parent_id, status)
    VALUES (p_session_id, v_session_date, p_child_id, p_parent_id, 'confirmed')
    RETURNING id INTO v_booking_id;

    RETURN json_build_object('id', v_booking_id);
END;
$$;

-- cancel_booking: ยกเลิกการจอง (คืนเครดิต)
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID, p_package_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status FROM bookings WHERE id = p_booking_id;
    IF v_status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled / คลาสนี้ถูกยกเลิกไปแล้ว';
    END IF;

    UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
    UPDATE packages SET credits_remaining = credits_remaining + 1 WHERE id = p_package_id;
END;
$$;

-- admin_add_walkin: Admin เพิ่ม Walk-in โดยใช้เบอร์โทร
CREATE OR REPLACE FUNCTION admin_add_walkin(p_phone TEXT, p_child_name TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_child_id UUID;
    v_dummy_email TEXT;
BEGIN
    SELECT id INTO v_parent_id FROM parents WHERE phone = p_phone LIMIT 1;
    IF v_parent_id IS NULL THEN
        v_parent_id := gen_random_uuid();
        v_dummy_email := 'walkin_' || p_phone || '@icsn.local';
        INSERT INTO parents (id, name, phone, email)
        VALUES (v_parent_id, 'Walk-in Parent (' || p_phone || ')', p_phone, v_dummy_email);
    END IF;

    INSERT INTO children (parent_id, full_name, nickname, no_photo_perm, media_perm, age)
    VALUES (v_parent_id, p_child_name, p_child_name, false, true, 0)
    RETURNING id INTO v_child_id;

    RETURN json_build_object('parent_id', v_parent_id, 'child_id', v_child_id);
END;
$$;

-- ============================================================
-- STORAGE BUCKETS (สร้างผ่าน Supabase Dashboard)
-- ============================================================
-- bucket: "profiles"  → รูปถ่ายผู้ปกครองและเด็ก (public)
-- bucket: "slips"     → สลิปโอนเงิน (public)

-- ============================================================
-- DATABASE TRIGGERS
-- ============================================================

-- update_session_booked_count: อัปเดตจำนวนการจองแบบ Realtime
CREATE OR REPLACE FUNCTION update_session_booked_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE sessions SET booked_count = booked_count + 1 WHERE id = NEW.session_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE sessions SET booked_count = booked_count + 1 WHERE id = NEW.session_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE sessions SET booked_count = booked_count - 1 WHERE id = OLD.session_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE sessions SET booked_count = booked_count - 1 WHERE id = OLD.session_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_session_booked_count ON bookings;
CREATE TRIGGER trg_update_session_booked_count
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_session_booked_count();
