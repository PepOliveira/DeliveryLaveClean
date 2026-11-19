import { NextRequest, NextResponse } from "next/server";

// Procura as coordenadas de um endereço no OpenStreetMap (Nominatim, gratuito).
// Tenta o endereço completo; se não achar, tenta só a rua (sem o número).
async function buscar(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { "User-Agent": "LaveClean-app/1.0", "Accept-Language": "pt-BR" }, cache: "no-store" });
  if (!r.ok) return null;
  const j = await r.json();
  const p = j?.[0];
  return p ? { lat: Number(p.lat), lng: Number(p.lon) } : null;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 5 || q.length > 200) return NextResponse.json(null);
  try {
    const achou = (await buscar(q)) ?? (await buscar(q.replace(/,?\s*\d+[a-zA-Z]?(?=\s*,)/, "")));
    return NextResponse.json(achou);
  } catch {
    return NextResponse.json(null);
  }
}
