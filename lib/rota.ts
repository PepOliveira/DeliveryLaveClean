"use client";
import type { Ponto } from "@/components/MapaReal";

export interface Trajeto {
  minutos: number;
  km: number;
  linha: Ponto[];
}

// Calcula o trajeto de carro entre dois pontos (OSRM, serviço gratuito).
export async function calcularTrajeto(de: Ponto, para: Ponto): Promise<Trajeto | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${de[1]},${de[0]};${para[1]},${para[0]}?overview=full&geometries=geojson`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    const rota = j?.routes?.[0];
    if (!rota) return null;
    const linha = (rota.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng] as Ponto);
    return { minutos: Math.max(1, Math.round(rota.duration / 60)), km: rota.distance / 1000, linha };
  } catch {
    return null;
  }
}
