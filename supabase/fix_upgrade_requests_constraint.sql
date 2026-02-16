-- 1. Limpiar duplicados existentes (dejar solo la solicitud más reciente por tienda)
DELETE FROM public.upgrade_requests a
USING public.upgrade_requests b
WHERE a.status = 'pending' 
  AND b.status = 'pending'
  AND a.company_id = b.company_id 
  AND a.created_at < b.created_at;

-- 2. Crear el índice único para prevenir futuros duplicados
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_upgrade_per_company 
ON public.upgrade_requests (company_id) 
WHERE (status = 'pending');
