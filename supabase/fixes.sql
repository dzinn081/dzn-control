-- DZN CONTROL - preparação idempotente da tabela de lançamentos e políticas RLS.
-- Revise o esquema e as políticas existentes antes de executar no SQL Editor.
-- Este script não apaga registros, não remove políticas e não desativa RLS.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null check (type in ('entrada', 'despesa')),
  description text not null,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Mantém RLS ativado. Não concede acesso anônimo nem remove políticas existentes.
alter table public.transactions enable row level security;

-- CREATE POLICY não oferece IF NOT EXISTS em PostgreSQL. Checamos as políticas
-- pelo schema/tabela/nome antes de criá-las. Políticas existentes não são alteradas.
do $dzn$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'transactions'
      and policyname = 'Usuários podem ver apenas seus próprios lançamentos'
  ) then
    execute $policy$
      create policy "Usuários podem ver apenas seus próprios lançamentos"
      on public.transactions for select to authenticated
      using (auth.uid() = user_id)
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'transactions'
      and policyname = 'Usuários podem inserir apenas seus próprios lançamentos'
  ) then
    execute $policy$
      create policy "Usuários podem inserir apenas seus próprios lançamentos"
      on public.transactions for insert to authenticated
      with check (auth.uid() = user_id)
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'transactions'
      and policyname = 'Usuários podem atualizar apenas seus próprios lançamentos'
  ) then
    execute $policy$
      create policy "Usuários podem atualizar apenas seus próprios lançamentos"
      on public.transactions for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'transactions'
      and policyname = 'Usuários podem excluir apenas seus próprios lançamentos'
  ) then
    execute $policy$
      create policy "Usuários podem excluir apenas seus próprios lançamentos"
      on public.transactions for delete to authenticated
      using (auth.uid() = user_id)
    $policy$;
  end if;
end
$dzn$;

create index if not exists idx_transactions_user_date
  on public.transactions (user_id, transaction_date desc, created_at desc);

-- O aplicativo consulta/grava: user_id, type, description, category, amount,
-- transaction_date e created_at. Se a tabela já existia com esquema diferente,
-- pare e faça uma migração revisada antes de executar este script.
