"use client";
import { useEffect, useState } from "react";
import { hojeISO } from "./util";

const KEY = "laveclean:dia";

// Dia que a administradora está olhando (Pedidos e Rotas usam o mesmo).
// Todo dia novo começa em "hoje".
export function useDia() {
  const [dia, setDia] = useState(hojeISO());
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r && r.visto === hojeISO() && r.dia) setDia(r.dia);
    } catch {}
  }, []);
  const mudar = (d: string) => {
    setDia(d);
    try { localStorage.setItem(KEY, JSON.stringify({ dia: d, visto: hojeISO() })); } catch {}
  };
  return [dia, mudar] as const;
}
