create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  duration int not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.packages enable row level security;