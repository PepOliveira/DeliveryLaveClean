import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !chave) {
  throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (veja o arquivo .env.example).");
}

// Esta chave é pública por natureza. Quem protege os dados são as regras (RLS) do banco.
export const supabase = createClient(url, chave);
