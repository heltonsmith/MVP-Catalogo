-- # OPTIMIZACIÓN DE BASE DE DATOS (VERSIÓN REVISADA)

-- 1. LIMPIEZA: upgrade_requests
-- Eliminamos campos que ya existen en profiles/companies para evitar inconsistencias de datos históricos.
-- Los datos se obtendrán mediante JOINs en tiempo real.
ALTER TABLE public.upgrade_requests 
DROP COLUMN IF EXISTS full_name,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS rut,
DROP COLUMN IF EXISTS store_name;

-- 2. ÍNDICES DE RENDIMIENTO:
-- Aseguramos que las búsquedas y JOINs entre tablas de usuarios y tiendas sean óptimos.
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_company_id ON public.favorites(company_id);
CREATE INDEX IF NOT EXISTS idx_store_follows_user_id ON public.store_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_store_follows_company_id ON public.store_follows(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);

-- 3. RESTRICCIONES DE INTEGRIDAD:
-- Evitar que un usuario pueda seguir o marcar como favorita la misma tienda varias veces.

-- Limpieza preventiva de duplicados en store_follows
DELETE FROM public.store_follows a USING public.store_follows b 
WHERE a.id < b.id AND a.user_id = b.user_id AND a.company_id = b.company_id;

-- Limpieza preventiva de duplicados en favorites
DELETE FROM public.favorites a USING public.favorites b 
WHERE a.id < b.id AND a.user_id = b.user_id AND a.company_id = b.company_id;

DO $$ 
BEGIN 
    -- Restricción para store_follows
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_company_follow') THEN
        ALTER TABLE public.store_follows ADD CONSTRAINT unique_user_company_follow UNIQUE (user_id, company_id);
    END IF;

    -- Restricción para favorites
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_company_favorite') THEN
        ALTER TABLE public.favorites ADD CONSTRAINT unique_user_company_favorite UNIQUE (user_id, company_id);
    END IF;
END $$;
