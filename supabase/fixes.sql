-- DZN CONTROL - SQL de correção para Supabase
-- Execute este arquivo no SQL editor do Supabase no projeto atual.
-- Não remova RLS nem apague dados existentes.

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

alter table public.transactions enable row level security;

create policy if not exists "Usuários podem ver apenas seus próprios lançamentos"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

create policy if not exists "Usuários podem inserir apenas seus próprios lançamentos"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy if not exists "Usuários podem atualizar apenas seus próprios lançamentos"
on public.transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Usuários podem excluir apenas seus próprios lançamentos"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_transactions_user_date
on public.transactions (user_id, transaction_date desc, created_at desc);

-- Se o projeto já tiver uma tabela transactions com colunas diferentes,
-- confira antes de executar. O aplicativo usa as colunas:
-- user_id, type, description, category, amount, transaction_date
