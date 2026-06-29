-- ============================================================
-- ICSN Playgroup - RLS Policies (Auto-generated)
-- Generated on: 2026-06-29T02:22:39.127Z
-- ============================================================

-- Table: slip_uploads | Policy: Allow public insert slip_uploads
CREATE POLICY "Allow public insert slip_uploads" ON public.slip_uploads 
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (true);
;

-- Table: slip_uploads | Policy: Allow public select slip_uploads
CREATE POLICY "Allow public select slip_uploads" ON public.slip_uploads 
AS PERMISSIVE FOR SELECT TO public
USING (true)
;

-- Table: slip_uploads | Policy: Allow public update slip_uploads
CREATE POLICY "Allow public update slip_uploads" ON public.slip_uploads 
AS PERMISSIVE FOR UPDATE TO public
USING (true)
;

-- Table: sessions | Policy: Allow admin modify sessions
CREATE POLICY "Allow admin modify sessions" ON public.sessions 
AS PERMISSIVE FOR ALL TO public
USING (true)
;

-- Table: sessions | Policy: Allow public select sessions
CREATE POLICY "Allow public select sessions" ON public.sessions 
AS PERMISSIVE FOR SELECT TO public
USING (true)
;

-- Table: sessions | Policy: Enable insert for anon users
CREATE POLICY "Enable insert for anon users" ON public.sessions 
AS PERMISSIVE FOR INSERT TO anon
WITH CHECK (true);
;

-- Table: sessions | Policy: Enable insert for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON public.sessions 
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (true);
;

-- Table: bookings | Policy: Allow anon insert bookings
CREATE POLICY "Allow anon insert bookings" ON public.bookings 
AS PERMISSIVE FOR INSERT TO anon
WITH CHECK (true);
;

-- Table: bookings | Policy: Allow anon read bookings
CREATE POLICY "Allow anon read bookings" ON public.bookings 
AS PERMISSIVE FOR SELECT TO anon
USING (true)
;

-- Table: bookings | Policy: Allow public insert bookings
CREATE POLICY "Allow public insert bookings" ON public.bookings 
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (true);
;

-- Table: bookings | Policy: Allow public select bookings
CREATE POLICY "Allow public select bookings" ON public.bookings 
AS PERMISSIVE FOR SELECT TO public
USING (true)
;

-- Table: bookings | Policy: Allow public update bookings
CREATE POLICY "Allow public update bookings" ON public.bookings 
AS PERMISSIVE FOR UPDATE TO public
USING (true)
;

-- Table: parents | Policy: Allow public insert parents
CREATE POLICY "Allow public insert parents" ON public.parents 
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (true);
;

-- Table: parents | Policy: Allow public select parents
CREATE POLICY "Allow public select parents" ON public.parents 
AS PERMISSIVE FOR SELECT TO public
USING (true)
;

-- Table: parents | Policy: Allow public update parents
CREATE POLICY "Allow public update parents" ON public.parents 
AS PERMISSIVE FOR UPDATE TO public
USING (true)
;

-- Table: packages | Policy: Allow public insert packages
CREATE POLICY "Allow public insert packages" ON public.packages 
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (true);
;

-- Table: packages | Policy: Allow public select packages
CREATE POLICY "Allow public select packages" ON public.packages 
AS PERMISSIVE FOR SELECT TO public
USING (true)
;

-- Table: packages | Policy: Allow public update packages
CREATE POLICY "Allow public update packages" ON public.packages 
AS PERMISSIVE FOR UPDATE TO public
USING (true)
;

-- Table: children | Policy: Allow public insert children
CREATE POLICY "Allow public insert children" ON public.children 
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (true);
;

-- Table: children | Policy: Allow public select children
CREATE POLICY "Allow public select children" ON public.children 
AS PERMISSIVE FOR SELECT TO public
USING (true)
;

-- Table: children | Policy: Allow public update children
CREATE POLICY "Allow public update children" ON public.children 
AS PERMISSIVE FOR UPDATE TO public
USING (true)
;

-- Table: package_options | Policy: Allow admin all access to packages
CREATE POLICY "Allow admin all access to packages" ON public.package_options 
AS PERMISSIVE FOR ALL TO public
USING (true)
;

-- Table: package_options | Policy: Allow public read access to active packages
CREATE POLICY "Allow public read access to active packages" ON public.package_options 
AS PERMISSIVE FOR SELECT TO public
USING ((is_active = true))
;

-- Table: credit_transactions | Policy: Parents can view own transactions
CREATE POLICY "Parents can view own transactions" ON public.credit_transactions 
AS PERMISSIVE FOR SELECT TO public
USING (((parent_id)::text = (auth.uid())::text))
;

