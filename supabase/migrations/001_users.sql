create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  phone text,
  name text not null,
  role text not null default 'user'
    check (role in ('user', 'staff', 'admin')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;