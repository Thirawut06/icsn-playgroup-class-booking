-- Migration: 20260701050000_cleanup_weekend_sessions
-- Purpose: Clean up weekend sessions that were accidentally marked as closed by the old bulk_close_days logic.

DO $$
BEGIN
    UPDATE sessions 
    SET is_active = true, theme = NULL
    WHERE EXTRACT(DOW FROM session_date) IN (0, 6)
    AND is_active = false
    AND theme IS NOT NULL;
END;
$$;
