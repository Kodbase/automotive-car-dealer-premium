-- Booking cancel olunca plakayı 2 gün blokla
create or replace function handle_booking_cancel()
returns trigger
language plpgsql
as $$
begin
  if NEW.status = 'CANCELLED' and OLD.status != 'CANCELLED' then
    -- Plaka bloğu ekle
    insert into public.blocked_plates (plate, blocked_until, reason)
    values (NEW.plate, now() + interval '2 days', 'booking_cancelled');

    -- Slot sayacını azalt
    update public.slots
    set reserved_count = greatest(reserved_count - 1, 0)
    where slot_time = NEW.slot_time;
  end if;

  return NEW;
end;
$$;

create trigger on_booking_cancelled
  after update on public.bookings
  for each row
  execute function handle_booking_cancel();

-- Settings güncellenince updated_at yenile
create or replace function update_settings_timestamp()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger on_settings_update
  before update on public.settings
  for each row
  execute function update_settings_timestamp();



  CREATE OR REPLACE FUNCTION handle_booking_reschedule()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slot_time != OLD.slot_time AND NEW.status != 'CANCELLED' THEN
    UPDATE public.slots
    SET reserved_count = GREATEST(reserved_count - 1, 0)
    WHERE slot_time = OLD.slot_time;

    UPDATE public.slots
    SET reserved_count = reserved_count + 1
    WHERE slot_time = NEW.slot_time;

    NEW.reschedule_count = OLD.reschedule_count + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_rescheduled
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_reschedule();