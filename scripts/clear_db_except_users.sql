-- Clear application data while keeping user accounts and profiles.
-- Run in Supabase SQL editor (public schema).

TRUNCATE TABLE public.admin_audit_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.announcements RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.audit_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.bookings RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.messages RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.notifications RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.qr_scan_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.ratings RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.transactions RESTART IDENTITY CASCADE;
