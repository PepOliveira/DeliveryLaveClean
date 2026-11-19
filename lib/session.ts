"use client";
import { useEffect, useState } from "react";

export type Papel = "admin" | "rafael";
const KEY = "laveclean:sessao";

// Sem senha: só lembra, neste aparelho, quem tocou no menu inicial.
export function entrar(p: Papel) {
  try { localStorage.setItem(KEY, p); } catch {}
}
export function sair() {
  try { localStorage.removeItem(KEY); } catch {}
}

// undefined = carregando, null = ninguém escolheu ainda
export function useSessao(): Papel | null | undefined {
  const [s, setS] = useState<Papel | null | undefined>(undefined);
  useEffect(() => {
    try { setS((localStorage.getItem(KEY) as Papel) || null); } catch { setS(null); }
  }, []);
  return s;
}
