create table public.blocked_plates (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  blocked_until timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.blocked_plates enable row level security;