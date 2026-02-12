-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create companies table
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  logo text,
  banner text,
  whatsapp text,
  rating numeric default 0,
  socials jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create categories table
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  sku text,
  price numeric not null default 0,
  stock integer default 0,
  rating numeric default 0,
  description text,
  weight text,
  size text,
  category_id uuid references public.categories(id),
  company_id uuid references public.companies(id),
  views integer default 0,
  quotes_count integer default 0,
  images text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create quotes table
create table public.quotes (
  id uuid primary key default uuid_generate_v4(),
  customer_name text,
  total numeric default 0,
  status text default 'pending', -- pending, accepted, expired
  platform text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create quote items table
create table public.quote_items (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text, -- Store name in case product is deleted/changed
  quantity integer default 1,
  price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reviews table (polymorphic-ish or separate? Let's go with separate for simplicity or a clear link)
-- For MVP, let's just link to products for now as per mock data on products.
-- Mock data also has reviews on companies.
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_name text,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  product_id uuid references public.products(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint target_check check (
    (product_id is not null and company_id is null) or
    (product_id is null and company_id is not null)
  )
);

-- Enable Row Level Security
alter table public.companies enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.reviews enable row level security;

-- Create policies (Public read, authenticated write is a good start, or public write for some if no auth yet)
-- For MVP Catalogo, assuming public read for catalog.
create policy "Public read for companies" on public.companies for select using (true);
create policy "Public read for categories" on public.categories for select using (true);
create policy "Public read for products" on public.products for select using (true);
create policy "Public read for reviews" on public.reviews for select using (true);

-- Quotes might be private or public depending on use case. Currently assuming public creation ok for "requesting a quote"?
-- If it's a backend for an admin, we need auth.
-- For now, allow public to create quotes (like an order).
create policy "Public create quotes" on public.quotes for insert with check (true);
create policy "Public create quote items" on public.quote_items for insert with check (true);

-- Allow public to create reviews?
create policy "Public create reviews" on public.reviews for insert with check (true);

