-- Production Code Audit: Performance Optimization Indexes
-- Add B-Tree indexes to foreign keys to speed up joins and cascading deletes

CREATE INDEX IF NOT EXISTS idx_bookings_parent_id ON public.bookings (parent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_child_id ON public.bookings (child_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session_id ON public.bookings (session_id);

CREATE INDEX IF NOT EXISTS idx_packages_parent_id ON public.packages (parent_id);

CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children (parent_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_parent_id ON public.credit_transactions (parent_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_package_id ON public.credit_transactions (package_id);

CREATE INDEX IF NOT EXISTS idx_slip_uploads_parent_id ON public.slip_uploads (parent_id);
