-- Dados de exemplo (opcional): 2 clientes e 7 pedidos em dias diferentes.
-- Cole no SQL Editor e rode. Para apagar depois, use o limpar.sql.

insert into public.clientes (id, nome, telefone, endereco, cidade, obs) values
  ('c-exemplo-claudia', 'Claudia City Castello', '15977776666', 'Av. Brasil, 480', 'Sorocaba', 'Portaria 24h. Falar com o porteiro.'),
  ('c-exemplo-hotel',   'Hotel Vista',           '15955554444', 'Rua das Flores, 120', 'Itu', '')
on conflict (id) do nothing;

insert into public.pedidos (id, cliente_id, cliente, telefone, endereco, cidade, data, tipo, itens, motorista, status, eventos, ordem, criado_em)
select * from (values
  ('exemplo001', 'c-exemplo-claudia', 'Claudia City Castello', '15977776666', 'Av. Brasil, 480',     'Sorocaba', current_date,     'buscar',   '1 malote',    'rafael', 'agendado',  ('[{"status":"agendado","em":' || (extract(epoch from now()) * 1000)::bigint || '}]')::jsonb, 1, now() - interval '1 hour'),
  ('exemplo002', 'c-exemplo-hotel',   'Hotel Vista',           '15955554444', 'Rua das Flores, 120', 'Itu',      current_date,     'entregar', '12 enxovais', 'rafael', 'agendado',  ('[{"status":"agendado","em":' || (extract(epoch from now()) * 1000)::bigint || '}]')::jsonb, 2, now() - interval '1 hour'),
  ('exemplo003', 'c-exemplo-claudia', 'Claudia City Castello', '15977776666', 'Av. Brasil, 480',     'Sorocaba', current_date,     'entregar', '2 cortinas',  'rafael', 'agendado',  ('[{"status":"agendado","em":' || (extract(epoch from now()) * 1000)::bigint || '}]')::jsonb, 3, now() - interval '1 hour'),
  ('exemplo004', 'c-exemplo-claudia', 'Claudia City Castello', '15977776666', 'Av. Brasil, 480',     'Sorocaba', current_date - 6, 'buscar',   '2 cortinas',  'rafael', 'concluido', ('[{"status":"agendado","em":' || (extract(epoch from now()) * 1000)::bigint || '},{"status":"a_caminho","em":' || (extract(epoch from now()) * 1000)::bigint || '},{"status":"na_portaria","em":' || (extract(epoch from now()) * 1000)::bigint || '},{"status":"concluido","em":' || (extract(epoch from now()) * 1000)::bigint || '}]')::jsonb, 4, now() - interval '6 days'),
  ('exemplo005', 'c-exemplo-hotel',   'Hotel Vista',           '15955554444', 'Rua das Flores, 120', 'Itu',      current_date - 3, 'buscar',   '12 enxovais', 'rafael', 'concluido', ('[{"status":"agendado","em":' || (extract(epoch from now()) * 1000)::bigint || '},{"status":"a_caminho","em":' || (extract(epoch from now()) * 1000)::bigint || '},{"status":"na_portaria","em":' || (extract(epoch from now()) * 1000)::bigint || '},{"status":"concluido","em":' || (extract(epoch from now()) * 1000)::bigint || '}]')::jsonb, 5, now() - interval '3 days'),
  ('exemplo006', 'c-exemplo-hotel',   'Hotel Vista',           '15955554444', 'Rua das Flores, 120', 'Itu',      current_date + 3, 'entregar', '6 lençóis',   'rafael', 'agendado',  ('[{"status":"agendado","em":' || (extract(epoch from now()) * 1000)::bigint || '}]')::jsonb, 6, now()),
  ('exemplo007', 'c-exemplo-claudia', 'Claudia City Castello', '15977776666', 'Av. Brasil, 480',     'Sorocaba', current_date + 5, 'buscar',   '1 edredom',   'rafael', 'agendado',  ('[{"status":"agendado","em":' || (extract(epoch from now()) * 1000)::bigint || '}]')::jsonb, 7, now())
) as v(id, cliente_id, cliente, telefone, endereco, cidade, data, tipo, itens, motorista, status, eventos, ordem, criado_em)
on conflict (id) do nothing;
