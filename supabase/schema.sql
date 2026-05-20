create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

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
  user_id uuid not null references auth.users(id) on delete cascade,
  razao_social text not null,
  cnpj text not null,
  responsavel text,
  telefone text,
  email text,
  tipo_efluente text,
  endereco text,
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  data date not null,
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

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
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

create table if not exists public.chemical_inputs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  nome text not null,
  tipo text,
  quantidade_usada numeric,
  estoque_atual numeric,
  custo_unitario numeric,
  custo_mensal numeric,
  data_uso date,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  periodo text,
  resumo text,
  recomendacoes text,
  pdf_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.financial (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tipo text not null check (tipo in ('receita', 'despesa', 'custo_quimico', 'mensalidade')),
  descricao text not null,
  valor numeric not null default 0,
  vencimento date,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  created_at timestamptz not null default now()
);

create table if not exists public.iot_sensors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sensor_nome text not null,
  parametro text not null,
  valor numeric,
  unidade text,
  status text not null default 'online' check (status in ('online', 'atenção', 'offline', 'crítico')),
  ultima_leitura timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  titulo text not null,
  descricao text not null,
  prioridade text not null default 'média' check (prioridade in ('baixa', 'média', 'alta', 'crítica')),
  status text not null default 'Aberto' check (status in ('Aberto', 'Em análise', 'Respondido', 'Encerrado')),
  resposta_tecnica text,
  created_at timestamptz not null default now()
);

create table if not exists public.operational_automations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  nome text not null,
  condicao text not null,
  acao text not null,
  status text not null default 'ativo' check (status in ('ativo', 'pausado')),
  created_at timestamptz not null default now()
);

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

create policy "Profiles are visible to owner or admin"
  on public.profiles
  for all
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "Companies are visible to owner or admin"
  on public.companies
  for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "Analyses are visible to owner or admin"
  on public.analyses
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = analyses.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = analyses.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Diagnostics are visible to owner or admin"
  on public.diagnostics
  for all
  using (
    public.is_admin()
    or exists (
      select 1
      from public.analyses
      join public.companies on companies.id = analyses.company_id
      where analyses.id = diagnostics.analysis_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.analyses
      join public.companies on companies.id = analyses.company_id
      where analyses.id = diagnostics.analysis_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Chemical inputs are visible to owner or admin"
  on public.chemical_inputs
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = chemical_inputs.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = chemical_inputs.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Reports are visible to owner or admin"
  on public.reports
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = reports.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = reports.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Financial rows are visible to owner or admin"
  on public.financial
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = financial.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = financial.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Sensors are visible to owner or admin"
  on public.iot_sensors
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = iot_sensors.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = iot_sensors.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Tickets are visible to owner or admin"
  on public.support_tickets
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = support_tickets.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = support_tickets.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Automations are visible to owner or admin"
  on public.operational_automations
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = operational_automations.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.companies
      where companies.id = operational_automations.company_id
      and companies.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Report PDFs are visible to authenticated users" on storage.objects;
drop policy if exists "Users can upload own report PDFs" on storage.objects;
drop policy if exists "Users can update own report PDFs" on storage.objects;

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
