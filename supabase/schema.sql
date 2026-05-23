create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
    and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'user'
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  razao_social text,
  cnpj text,
  responsavel text,
  telefone text,
  email text,
  tipo_efluente text,
  endereco text,
  created_at timestamptz not null default now()
);

alter table public.companies add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.companies add column if not exists razao_social text;
alter table public.companies add column if not exists cnpj text;
alter table public.companies add column if not exists responsavel text;
alter table public.companies add column if not exists telefone text;
alter table public.companies add column if not exists email text;
alter table public.companies add column if not exists tipo_efluente text;
alter table public.companies add column if not exists endereco text;
alter table public.companies add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'companies' and column_name = 'legal_name'
  ) then
    alter table public.companies alter column legal_name drop not null;
  end if;
end $$;

create or replace function public.user_owns_company(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.companies
      where id = target_company_id
      and user_id = auth.uid()
    );
$$;

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  data date,
  ph numeric,
  dqo numeric,
  dbo numeric,
  turbidez numeric,
  oleos_graxas numeric,
  solidos_sedimentaveis numeric,
  vazao numeric,
  temperatura numeric,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table public.analyses add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.analyses add column if not exists data date;
alter table public.analyses add column if not exists ph numeric;
alter table public.analyses add column if not exists dqo numeric;
alter table public.analyses add column if not exists dbo numeric;
alter table public.analyses add column if not exists turbidez numeric;
alter table public.analyses add column if not exists oleos_graxas numeric;
alter table public.analyses add column if not exists solidos_sedimentaveis numeric;
alter table public.analyses add column if not exists vazao numeric;
alter table public.analyses add column if not exists temperatura numeric;
alter table public.analyses add column if not exists observacoes text;
alter table public.analyses add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'analyses' and column_name = 'sampled_at'
  ) then
    alter table public.analyses alter column sampled_at drop not null;
  end if;
end $$;

create or replace function public.user_owns_analysis(target_analysis_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.analyses
      join public.companies on companies.id = analyses.company_id
      where analyses.id = target_analysis_id
      and companies.user_id = auth.uid()
    );
$$;

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.analyses(id) on delete cascade,
  status_operacional text,
  possivel_causa text,
  risco_ambiental text,
  risco_operacional text,
  acao_corretiva text,
  acao_preventiva text,
  melhoria_fisico_quimica text,
  melhoria_biologica text,
  observacao_tecnica text,
  created_at timestamptz not null default now()
);

alter table public.diagnostics add column if not exists analysis_id uuid references public.analyses(id) on delete cascade;
alter table public.diagnostics add column if not exists status_operacional text;
alter table public.diagnostics add column if not exists possivel_causa text;
alter table public.diagnostics add column if not exists risco_ambiental text;
alter table public.diagnostics add column if not exists risco_operacional text;
alter table public.diagnostics add column if not exists acao_corretiva text;
alter table public.diagnostics add column if not exists acao_preventiva text;
alter table public.diagnostics add column if not exists melhoria_fisico_quimica text;
alter table public.diagnostics add column if not exists melhoria_biologica text;
alter table public.diagnostics add column if not exists observacao_tecnica text;
alter table public.diagnostics add column if not exists created_at timestamptz not null default now();

create table if not exists public.chemical_inputs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  nome text,
  tipo text,
  quantidade_usada numeric,
  estoque_atual numeric,
  custo_unitario numeric,
  custo_mensal numeric,
  data_uso date,
  created_at timestamptz not null default now()
);

alter table public.chemical_inputs add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.chemical_inputs add column if not exists nome text;
alter table public.chemical_inputs add column if not exists tipo text;
alter table public.chemical_inputs add column if not exists quantidade_usada numeric;
alter table public.chemical_inputs add column if not exists estoque_atual numeric;
alter table public.chemical_inputs add column if not exists custo_unitario numeric;
alter table public.chemical_inputs add column if not exists custo_mensal numeric;
alter table public.chemical_inputs add column if not exists data_uso date;
alter table public.chemical_inputs add column if not exists created_at timestamptz not null default now();

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  periodo text,
  resumo text,
  recomendacoes text,
  pdf_url text,
  created_at timestamptz not null default now()
);

alter table public.reports add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.reports add column if not exists periodo text;
alter table public.reports add column if not exists resumo text;
alter table public.reports add column if not exists recomendacoes text;
alter table public.reports add column if not exists pdf_url text;
alter table public.reports add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reports' and column_name = 'title'
  ) then
    alter table public.reports alter column title drop not null;
  end if;
end $$;

create table if not exists public.financial (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  tipo text,
  descricao text,
  valor numeric default 0,
  vencimento date,
  status text default 'pendente',
  created_at timestamptz not null default now()
);

alter table public.financial add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.financial add column if not exists tipo text;
alter table public.financial add column if not exists descricao text;
alter table public.financial add column if not exists valor numeric default 0;
alter table public.financial add column if not exists vencimento date;
alter table public.financial add column if not exists status text default 'pendente';
alter table public.financial add column if not exists created_at timestamptz not null default now();

create table if not exists public.iot_sensors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  sensor_nome text,
  parametro text,
  valor numeric,
  unidade text,
  status text default 'online',
  ultima_leitura timestamptz,
  created_at timestamptz not null default now()
);

alter table public.iot_sensors add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.iot_sensors add column if not exists sensor_nome text;
alter table public.iot_sensors add column if not exists parametro text;
alter table public.iot_sensors add column if not exists valor numeric;
alter table public.iot_sensors add column if not exists unidade text;
alter table public.iot_sensors add column if not exists status text default 'online';
alter table public.iot_sensors add column if not exists ultima_leitura timestamptz;
alter table public.iot_sensors add column if not exists created_at timestamptz not null default now();

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  titulo text,
  descricao text,
  prioridade text default 'média',
  status text default 'Aberto',
  resposta_tecnica text,
  created_at timestamptz not null default now()
);

alter table public.support_tickets add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.support_tickets add column if not exists titulo text;
alter table public.support_tickets add column if not exists descricao text;
alter table public.support_tickets add column if not exists prioridade text default 'média';
alter table public.support_tickets add column if not exists status text default 'Aberto';
alter table public.support_tickets add column if not exists resposta_tecnica text;
alter table public.support_tickets add column if not exists created_at timestamptz not null default now();

create table if not exists public.operational_automations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  nome text,
  condicao text,
  acao text,
  status text default 'ativo',
  created_at timestamptz not null default now()
);

alter table public.operational_automations add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.operational_automations add column if not exists nome text;
alter table public.operational_automations add column if not exists condicao text;
alter table public.operational_automations add column if not exists acao text;
alter table public.operational_automations add column if not exists status text default 'ativo';
alter table public.operational_automations add column if not exists created_at timestamptz not null default now();

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.analyses enable row level security;
alter table public.diagnostics enable row level security;
alter table public.chemical_inputs enable row level security;
alter table public.reports enable row level security;
alter table public.financial enable row level security;
alter table public.iot_sensors enable row level security;
alter table public.support_tickets enable row level security;
alter table public.operational_automations enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.analyses to authenticated;
grant select, insert, update, delete on public.diagnostics to authenticated;
grant select, insert, update, delete on public.chemical_inputs to authenticated;
grant select, insert, update, delete on public.reports to authenticated;
grant select, insert, update, delete on public.financial to authenticated;
grant select, insert, update, delete on public.iot_sensors to authenticated;
grant select, insert, update, delete on public.support_tickets to authenticated;
grant select, insert, update, delete on public.operational_automations to authenticated;

drop policy if exists "Users can manage own profile" on public.profiles;
drop policy if exists "Users can manage own companies" on public.companies;
drop policy if exists "Users can manage analyses from own companies" on public.analyses;
drop policy if exists "Users can manage chemical inputs from own companies" on public.chemical_inputs;
drop policy if exists "Users can manage diagnostics from own companies" on public.diagnostics;
drop policy if exists "Users can manage reports from own companies" on public.reports;
drop policy if exists "Profiles are visible to owner or admin" on public.profiles;
drop policy if exists "Companies are visible to owner or admin" on public.companies;
drop policy if exists "Analyses are visible to owner or admin" on public.analyses;
drop policy if exists "Diagnostics are visible to owner or admin" on public.diagnostics;
drop policy if exists "Chemical inputs are visible to owner or admin" on public.chemical_inputs;
drop policy if exists "Reports are visible to owner or admin" on public.reports;
drop policy if exists "Financial rows are visible to owner or admin" on public.financial;
drop policy if exists "Sensors are visible to owner or admin" on public.iot_sensors;
drop policy if exists "Tickets are visible to owner or admin" on public.support_tickets;
drop policy if exists "Automations are visible to owner or admin" on public.operational_automations;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'profiles',
    'companies',
    'analyses',
    'diagnostics',
    'chemical_inputs',
    'reports',
    'financial',
    'iot_sensors',
    'support_tickets',
    'operational_automations'
  ] loop
    foreach policy_name in array array[
      'select own or admin',
      'insert own or admin',
      'update own or admin',
      'delete own or admin'
    ] loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
  end loop;
end $$;

create policy "select own or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "insert own or admin" on public.profiles
  for insert with check (auth.uid() = id or public.is_admin());
create policy "update own or admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());
create policy "delete own or admin" on public.profiles
  for delete using (public.is_admin());

create policy "select own or admin" on public.companies
  for select using (auth.uid() = user_id or public.is_admin());
create policy "insert own or admin" on public.companies
  for insert with check (auth.uid() = user_id or public.is_admin());
create policy "update own or admin" on public.companies
  for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "delete own or admin" on public.companies
  for delete using (auth.uid() = user_id or public.is_admin());

create policy "select own or admin" on public.analyses
  for select using (public.user_owns_company(company_id));
create policy "insert own or admin" on public.analyses
  for insert with check (public.user_owns_company(company_id));
create policy "update own or admin" on public.analyses
  for update using (public.user_owns_company(company_id)) with check (public.user_owns_company(company_id));
create policy "delete own or admin" on public.analyses
  for delete using (public.user_owns_company(company_id));

create policy "select own or admin" on public.diagnostics
  for select using (public.user_owns_analysis(analysis_id));
create policy "insert own or admin" on public.diagnostics
  for insert with check (public.user_owns_analysis(analysis_id));
create policy "update own or admin" on public.diagnostics
  for update using (public.user_owns_analysis(analysis_id)) with check (public.user_owns_analysis(analysis_id));
create policy "delete own or admin" on public.diagnostics
  for delete using (public.user_owns_analysis(analysis_id));

create policy "select own or admin" on public.chemical_inputs
  for select using (public.user_owns_company(company_id));
create policy "insert own or admin" on public.chemical_inputs
  for insert with check (public.user_owns_company(company_id));
create policy "update own or admin" on public.chemical_inputs
  for update using (public.user_owns_company(company_id)) with check (public.user_owns_company(company_id));
create policy "delete own or admin" on public.chemical_inputs
  for delete using (public.user_owns_company(company_id));

create policy "select own or admin" on public.reports
  for select using (public.user_owns_company(company_id));
create policy "insert own or admin" on public.reports
  for insert with check (public.user_owns_company(company_id));
create policy "update own or admin" on public.reports
  for update using (public.user_owns_company(company_id)) with check (public.user_owns_company(company_id));
create policy "delete own or admin" on public.reports
  for delete using (public.user_owns_company(company_id));

create policy "select own or admin" on public.financial
  for select using (public.user_owns_company(company_id));
create policy "insert own or admin" on public.financial
  for insert with check (public.user_owns_company(company_id));
create policy "update own or admin" on public.financial
  for update using (public.user_owns_company(company_id)) with check (public.user_owns_company(company_id));
create policy "delete own or admin" on public.financial
  for delete using (public.user_owns_company(company_id));

create policy "select own or admin" on public.iot_sensors
  for select using (public.user_owns_company(company_id));
create policy "insert own or admin" on public.iot_sensors
  for insert with check (public.user_owns_company(company_id));
create policy "update own or admin" on public.iot_sensors
  for update using (public.user_owns_company(company_id)) with check (public.user_owns_company(company_id));
create policy "delete own or admin" on public.iot_sensors
  for delete using (public.user_owns_company(company_id));

create policy "select own or admin" on public.support_tickets
  for select using (public.user_owns_company(company_id));
create policy "insert own or admin" on public.support_tickets
  for insert with check (public.user_owns_company(company_id));
create policy "update own or admin" on public.support_tickets
  for update using (public.user_owns_company(company_id)) with check (public.user_owns_company(company_id));
create policy "delete own or admin" on public.support_tickets
  for delete using (public.user_owns_company(company_id));

create policy "select own or admin" on public.operational_automations
  for select using (public.user_owns_company(company_id));
create policy "insert own or admin" on public.operational_automations
  for insert with check (public.user_owns_company(company_id));
create policy "update own or admin" on public.operational_automations
  for update using (public.user_owns_company(company_id)) with check (public.user_owns_company(company_id));
create policy "delete own or admin" on public.operational_automations
  for delete using (public.user_owns_company(company_id));

insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Report PDFs are visible to authenticated users" on storage.objects;
drop policy if exists "Users can upload own report PDFs" on storage.objects;
drop policy if exists "Users can update own report PDFs" on storage.objects;
drop policy if exists "Users can delete own report PDFs" on storage.objects;

create policy "Report PDFs are visible to authenticated users"
  on storage.objects
  for select
  using (bucket_id = 'reports' and auth.role() = 'authenticated');

create policy "Users can upload own report PDFs"
  on storage.objects
  for insert
  with check (
    bucket_id = 'reports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own report PDFs"
  on storage.objects
  for update
  using (
    bucket_id = 'reports'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'reports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own report PDFs"
  on storage.objects
  for delete
  using (
    bucket_id = 'reports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
