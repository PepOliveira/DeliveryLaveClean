"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Pedido } from "./types";

// O que o cliente (sem login) pode ver de um pedido. Sem endereço e sem telefone.
export type PedidoPublico = Pick<Pedido, "id" | "codigo" | "cliente" | "tipo" | "itens" | "motorista" | "status" | "eventos" | "etaMin" | "filaPortaria" | "data" | "lat" | "lng" | "posEm" | "destLat" | "destLng">;

// undefined = carregando, null = não encontrado. Atualiza sozinho a cada poucos segundos.
export function usePedidoPublico(id: string): { pedido: PedidoPublico | null | undefined; falhou: boolean } {
  const [pedido, setPedido] = useState<PedidoPublico | null | undefined>(undefined);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    async function buscar() {
      const { data, error } = await supabase.rpc("pedido_publico", { p_id: id });
      if (!vivo) return;
      if (error) { setFalhou(true); return; }
      setFalhou(false);
      setPedido((data as PedidoPublico | null) ?? null);
    }
    buscar();
    const t = setInterval(() => { if (document.visibilityState === "visible") buscar(); }, 5000);
    const aoVoltar = () => { if (document.visibilityState === "visible") buscar(); };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => { vivo = false; clearInterval(t); document.removeEventListener("visibilitychange", aoVoltar); };
  }, [id]);

  return { pedido, falhou };
}
