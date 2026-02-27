-- 1. Asegurar columnas de fecha y estado
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 2. Asegurar que 'active' sea TRUE para productos existentes si es NULL
UPDATE public.products SET active = TRUE WHERE active IS NULL;

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 4. CRITICAL: Asegurar que las políticas RLS permitan lectura pública (incluyendo Edge Functions)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view companies" ON public.companies;
CREATE POLICY "Public view companies" ON public.companies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public view products" ON public.products;
CREATE POLICY "Public view products" ON public.products FOR SELECT USING (true);
