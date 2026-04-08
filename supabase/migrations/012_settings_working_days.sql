INSERT INTO public.settings (key, value) VALUES
  ('working_days', '[1,2,3,4,5]')
ON CONFLICT (key) DO NOTHING;