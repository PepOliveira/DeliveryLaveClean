-- Apaga TODOS os pedidos e clientes (use só para zerar os testes antes de usar de verdade).
-- Cole no SQL Editor do Supabase e rode. Não tem como desfazer.

delete from public.pedidos;
delete from public.clientes;
alter sequence public.pedidos_codigo_seq restart with 1001;
