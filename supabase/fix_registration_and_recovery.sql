-- ================================================================
-- FIX: RESTAURAR REGISTRO AUTOMÁTICO DE TIENDAS Y RECUPERACIÓN
-- ================================================================

-- 1. Extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Función mejorada para generar slugs únicos (evita errores en insert)
CREATE OR REPLACE FUNCTION public.generate_slug(str text)
RETURNS text AS $$
DECLARE
  v_slug text;
  original_slug text;
  counter integer := 1;
BEGIN
  -- Convertir a minúsculas y limpiar caracteres no alfanuméricos
  v_slug := lower(regexp_replace(str, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  
  IF v_slug = '' OR v_slug IS NULL THEN
     v_slug := 'store-' || substr(md5(random()::text), 1, 8);
  END IF;

  original_slug := v_slug;

  -- Bucle para asegurar unicidad (máximo 10 intentos para evitar loops infinitos en triggers)
  WHILE EXISTS (SELECT 1 FROM public.companies WHERE companies.slug = v_slug) AND counter < 10 LOOP
    v_slug := original_slug || '-' || substr(md5(random()::text), 1, 4);
    counter := counter + 1;
  END LOOP;

  RETURN v_slug;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Restaurar Función Principal de Registro (handle_new_user)
-- Esta función ahora crea Perfil Y Tienda si el rol es 'owner'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_business_name text;
  v_slug text;
BEGIN
  -- Extraer Rol (por defecto client)
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

  -- A. Insertar Perfil
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  -- B. Auto-crear Tienda si es owner y negocio tiene nombre
  v_business_name := NEW.raw_user_meta_data->>'businessName';
  
  IF v_role = 'owner' AND v_business_name IS NOT NULL THEN
     v_slug := public.generate_slug(v_business_name);
     
     INSERT INTO public.companies (
         user_id,
         name,
         slug,
         whatsapp,
         business_type,
         description,
         address,
         features,
         socials,
         region,
         city,
         commune,
         is_online
     ) VALUES (
         NEW.id,
         v_business_name,
         v_slug,
         COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
         COALESCE(NEW.raw_user_meta_data->>'businessType', 'retail'),
         COALESCE(NEW.raw_user_meta_data->>'description', 'Bienvenidos a ' || v_business_name),
         COALESCE(NEW.raw_user_meta_data->>'address', ''),
         jsonb_build_object('cartEnabled', COALESCE(NEW.raw_user_meta_data->>'businessType', 'retail') != 'restaurant'),
         jsonb_build_object(
             'instagram', COALESCE(NEW.raw_user_meta_data->>'instagram', ''),
             'tiktok', COALESCE(NEW.raw_user_meta_data->>'tiktok', ''),
             'twitter', COALESCE(NEW.raw_user_meta_data->>'twitter', ''),
             'linkedin', COALESCE(NEW.raw_user_meta_data->>'linkedin', ''),
             'website', COALESCE(NEW.raw_user_meta_data->>'website', '')
         ),
         COALESCE(NEW.raw_user_meta_data->>'region', ''),
         COALESCE(NEW.raw_user_meta_data->>'city', ''),
         COALESCE(NEW.raw_user_meta_data->>'commune', ''),
         COALESCE((NEW.raw_user_meta_data->>'isOnline')::boolean, false)
     )
     ON CONFLICT (user_id) DO NOTHING; -- No duplicar si ya existe
     
     -- Actualizar RUT en perfil si se proporcionó
     IF NEW.raw_user_meta_data->>'rut' IS NOT NULL THEN
         UPDATE public.profiles SET rut = NEW.raw_user_meta_data->>'rut' WHERE id = NEW.id;
     END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Asegurar el Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. SCRIPT DE RECUPERACIÓN (Reparar usuarios existentes sin tienda)
-- Este bloque identifica dueños sin tienda y les crea una usando su metadata de registro
DO $$
DECLARE
    r RECORD;
    v_slug text;
BEGIN
    FOR r IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        JOIN public.profiles p ON u.id = p.id
        WHERE p.role = 'owner'
        AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.user_id = u.id)
    LOOP
        -- Robustez: Probar diferentes nombres de claves posibles en la metadata
        DECLARE
            v_biz_name text;
        BEGIN
            v_biz_name := COALESCE(
                r.raw_user_meta_data->>'businessName', 
                r.raw_user_meta_data->>'business_name',
                'Mi Tienda KT'
            );
            
            v_slug := public.generate_slug(v_biz_name);
            
            INSERT INTO public.companies (
                user_id, name, slug, whatsapp, business_type, description, address, region, city, commune, is_online, socials, features
            ) VALUES (
                r.id,
                v_biz_name,
                v_slug,
                COALESCE(r.raw_user_meta_data->>'whatsapp', r.raw_user_meta_data->>'phone', ''),
                COALESCE(r.raw_user_meta_data->>'businessType', r.raw_user_meta_data->>'business_type', 'retail'),
                COALESCE(r.raw_user_meta_data->>'description', 'Bienvenidos'),
                COALESCE(r.raw_user_meta_data->>'address', ''),
                COALESCE(r.raw_user_meta_data->>'region', ''),
                COALESCE(r.raw_user_meta_data->>'city', ''),
                COALESCE(r.raw_user_meta_data->>'commune', ''),
                COALESCE((r.raw_user_meta_data->>'isOnline')::boolean, (r.raw_user_meta_data->>'is_online')::boolean, false),
                jsonb_build_object(
                    'instagram', COALESCE(r.raw_user_meta_data->>'instagram', ''),
                    'tiktok', COALESCE(r.raw_user_meta_data->>'tiktok', ''),
                    'website', COALESCE(r.raw_user_meta_data->>'website', '')
                ),
                jsonb_build_object('cartEnabled', true)
            );
            
            RAISE NOTICE 'Tienda recuperada para usuario: %', r.email;
        END;
    END LOOP;
END $$;
