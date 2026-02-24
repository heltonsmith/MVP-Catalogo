-- =============================================================
-- SISTEMA DE TICKETS DE SOPORTE - KTALOOG
-- Pega este script completo en el SQL Editor de Supabase
-- =============================================================

-- ─────────────────────────────────────────────
-- 0. PREPARACIÓN: Asegurar tabla profiles y columnas
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';

-- Asegurar que is_admin considere super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- 0.1 STORAGE: Bucket para adjuntos de soporte
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage (Público para lectura, Autenticado para subida)
DROP POLICY IF EXISTS "Public Access Support" ON storage.objects;
CREATE POLICY "Public Access Support" ON storage.objects FOR SELECT USING (bucket_id = 'support-attachments');

DROP POLICY IF EXISTS "Authenticated Upload Support" ON storage.objects;
CREATE POLICY "Authenticated Upload Support" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'support-attachments' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- 1. ENUM: estado del ticket
-- ─────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('pendiente', 'en_proceso', 'respondida', 'finalizada');
    END IF;
END $$;

-- ─────────────────────────────────────────────
-- 2. TABLA: support_tickets
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL,
    company_id  UUID,
    type        TEXT NOT NULL DEFAULT 'soporte',         -- soporte | reclamo | felicitaciones | consulta
    subject     TEXT NOT NULL,
    description TEXT NOT NULL,
    photos      TEXT[] DEFAULT '{}',                     -- URLs de imágenes adjuntas
    status      ticket_status NOT NULL DEFAULT 'pendiente',
    is_deleted_by_user BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,

    CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT support_tickets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL
);

-- Asegurar relaciones para tablas existentes
DO $$
BEGIN
    -- Fix user_id relation
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets' AND table_schema = 'public') THEN
        ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;
        ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_company_id_fkey;
        ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id   ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status    ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- ─────────────────────────────────────────────
-- 3. TABLA: ticket_messages
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL,   -- 'client' | 'admin'
    text      TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at);

-- ─────────────────────────────────────────────
-- 4. RLS: support_tickets
-- ─────────────────────────────────────────────
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- El dueño del ticket puede ver/editar/eliminar su propio ticket
DROP POLICY IF EXISTS "ticket_owner_select"   ON public.support_tickets;
DROP POLICY IF EXISTS "ticket_owner_insert"   ON public.support_tickets;
DROP POLICY IF EXISTS "ticket_owner_delete"   ON public.support_tickets;
DROP POLICY IF EXISTS "admin_all_tickets"     ON public.support_tickets;

CREATE POLICY "ticket_owner_select" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ticket_owner_insert" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ticket_owner_delete" ON public.support_tickets
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "ticket_owner_update" ON public.support_tickets
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin puede ver/actualizar/eliminar todos los tickets
CREATE POLICY "admin_all_tickets" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'super_admin')
        )
    );

-- ─────────────────────────────────────────────
-- 5. RLS: ticket_messages
-- ─────────────────────────────────────────────
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ticket_msg_participant_select" ON public.ticket_messages;
DROP POLICY IF EXISTS "ticket_msg_participant_insert" ON public.ticket_messages;
DROP POLICY IF EXISTS "admin_all_ticket_messages"     ON public.ticket_messages;

-- El dueño del ticket puede ver sus mensajes
CREATE POLICY "ticket_msg_participant_select" ON public.ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_id
              AND user_id = auth.uid()
        )
    );

-- El dueño podrá insertar mensajes en sus tickets
CREATE POLICY "ticket_msg_participant_insert" ON public.ticket_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_id
              AND user_id = auth.uid()
        )
    );

-- Admin full access
CREATE POLICY "admin_all_ticket_messages" ON public.ticket_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'super_admin')
        )
    );

-- ─────────────────────────────────────────────
-- 6. Actualizar updated_at automáticamente
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ticket_updated_at ON public.support_tickets;
CREATE TRIGGER trg_ticket_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_support_ticket_updated_at();

-- ─────────────────────────────────────────────
-- 7. FUNCIÓN HELPER: obtener admin principal
--    (el primer usuario con role admin/super_admin)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_user_id()
RETURNS UUID AS $$
DECLARE
    admin_uid UUID;
BEGIN
    SELECT id INTO admin_uid
    FROM public.profiles
    WHERE role IN ('admin', 'super_admin')
    ORDER BY created_at ASC
    LIMIT 1;
    RETURN admin_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- 8. TRIGGER: Notificar al ADMIN cuando se crea un ticket
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_admin_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
    admin_uid       UUID;
    customer_name   TEXT;
    customer_avatar TEXT;
BEGIN
    -- Obtener admin
    admin_uid := get_admin_user_id();
    IF admin_uid IS NULL THEN RETURN NEW; END IF;

    -- Obtener datos del cliente
    SELECT full_name, avatar_url
    INTO customer_name, customer_avatar
    FROM public.profiles
    WHERE id = NEW.user_id;

    customer_name := COALESCE(customer_name, 'Un cliente');

    INSERT INTO public.notifications (user_id, type, title, content, metadata)
    VALUES (
        admin_uid,
        'system',
        '🎫 Nuevo ticket de soporte',
        customer_name || ' ha abierto un ticket: "' || NEW.subject || '"',
        jsonb_build_object(
            'ticket_id',      NEW.id,
            'customer_id',    NEW.user_id,
            'customer_name',  customer_name,
            'actor_avatar',   customer_avatar,
            'ticket_type',    NEW.type,
            'ticket_subject', NEW.subject,
            'comment',        NEW.description
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admin_new_ticket ON public.support_tickets;
CREATE TRIGGER trg_notify_admin_new_ticket
    AFTER INSERT ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION notify_admin_new_ticket();

-- ─────────────────────────────────────────────
-- 9. TRIGGER: Notificar al CLIENTE cuando el admin responde
--    y al ADMIN cuando el cliente responde
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_ticket_message()
RETURNS TRIGGER AS $$
DECLARE
    ticket          RECORD;
    admin_uid       UUID;
    sender_name     TEXT;
    sender_avatar   TEXT;
    recipient_uid   UUID;
    notif_title     TEXT;
    notif_content   TEXT;
BEGIN
    -- Cargar ticket
    SELECT * INTO ticket FROM public.support_tickets WHERE id = NEW.ticket_id;
    IF ticket IS NULL THEN RETURN NEW; END IF;

    admin_uid := get_admin_user_id();

    -- Datos del emisor
    SELECT full_name, avatar_url
    INTO sender_name, sender_avatar
    FROM public.profiles
    WHERE id = NEW.sender_id;

    sender_name := COALESCE(sender_name, 'Soporte');

    IF NEW.sender_role = 'admin' THEN
        -- Admin respondió → notificar al cliente
        recipient_uid   := ticket.user_id;
        notif_title     := '💬 Soporte respondió tu ticket';
        notif_content   := 'El equipo de Soporte Ktaloog respondió tu ticket "' || ticket.subject || '"';
    ELSE
        -- Cliente respondió → notificar al admin
        recipient_uid   := admin_uid;
        notif_title     := '💬 Nueva respuesta en ticket';
        notif_content   := sender_name || ' respondió en el ticket "' || ticket.subject || '"';
    END IF;

    IF recipient_uid IS NULL THEN RETURN NEW; END IF;

    INSERT INTO public.notifications (user_id, type, title, content, metadata)
    VALUES (
        recipient_uid,
        'system',
        notif_title,
        notif_content,
        jsonb_build_object(
            'ticket_id',      NEW.ticket_id,
            'sender_id',      NEW.sender_id,
            'sender_name',    sender_name,
            'actor_avatar',   sender_avatar,
            'sender_role',    NEW.sender_role,
            'ticket_subject', ticket.subject,
            'comment',        NEW.text
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_ticket_message ON public.ticket_messages;
CREATE TRIGGER trg_notify_ticket_message
    AFTER INSERT ON public.ticket_messages
    FOR EACH ROW EXECUTE FUNCTION notify_ticket_message();

-- ─────────────────────────────────────────────
-- 10. TRIGGER: Notificar al CLIENTE cuando cambia el estado
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_ticket_status_change()
RETURNS TRIGGER AS $$
DECLARE
    status_labels JSONB := '{
        "pendiente":  "Pendiente",
        "en_proceso": "En Proceso",
        "respondida": "Respondida",
        "finalizada": "Finalizada"
    }'::jsonb;
BEGIN
    -- Solo actuar si cambió el status
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    -- Notificar al dueño del ticket
    INSERT INTO public.notifications (user_id, type, title, content, metadata)
    VALUES (
        NEW.user_id,
        'system',
        '🔄 Estado del ticket actualizado',
        'Tu ticket "' || NEW.subject || '" cambió a: ' || (status_labels ->> NEW.status::text),
        jsonb_build_object(
            'ticket_id',      NEW.id,
            'ticket_subject', NEW.subject,
            'old_status',     OLD.status,
            'new_status',     NEW.status,
            'comment',        'Estado cambiado a: ' || (status_labels ->> NEW.status::text)
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_ticket_status ON public.support_tickets;
CREATE TRIGGER trg_notify_ticket_status
    AFTER UPDATE OF status ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION notify_ticket_status_change();

-- ─────────────────────────────────────────────
-- 11. Habilitar Realtime para tickets y mensajes (Seguro contra duplicados)
-- ─────────────────────────────────────────────
DO $$
BEGIN
    -- Agregar support_tickets si no está en la publicación
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'support_tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
    END IF;

    -- Agregar ticket_messages si no está en la publicación
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'ticket_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
    END IF;
END $$;

-- ─────────────────────────────────────────────
-- FIN DEL SCRIPT
-- Verifica las tablas creadas con:
--   SELECT * FROM public.support_tickets LIMIT 5;
--   SELECT * FROM public.ticket_messages LIMIT 5;
-- ─────────────────────────────────────────────
