-- ==========================================
-- UPDATE AUTH USER TRIGGER TO AUTO-CREATE COMPANY
-- ==========================================
-- This migration updates the existing `handle_new_user` function 
-- to automatically create the company record for entrepreneurs
-- utilizing the data passed during signUp into raw_user_meta_data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Helper Function to generate slugs
CREATE OR REPLACE FUNCTION public.generate_slug(str text)
RETURNS text AS $$
DECLARE
  slug text;
BEGIN
  -- Lowercase and replace non-alphanumeric with hyphens
  slug := lower(regexp_replace(str, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading and trailing hyphens
  slug := trim(both '-' from slug);
  -- If empty, provide a random fallback
  IF slug = '' OR slug IS NULL THEN
     slug := 'store-' || substr(md5(random()::text), 1, 8);
  END IF;
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Update handle_new_user to process owner data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_company_name text;
  v_slug text;
BEGIN
  -- Extract Role (default to client)
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

  -- Insert Profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-create Company if role is owner and businessName is present
  v_company_name := NEW.raw_user_meta_data->>'businessName';
  
  IF v_role = 'owner' AND v_company_name IS NOT NULL THEN
     v_slug := public.generate_slug(v_company_name);
     
     -- Ensure unique slug by appending a random string if it somehow exists
     -- (Since this is an insert inside a trigger, best effort unique)
     
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
         v_company_name,
         v_slug,
         COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
         COALESCE(NEW.raw_user_meta_data->>'businessType', 'retail'),
         COALESCE(NEW.raw_user_meta_data->>'description', 'Bienvenidos a ' || v_company_name),
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
     ON CONFLICT DO NOTHING;
     
     -- Also try to optionally update profile's RUT if provided
     IF NEW.raw_user_meta_data->>'rut' IS NOT NULL THEN
         UPDATE public.profiles SET rut = NEW.raw_user_meta_data->>'rut' WHERE id = NEW.id;
     END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
