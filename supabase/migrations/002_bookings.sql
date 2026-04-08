create type booking_status as enum (
  'WAITING',
  'ACCEPTED',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  plate text not null,
  package_id uuid not null,
  location_id uuid not null,
  slot_time timestamptz not null,
  status booking_status not null default 'WAITING',
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;