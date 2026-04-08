-- Supabase'de çalıştır
-- tracking_sessions tablosu: 48 saatlik oturum token'ları

CREATE TABLE public.tracking_sessions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL,
  token      text        NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index: token ile hızlı arama
CREATE INDEX tracking_sessions_token_idx ON public.tracking_sessions (token);

-- Index: email ile arama
CREATE INDEX tracking_sessions_email_idx ON public.tracking_sessions (email);

-- RLS: sadece service_role erişebilir (API'den supabaseAdmin ile erişiyoruz)
ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tracking_sessions: sadece sistem yönetir"
  ON public.tracking_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Opsiyonel: süresi dolmuş session'ları otomatik temizleyen cron
-- (Supabase Dashboard → Database → Extensions → pg_cron aktif et)
-- SELECT cron.schedule('cleanup-tracking-sessions', '0 3 * * *',
--   $$DELETE FROM public.tracking_sessions WHERE expires_at < now()$$
-- );