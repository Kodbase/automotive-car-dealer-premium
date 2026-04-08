create type log_type as enum (
  'booking_created',
  'booking_cancelled',
  'status_changed',
  'admin_action',
  'staff_action',
  'slot_reassigned'
);

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  type log_type not null,
  actor_id uuid references public.users(id),
  target_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.logs enable row level security;

-- IMMUTABLE: update ve delete tamamen kapalı
create rule logs_no_update as on update to public.logs do instead nothing;
create rule logs_no_delete as on delete to public.logs do instead nothing;