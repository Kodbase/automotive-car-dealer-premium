ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS reschedule_count int NOT NULL DEFAULT 0;