-- Solo deshabilitamos el trigger, no borramos la función por si se quiere re-usar la lógica
DROP TRIGGER IF EXISTS on_new_product ON public.products;
