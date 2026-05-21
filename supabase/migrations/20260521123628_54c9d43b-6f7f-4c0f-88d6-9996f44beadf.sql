
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Registrations
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Public can register
CREATE POLICY "anyone can register" ON public.registrations
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Public can read registrations (needed to poll approval by email; minimal PII)
CREATE POLICY "anyone can read registrations" ON public.registrations
  FOR SELECT TO anon, authenticated USING (true);
-- Only admins can modify
CREATE POLICY "admins can update registrations" ON public.registrations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins can delete registrations" ON public.registrations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Q&A messages
CREATE TABLE public.qa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.qa_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read qa" ON public.qa_messages
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone can insert qa" ON public.qa_messages
  FOR INSERT TO anon, authenticated WITH CHECK (char_length(question) > 0 AND char_length(question) <= 500);
CREATE POLICY "admins can delete qa" ON public.qa_messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Livestream config (single row)
CREATE TABLE public.livestream_config (
  id INT PRIMARY KEY DEFAULT 1,
  embed_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE public.livestream_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.livestream_config (id, embed_url) VALUES (1, '');

CREATE POLICY "anyone can read config" ON public.livestream_config
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins can update config" ON public.livestream_config
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.qa_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_config;
