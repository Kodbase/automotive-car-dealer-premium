-- ─────────────────────────────────────
-- USERS
-- ─────────────────────────────────────

-- Kullanıcı sadece kendi profilini okuyabilir
create policy "users: kendi profilini okur"
  on public.users for select
  using (auth.uid() = id);

-- Kullanıcı sadece kendi profilini güncelleyebilir
create policy "users: kendi profilini günceller"
  on public.users for update
  using (auth.uid() = id);

-- Yeni kullanıcı kaydı (signup sonrası insert)
create policy "users: kayıt olabilir"
  on public.users for insert
  with check (auth.uid() = id);

-- Admin herkesi görebilir
create policy "users: admin herkesi görür"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────

-- Kullanıcı sadece kendi booking'lerini görür
create policy "bookings: kendi rezervasyonlarını görür"
  on public.bookings for select
  using (auth.uid() = user_id);

-- Kullanıcı booking oluşturabilir
create policy "bookings: oluşturabilir"
  on public.bookings for insert
  with check (auth.uid() = user_id);

-- Staff ve admin tüm booking'leri görür
create policy "bookings: staff ve admin hepsini görür"
  on public.bookings for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Staff ve admin status güncelleyebilir
create policy "bookings: staff ve admin günceller"
  on public.bookings for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- ─────────────────────────────────────
-- SLOTS
-- ─────────────────────────────────────

-- Herkes slotları görebilir (randevu almak için)
create policy "slots: herkes okuyabilir"
  on public.slots for select
  using (true);

-- Sadece admin slot oluşturabilir
create policy "slots: admin oluşturur"
  on public.slots for insert
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Sadece admin ve sistem slot güncelleyebilir
create policy "slots: admin günceller"
  on public.slots for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─────────────────────────────────────
-- PACKAGES
-- ─────────────────────────────────────

-- Herkes aktif paketleri görebilir
create policy "packages: herkes aktif paketleri görür"
  on public.packages for select
  using (is_active = true);

-- Admin tüm paketleri görür
create policy "packages: admin hepsini görür"
  on public.packages for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admin paket oluşturur ve günceller
create policy "packages: admin yönetir"
  on public.packages for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

  CREATE POLICY "package_features: herkes aktif paket özelliklerini görür"
  ON public.package_features FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.packages WHERE id = package_id AND is_active = true
  ));

CREATE POLICY "package_features: admin yönetir"
  ON public.package_features FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ─────────────────────────────────────
-- LOCATIONS
-- ─────────────────────────────────────

-- Herkes aktif lokasyonları görebilir
create policy "locations: herkes aktif lokasyonları görür"
  on public.locations for select
  using (is_active = true);

-- Admin lokasyon yönetir
create policy "locations: admin yönetir"
  on public.locations for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─────────────────────────────────────
-- LOGS
-- ─────────────────────────────────────

-- Kullanıcı kendi loglarını görür
create policy "logs: kendi loglarını görür"
  on public.logs for select
  using (auth.uid() = actor_id);

-- Staff ve admin tüm logları görür
create policy "logs: staff ve admin hepsini görür"
  on public.logs for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Sadece sistem log yazabilir (service role)
create policy "logs: sadece sistem yazar"
  on public.logs for insert
  with check (auth.role() = 'service_role');

-- ─────────────────────────────────────
-- BLOCKED_PLATES
-- ─────────────────────────────────────

-- Staff ve admin görebilir
create policy "blocked_plates: staff ve admin görür"
  on public.blocked_plates for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Sadece sistem ekleyebilir
create policy "blocked_plates: sadece sistem ekler"
  on public.blocked_plates for insert
  with check (auth.role() = 'service_role');

-- ─────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────

-- Herkes okuyabilir (working hours, slot duration vs.)
create policy "settings: herkes okur"
  on public.settings for select
  using (true);

-- Sadece admin güncelleyebilir
create policy "settings: admin günceller"
  on public.settings for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

  