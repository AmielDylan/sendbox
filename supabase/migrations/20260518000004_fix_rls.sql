-- Fix RLS issues identified by supabase db lint
-- 1. app_settings : RLS disabled (CRITICAL) — table stores edge function secrets
-- 2. announcements : "Auth RLS Initialization Plan" — auth.uid() evaluated per row
-- 3. bookings      : "Auth RLS Initialization Plan" — same root cause

-- 1. Enable RLS on app_settings (no policies needed: service_role bypasses RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 2. Fix announcements user policies (replace auth.uid() with (SELECT auth.uid()))
DROP POLICY IF EXISTS "Users can update their own announcements" ON public.announcements;
DROP POLICY IF EXISTS "Users can delete their own announcements" ON public.announcements;

CREATE POLICY "Users can update their own announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (traveler_id = (SELECT auth.uid()))
  WITH CHECK (traveler_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (traveler_id = (SELECT auth.uid()));

-- 3. Fix bookings user policies (replace auth.uid() with (SELECT auth.uid()))
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (
    sender_id = (SELECT auth.uid()) OR traveler_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (
    sender_id = (SELECT auth.uid()) OR traveler_id = (SELECT auth.uid())
  )
  WITH CHECK (
    sender_id = (SELECT auth.uid()) OR traveler_id = (SELECT auth.uid())
  );
