-- ==========================================
-- 1. ESTRUCTURA Y RECUPERACIÓN DE PERFILES
-- ==========================================
-- extension for uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Asegurar que existan las columnas en profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rut TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para perfiles
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Función is_admin robusta (SECURITY DEFINER para evitar recursión en RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RECUPERACIÓN: Crear perfiles para usuarios existentes que no tienen uno
INSERT INTO public.profiles (id, email, full_name, created_at)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name',
    COALESCE(created_at, now())
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- TRIGGER: Asegurar que nuevos usuarios tengan perfil automáticamente con el rol correcto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- POLÍTICAS DE PERFILES (SIN RECURSIÓN)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Usamos public.is_admin() que es SECURITY DEFINER para evitar loops infinitos
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- MIGRACIÓN: Corregir roles de dueños de tienda que quedaron como 'user' o 'client'
UPDATE public.profiles
SET role = 'owner'
WHERE id IN (SELECT user_id FROM public.companies)
AND role != 'admin' AND role != 'super_admin';

-- ==========================================
-- 2. TABLA DE COTIZACIONES (whatsapp_quotes)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.whatsapp_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID,
    company_id UUID,
    customer_name TEXT,
    customer_email TEXT,
    content TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'pending'
);

-- Forzar FKs en whatsapp_quotes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'whatsapp_quotes_user_id_fkey') THEN
        ALTER TABLE public.whatsapp_quotes ADD CONSTRAINT whatsapp_quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'whatsapp_quotes_company_id_fkey') THEN
        ALTER TABLE public.whatsapp_quotes ADD CONSTRAINT whatsapp_quotes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- RLS whatsapp_quotes
ALTER TABLE public.whatsapp_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias cotizaciones" ON public.whatsapp_quotes;
DROP POLICY IF EXISTS "Los usuarios pueden insertar sus cotizaciones" ON public.whatsapp_quotes;
CREATE POLICY "Los usuarios pueden ver sus propias cotizaciones" ON public.whatsapp_quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden insertar sus cotizaciones" ON public.whatsapp_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 3. TABLA DE FAVORITOS (favorites)
-- ==========================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='favorites' AND column_name='target_id') THEN
        ALTER TABLE public.favorites RENAME COLUMN target_id TO company_id;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID,
    company_id UUID,
    type TEXT,
    user_category TEXT,
    UNIQUE(user_id, company_id)
);

-- Asegurar columnas
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS user_category TEXT;

-- Forzar FKs en favorites
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'favorites_user_id_fkey') THEN
        ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'favorites_company_id_fkey') THEN
        ALTER TABLE public.favorites ADD CONSTRAINT favorites_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- RLS favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios pueden ver sus favoritos" ON public.favorites;
DROP POLICY IF EXISTS "Usuarios pueden gestionar sus favoritos" ON public.favorites;
CREATE POLICY "Usuarios pueden ver sus favoritos" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden gestionar sus favoritos" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 4. ALMACENAMIENTO (Storage Buckets)
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Limpiar políticas
DROP POLICY IF EXISTS "Acceso Publico Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Subida Avatars Usuario" ON storage.objects;
DROP POLICY IF EXISTS "Actualizacion Avatars Usuario" ON storage.objects;
DROP POLICY IF EXISTS "Acceso Publico Assets" ON storage.objects;
DROP POLICY IF EXISTS "Subida Assets Usuario" ON storage.objects;
DROP POLICY IF EXISTS "Actualizacion Assets Usuario" ON storage.objects;

-- Políticas
CREATE POLICY "Acceso Publico Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Subida Avatars Usuario" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Actualizacion Avatars Usuario" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Acceso Publico Assets" ON storage.objects FOR SELECT USING (bucket_id = 'store-assets');
CREATE POLICY "Subida Assets Usuario" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Actualizacion Assets Usuario" ON storage.objects FOR UPDATE USING (bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ==========================================
-- 5. MENSAJERÍA Y SEGUIDORES
-- ==========================================

-- Tabla de mensajes internos
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_type TEXT NOT NULL, -- 'store' o 'customer'
    is_read BOOLEAN DEFAULT false
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat access" ON public.messages;
CREATE POLICY "Chat access" ON public.messages 
    FOR ALL USING (
        auth.uid() = customer_id OR 
        EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND user_id = auth.uid())
    );

-- Tabla de seguidores
CREATE TABLE IF NOT EXISTS public.store_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'retail',
    UNIQUE(user_id, company_id)
);

ALTER TABLE public.store_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows access" ON public.store_follows;
CREATE POLICY "Follows access" ON public.store_follows 
    FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 6. NOTIFICACIONES Y TIEMPO REAL
-- ==========================================

-- Tabla de notificaciones (Consolidada)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- quote, stock, chat, message, follow, favorite, system
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Habilitar Realtime para notificaciones
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- Función para automatizar notificaciones de mensajes
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    sender_name TEXT;
BEGIN
    -- Determinar quién recibe la notificación
    IF NEW.sender_type = 'customer' THEN
        -- Si el cliente envía, el dueño de la tienda recibe
        SELECT user_id INTO target_user_id FROM public.companies WHERE id = NEW.company_id;
        SELECT COALESCE(full_name, 'Un cliente') INTO sender_name FROM public.profiles WHERE id = NEW.customer_id;
    ELSE
        -- Si la tienda envía, el cliente recibe
        target_user_id := NEW.customer_id;
        SELECT name INTO sender_name FROM public.companies WHERE id = NEW.company_id;
    END IF;

    -- Insertar notificación
    INSERT INTO public.notifications (user_id, type, title, content, metadata)
    VALUES (
        target_user_id,
        'message',
        'Nuevo mensaje de ' || sender_name,
        NEW.content,
        jsonb_build_object(
            'chat_id', CASE WHEN NEW.sender_type = 'customer' THEN NEW.customer_id ELSE NEW.company_id END,
            'company_id', NEW.company_id,
            'customer_id', NEW.customer_id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_message_notification();

-- ASEGURAR COLUMNAS SI YA EXISTÍAN LAS TABLAS
ALTER TABLE public.store_follows ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'retail';
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS user_category TEXT;

-- Función para automatizar notificaciones de Seguidores
CREATE OR REPLACE FUNCTION public.handle_new_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    follower_name TEXT;
BEGIN
    -- Obtener el dueño de la tienda
    SELECT user_id INTO target_user_id FROM public.companies WHERE id = NEW.company_id;
    -- Obtener el nombre del seguidor
    SELECT COALESCE(full_name, 'Un usuario') INTO follower_name FROM public.profiles WHERE id = NEW.user_id;

    -- Insertar notificación
    INSERT INTO public.notifications (user_id, type, title, content, metadata)
    VALUES (
        target_user_id,
        'follow',
        'Nuevo seguidor',
        follower_name || ' ha comenzado a seguir tu tienda.',
        jsonb_build_object('follower_id', NEW.user_id, 'company_id', NEW.company_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_follow ON public.store_follows;
CREATE TRIGGER on_new_follow
    AFTER INSERT ON public.store_follows
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_follow_notification();

-- Función para automatizar notificaciones de Favoritos
CREATE OR REPLACE FUNCTION public.handle_new_favorite_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    fan_name TEXT;
BEGIN
    -- Obtener el dueño de la tienda
    SELECT user_id INTO target_user_id FROM public.companies WHERE id = NEW.company_id;
    -- Obtener el nombre del usuario
    SELECT COALESCE(full_name, 'Un usuario') INTO fan_name FROM public.profiles WHERE id = NEW.user_id;

    -- Insertar notificación
    INSERT INTO public.notifications (user_id, type, title, content, metadata)
    VALUES (
        target_user_id,
        'favorite',
        'Tienda guardada',
        fan_name || ' guardó tu tienda en sus favoritos.',
        jsonb_build_object('user_id', NEW.user_id, 'company_id', NEW.company_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_favorite ON public.favorites;
CREATE TRIGGER on_new_favorite
    AFTER INSERT ON public.favorites
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_favorite_notification();

-- Función para automatizar notificaciones de Nuevos Productos a Seguidores
CREATE OR REPLACE FUNCTION public.handle_new_product_notification()
RETURNS TRIGGER AS $$
DECLARE
    company_name TEXT;
    company_slug TEXT;
BEGIN
    -- Solo notificar si el producto está disponible (opcional, pero recomendado)
    -- Si tu sistema crea borradores primero, descomenta la siguiente línea:
    -- IF NEW.available = false THEN RETURN NEW; END IF;

    -- Obtener el nombre y slug de la tienda
    SELECT COALESCE(name, 'Una tienda'), slug INTO company_name, company_slug FROM public.companies WHERE id = NEW.company_id;

    -- Insertar notificaciones para todos los seguidores
    INSERT INTO public.notifications (user_id, type, title, content, metadata)
    SELECT 
        user_id,
        'stock',
        'Nuevo producto en ' || company_name,
        company_name || ' ha publicado un nuevo producto: ' || COALESCE(NEW.name, 'Producto nuevo'),
        jsonb_build_object(
            'product_id', NEW.id, 
            'product_slug', NEW.slug,
            'company_id', NEW.company_id,
            'company_slug', company_slug
        )
    FROM public.store_follows
    WHERE company_id = NEW.company_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_product ON public.products;
CREATE TRIGGER on_new_product
    AFTER INSERT ON public.products
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_product_notification();

-- Habilitar Realtime para mensajes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;
