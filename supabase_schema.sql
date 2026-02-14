-- 1. LIMPIEZA TOTAL (Empezar de cero)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;
drop table if exists public.reviews cascade;
drop table if exists public.quote_items cascade;
drop table if exists public.quotes cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop table if exists public.companies cascade;
drop table if exists public.profiles cascade;

-- 2. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 3. PERFILES DE USUARIO (Para Roles)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user', -- 'admin' o 'user'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABLA DE EMPRESAS (Dueños de catálogos)
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text not null unique,
  description text,
  logo text,
  banner text,
  whatsapp text,
  rating numeric default 0,
  plan text default 'free',
  business_type text, -- retail, wholesale, restaurant
  socials jsonb default '{}'::jsonb,
  features jsonb default '{"cartEnabled": true}'::jsonb,
  -- Geographic Data
  region text,
  city text,
  commune text,
  address text,
  -- Metrics & Status
  views_count integer default 0,
  quotes_count integer default 0,
  is_sponsored boolean default false,
  is_online boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger para crear perfil automáticamente al registrarse en Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. CATEGORÍAS
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  slug text not null,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(company_id, slug)
);

-- 6. PRODUCTOS
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  price numeric not null default 0,
  image text,
  stock integer default 0,
  available boolean default true,
  featured boolean default false,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(company_id, slug)
);

-- 7. COTIZACIONES / PEDIDOS
create table public.quotes (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade not null,
  customer_name text not null,
  customer_email text,
  customer_whatsapp text not null,
  total numeric not null,
  status text default 'pending', -- pending, completed, cancelled
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. DETALLE DE COTIZACIONES
create table public.quote_items (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid references public.quotes(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null,
  price_at_time numeric not null
);

-- 9. RESEÑAS
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  customer_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint target_check check (
    (product_id is not null and company_id is null) or
    (product_id is null and company_id is not null)
  )
);

-- 10. SEGURIDAD (RLS)
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.reviews enable row level security;

-- Función para verificar si el usuario es Admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Políticas de Perfiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (is_admin());
create policy "Admins can update all profiles" on public.profiles for update using (is_admin());

-- Políticas Públicas (Lectura para el Catálogo)
create policy "Public view companies" on public.companies for select using (true);
create policy "Public view products" on public.products for select using (true);
create policy "Public view categories" on public.categories for select using (true);
create policy "Public view reviews" on public.reviews for select using (true);

-- Políticas de Empresas
create policy "Users can insert their own company" on public.companies 
  for insert with check (auth.uid() = user_id);

create policy "Owners can update their company" on public.companies 
  for update using (auth.uid() = user_id);

create policy "Admins can manage all companies" on public.companies 
  for all using (is_admin());

-- Gestión de Categorías
create policy "Owners manage categories" on public.categories 
  for all using (exists (
    select 1 from public.companies where id = categories.company_id and user_id = auth.uid()
  ));
create policy "Admins manage categories" on public.categories for all using (is_admin());

-- Gestión de Productos
create policy "Owners manage products" on public.products
  for all using (exists (
    select 1 from public.companies where id = products.company_id and user_id = auth.uid()
  ));
create policy "Admins manage products" on public.products for all using (is_admin());

-- Gestión de Cotizaciones
create policy "Owners view quotes" on public.quotes
  for select using (exists (
    select 1 from public.quote_items qi
    join public.products p on qi.product_id = p.id
    join public.companies c on p.company_id = c.id
    where qi.quote_id = public.quotes.id and c.user_id = auth.uid()
  ));
*/
create policy "Owners view own quotes" on public.quotes
  for select using (exists (
    select 1 from public.companies where id = quotes.company_id and user_id = auth.uid()
  ));
create policy "Admins view quotes" on public.quotes for select using (is_admin());

-- Creación Pública (Cotizaciones y Reseñas)
create policy "Public insert quotes" on public.quotes for insert with check (true);
create policy "Public insert items" on public.quote_items for insert with check (true);
create policy "Public insert reviews" on public.reviews for insert with check (true);

-- 11. SOLICITUDES DE UPGRADE
create table public.upgrade_requests (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade not null,
  requested_plan text not null, -- 'mensual', 'semestral', 'anual'
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.upgrade_requests enable row level security;

create policy "Users can view own upgrade requests" on public.upgrade_requests
  for select using (exists (
    select 1 from public.companies where id = upgrade_requests.company_id and user_id = auth.uid()
  ));

create policy "Users can insert own upgrade requests" on public.upgrade_requests
  for insert with check (exists (
    select 1 from public.companies where id = upgrade_requests.company_id and user_id = auth.uid()
  ));

create policy "Admins can manage all upgrade requests" on public.upgrade_requests
  for all using (is_admin());

-- ==========================================
-- INSTRUCCIONES PARA EL SUPER ADMIN
-- ==========================================
/*
1. Regístrate normalmente en la web con tu email: heltonsmith@hotmail.com
2. Luego de registrarte, ejecuta este comando en el SQL Editor para darte permisos de Super Admin:

UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'heltonsmith@hotmail.com';
*/
