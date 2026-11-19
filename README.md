# LaveClean · Entregas

Acompanhamento de coleta e entrega da lavanderia LaveClean.
Next.js + TypeScript + Supabase.

## Telas
- `/` menu inicial: Luciana ou Rafael
- `/painel`, `/rotas`, `/calendario`, `/clientes` — Luciana (celular e computador)
- `/motorista` — Rafael (celular)
- `/acompanhe/[código]` — link público que o cliente recebe

## Configurar o Supabase (uma vez)
1. Supabase > SQL Editor > New query > cole `supabase/schema.sql` > Run.
2. Opcional: rode `supabase/exemplos.sql` para ter pedidos de exemplo.
   Para zerar tudo antes de usar de verdade, rode `supabase/limpar.sql`.

## Rodar no computador
```
npm install
cp .env.example .env.local   # preencha a URL e a chave publishable do Supabase
npm run dev
```

## Vercel
Project Settings > Environment Variables:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (a chave *publishable*) e `NEXT_PUBLIC_PIN`.
Nunca coloque a chave *secret* no projeto nem na Vercel.
