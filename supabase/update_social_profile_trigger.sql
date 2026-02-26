-- Refinar la creación automática de perfiles para capturar datos de Google/Facebook
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url', 
      NEW.raw_user_meta_data->>'picture', 
      ''
    ),
    'client' -- Todo login social se activa por defecto como cliente
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Si el perfil ya existe (ej. era una tienda), no sobreescribimos el rol,
    -- pero sí actualizamos nombre y foto si vienen vacíos.
    full_name = CASE 
      WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' 
      THEN EXCLUDED.full_name 
      ELSE public.profiles.full_name 
    END,
    avatar_url = CASE 
      WHEN public.profiles.avatar_url IS NULL OR public.profiles.avatar_url = '' 
      THEN EXCLUDED.avatar_url 
      ELSE public.profiles.avatar_url 
    END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
