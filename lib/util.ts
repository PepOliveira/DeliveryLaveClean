export const hora = (t: number) =>
  new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const soNumeros = (s: string) => s.replace(/\D/g, "");

export function whatsLink(telefone: string, msg: string) {
  const n = soNumeros(telefone);
  return `https://wa.me/55${n}?text=${encodeURIComponent(msg)}`;
}

export function mapaLink(endereco: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

export const verbo = (t: "buscar" | "entregar") => (t === "buscar" ? "buscar" : "entregar");

const enc = encodeURIComponent;

// Completa o endereço com a cidade, se ela ainda não estiver escrita
export function enderecoCompleto(endereco: string, cidade: string) {
  const c = cidade.trim();
  return c && !endereco.toLowerCase().includes(c.toLowerCase()) ? `${endereco}, ${c}` : endereco;
}

// Link do Google Maps com várias paradas (o Maps aceita no máximo 9 paradas intermediárias)
export function rotaLink(origem: string, paradas: string[], voltar: boolean) {
  const base = "https://www.google.com/maps/dir/?api=1&travelmode=driving";
  if (!paradas.length) return base;
  const volta = voltar && !!origem;
  const destino = volta ? origem : paradas[paradas.length - 1];
  const meio = (volta ? paradas : paradas.slice(0, -1)).slice(0, 9);
  let u = `${base}&destination=${enc(destino)}`;
  if (origem) u += `&origin=${enc(origem)}`;
  if (meio.length) u += `&waypoints=${meio.map(enc).join("%7C")}`;
  return u;
}

// ---------- Datas (formato AAAA-MM-DD, no horário local) ----------
export const hojeISO = () => new Date().toLocaleDateString("sv-SE");
export const dataISO = (t: number) => new Date(t).toLocaleDateString("sv-SE");

export function somarDias(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
}

export function nomeDia(iso: string) {
  const t = new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
