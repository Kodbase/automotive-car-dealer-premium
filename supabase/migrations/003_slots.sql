create table public.slots (
  id uuid primary key default gen_random_uuid(),
  slot_time timestamptz not null unique,
  capacity int not null default 3,
  reserved_count int not null default 0,
  check (reserved_count >= 0),
  check (reserved_count <= capacity),
  created_at timestamptz not null default now()
);

alter table public.slots enable row level security;