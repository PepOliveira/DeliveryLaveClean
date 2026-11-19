-- =====================================================================
-- LaveClean · banco de dados (sem login)
-- Cole este arquivo inteiro no Supabase: SQL Editor > New query > Run.
-- Pode rodar de novo sem problema (ele não apaga pedidos nem clientes).
-- =====================================================================

-- ---------- Tabelas ----------

create table if not exists public.clientes (
  id        text primary key,
  nome      text not null,
  telefone  text not null default '',
  endereco  text not null default '',
  cidade    text not null default 'Sorocaba',
  obs       text not null default '',
  criado_em timestamptz not null default now()
);

create sequence if not exists public.pedidos_codigo_seq start 1001;

create table if not exists public.pedidos (
  id            text primary key,
  codigo        integer not null default nextval('public.pedidos_codigo_seq'),
  cliente_id    text references public.clientes(id) on delete set null,
  cliente       text not null,
  telefone      text not null default '',
  endereco      text not null default '',
  cidade        text not null default 'Sorocaba',
  data          date not null default current_date,
  tipo          text not null check (tipo in ('buscar', 'entregar')),
  itens         text not null default '',
  motorista     text not null check (motorista in ('rafael', 'admin')),
  status        text not null default 'agendado'
                check (status in ('agendado', 'a_caminho', 'na_portaria', 'concluido')),
  eventos       jsonb not null default '[]'::jsonb,
  eta_min       integer not null default 12,
  fila_portaria boolean not null default false,
  ordem         double precision not null default 0,
  criado_em     timestamptz not null default now()
);

-- Mapa: posição do motorista e destino do pedido
alter table public.pedidos add column if not exists dest_lat double precision;
alter table public.pedidos add column if not exists dest_lng double precision;
alter table public.pedidos add column if not exists lat double precision;
alter table public.pedidos add column if not exists lng double precision;
alter table public.pedidos add column if not exists pos_em timestamptz;

create index if not exists pedidos_data_idx on public.pedidos (data);
create index if not exists pedidos_cliente_idx on public.pedidos (cliente_id);

-- ---------- Limpeza da versão com login (se você já tinha rodado) ----------
drop policy if exists clientes_admin on public.clientes;
drop policy if exists pedidos_admin on public.pedidos;
drop policy if exists pedidos_motorista_ler on public.pedidos;
drop policy if exists pedidos_motorista_atualizar on public.pedidos;
drop table if exists public.perfis cascade;
drop function if exists public.papel() cascade;

-- ---------- Acesso ----------
-- Sem login: quem abre o sistema pode ver, criar e editar pedidos e clientes.
-- Apagar pelo site NÃO é permitido (só pelo painel do Supabase).
alter table public.clientes enable row level security;
alter table public.pedidos  enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.clientes, public.pedidos to anon, authenticated;
revoke delete on public.clientes, public.pedidos from anon, authenticated;
grant usage, select on sequence public.pedidos_codigo_seq to anon, authenticated;

drop policy if exists clientes_ver on public.clientes;
drop policy if exists clientes_criar on public.clientes;
drop policy if exists clientes_editar on public.clientes;
create policy clientes_ver    on public.clientes for select to anon, authenticated using (true);
create policy clientes_criar  on public.clientes for insert to anon, authenticated with check (true);
create policy clientes_editar on public.clientes for update to anon, authenticated using (true) with check (true);

drop policy if exists pedidos_ver on public.pedidos;
drop policy if exists pedidos_criar on public.pedidos;
drop policy if exists pedidos_editar on public.pedidos;
create policy pedidos_ver    on public.pedidos for select to anon, authenticated using (true);
create policy pedidos_criar  on public.pedidos for insert to anon, authenticated with check (true);
create policy pedidos_editar on public.pedidos for update to anon, authenticated using (true) with check (true);

-- ---------- Link público do cliente ----------
-- A tela do cliente consulta UM pedido pelo código do link e recebe só o que precisa
-- (nunca o endereço nem o telefone). A posição do motorista só vale enquanto ele está a caminho
-- ou na portaria; antes e depois disso ela não é entregue.
create or replace function public.pedido_publico(p_id text)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', id, 'codigo', codigo, 'cliente', cliente, 'tipo', tipo, 'itens', itens,
    'motorista', motorista, 'status', status, 'eventos', eventos,
    'etaMin', eta_min, 'filaPortaria', fila_portaria, 'data', data,
    'lat',     case when status in ('a_caminho', 'na_portaria') then lat end,
    'lng',     case when status in ('a_caminho', 'na_portaria') then lng end,
    'posEm',   case when status in ('a_caminho', 'na_portaria') and pos_em is not null
                    then (extract(epoch from pos_em) * 1000)::bigint end,
    'destLat', case when status <> 'concluido' then dest_lat end,
    'destLng', case when status <> 'concluido' then dest_lng end
  )
  from public.pedidos where id = p_id
$$;

revoke all on function public.pedido_publico(text) from public;
grant execute on function public.pedido_publico(text) to anon, authenticated;

-- ---------- Atualização em tempo real ----------
do $$ begin
  alter publication supabase_realtime add table public.pedidos;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.clientes;
exception when duplicate_object then null; end $$;
