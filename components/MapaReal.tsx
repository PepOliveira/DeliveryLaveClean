"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type Ponto = [number, number]; // [latitude, longitude]

// Mapa real (OpenStreetMap). Mostra o motorista, o endereço do cliente e o trajeto.
export function MapaReal({ motorista, destino, rota }: { motorista: Ponto | null; destino: Ponto | null; rota: Ponto[] | null }) {
  const el = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const itens = useRef<{ mot?: L.Marker; dest?: L.Marker; linha?: L.Polyline }>({});
  const mexeu = useRef(false); // se a pessoa arrastou o mapa, paramos de reenquadrar sozinho

  useEffect(() => {
    if (!el.current || mapa.current) return;
    const m = L.map(el.current, { attributionControl: true, scrollWheelZoom: false }).setView(destino ?? motorista ?? [-23.5, -47.45], 14);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    m.on("dragstart", () => { mexeu.current = true; });
    mapa.current = m;
    const guardado = itens.current;
    return () => { m.remove(); mapa.current = null; guardado.mot = guardado.dest = guardado.linha = undefined; };
    // o mapa é criado uma vez; os efeitos abaixo atualizam o conteúdo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const it = itens.current;

    if (!destino && it.dest) { it.dest.remove(); it.dest = undefined; }
    if (!motorista && it.mot) { it.mot.remove(); it.mot = undefined; }

    if (destino) {
      const icone = L.divIcon({ className: "", html: '<div class="mk mk-dest" title="Seu endereço"></div>', iconSize: [26, 26], iconAnchor: [13, 13] });
      if (it.dest) it.dest.setLatLng(destino); else it.dest = L.marker(destino, { icon: icone, keyboard: false }).addTo(m);
    }
    if (motorista) {
      const icone = L.divIcon({ className: "", html: '<div class="mk mk-mot" title="Motorista"></div>', iconSize: [30, 30], iconAnchor: [15, 15] });
      if (it.mot) it.mot.setLatLng(motorista); else it.mot = L.marker(motorista, { icon: icone, keyboard: false, zIndexOffset: 500 }).addTo(m);
    }
    if (rota && rota.length > 1) {
      if (it.linha) it.linha.setLatLngs(rota); else it.linha = L.polyline(rota, { color: "#2563EB", weight: 5, opacity: 0.8, dashArray: "1 9", lineCap: "round" }).addTo(m);
    } else if (it.linha) { it.linha.remove(); it.linha = undefined; }

    if (!mexeu.current) {
      const pts: Ponto[] = [];
      if (destino) pts.push(destino);
      if (motorista) pts.push(motorista);
      if (pts.length === 2) m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 17 });
      else if (pts.length === 1) m.setView(pts[0], 15);
    }
  }, [motorista, destino, rota]);

  return <div ref={el} className="mapa-real" role="img" aria-label="Mapa com a posição do motorista e o endereço de entrega" />;
}
