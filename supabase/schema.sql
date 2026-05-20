create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  legal_name text not null,
  cnpj text not null,
  responsible_name text,
  phone text,
  email text,
  effluent_type text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  sampled_at date not null,
  ph numeric,
  dqo numeric,
  dbo numeric,
  turbidity numeric,
  oils_and_greases numeric,
  settleable_solids numeric,
  flow_rate numeric,
  temperature numeric,
  observations text,
  created_at timestamptz not null default now()
);

create table if not exists public.chemical_products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  product_name text not null,
  product_type text,
  quantity_used numeric,
  cost numeric,
  unit_cost numeric,
  monthly_cost numeric,
  current_stock numeric,
  used_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  company_snapshot jsonb,
  analysis_history jsonb,
  charts jsonb,
  diagnosis jsonb,
  technical_recommendations jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.analyses enable row level security;
alter table public.chemical_products enable row level security;
alter table public.reports enable row level security;

create policy "Users can manage own profile"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can manage own companies"
  on public.companies
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage analyses from own companies"
  on public.analyses
  for all
  using (
    exists (
      select 1 from public.companies
      where companies.id = analyses.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.companies
      where companies.id = analyses.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Users can manage chemicals from own companies"
  on public.chemical_products
  for all
  using (
    exists (
      select 1 from public.companies
      where companies.id = chemical_products.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.companies
      where companies.id = chemical_products.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Users can manage reports from own companies"
  on public.reports
  for all
  using (
    exists (
      select 1 from public.companies
      where companies.id = reports.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.companies
      where companies.id = reports.company_id
      and companies.user_id = auth.uid()
    )
  );
