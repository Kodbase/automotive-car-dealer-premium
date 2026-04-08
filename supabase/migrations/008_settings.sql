create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- Varsayılan ayarlar
insert into public.settings (key, value) values
  ('working_hours', '{"start": "09:00", "end": "18:00"}'),
  ('slot_duration', '30'),
  ('capacity_default', '3'),
  ('cancel_limit_hours', '2'),
  ('max_booking_per_user', '1');