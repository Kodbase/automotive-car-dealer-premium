-- Atomic booking fonksiyonu (race condition önler)
create or replace function book_slot(
  p_user_id uuid,
  p_plate text,
  p_package_id uuid,
  p_location_id uuid,
  p_slot_time timestamptz
)
returns uuid
language plpgsql
as $$
declare
  v_slot_id uuid;
  v_booking_id uuid;
  v_capacity int;
  v_reserved int;
begin
  -- Slot'u kilitle
  select id, capacity, reserved_count
  into v_slot_id, v_capacity, v_reserved
  from public.slots
  where slot_time = p_slot_time
  for update;

  -- Kapasite kontrol
  if v_reserved >= v_capacity then
    raise exception 'SLOT_FULL';
  end if;

  -- Booking oluştur
  insert into public.bookings (user_id, plate, package_id, location_id, slot_time)
  values (p_user_id, p_plate, p_package_id, p_location_id, p_slot_time)
  returning id into v_booking_id;

  -- Slot sayacını artır
  update public.slots
  set reserved_count = reserved_count + 1
  where id = v_slot_id;

  return v_booking_id;
end;
$$;