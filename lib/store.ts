"use client";
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import type { Cliente, Estado, Pedido, Status, Tipo } from "./types";
import { ORDEM } from "./types";

// Camada de dados em cima do Supabase.
// A tela mexe nos dados na hora (otimista) e o Supabase confirma em seguida.
// Qualquer mudança feita por outra pessoa chega por tempo real.

let estado: Estado | null = null;
let erroCarga: string | null = null;
let aviso: string | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((l) => l());

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");

// Código curto e difícil de adivinhar para o link do cliente
function novoId() {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(10))).map((b) => letras[b % letras.length]).join("");
}

// ---------- Conversão banco <-> app ----------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Linha = Record<string, any>;

const deCliente = (r: Linha): Cliente => ({ id: r.id, nome: r.nome, telefone: r.telefone, endereco: r.endereco, cidade: r.cidade, obs: r.obs });
const linhaCliente = (c: Cliente) => ({ id: c.id, nome: c.nome, telefone: c.telefone, endereco: c.endereco, cidade: c.cidade, obs: c.obs });

const dePedido = (r: Linha): Pedido => ({
  id: r.id, codigo: r.codigo, clienteId: r.cliente_id ?? "", cliente: r.cliente, telefone: r.telefone, endereco: r.endereco,
  cidade: r.cidade, data: r.data, tipo: r.tipo, itens: r.itens, motorista: r.motorista, status: r.status,
  eventos: r.eventos ?? [], etaMin: r.eta_min, filaPortaria: r.fila_portaria, ordem: r.ordem, criadoEm: new Date(r.criado_em).getTime(),
  destLat: r.dest_lat ?? null, destLng: r.dest_lng ?? null, lat: r.lat ?? null, lng: r.lng ?? null, posEm: r.pos_em ? new Date(r.pos_em).getTime() : null,
});
const linhaPedido = (p: Pedido) => ({
  id: p.id, cliente_id: p.clienteId || null, cliente: p.cliente, telefone: p.telefone, endereco: p.endereco, cidade: p.cidade,
  data: p.data, tipo: p.tipo, itens: p.itens, motorista: p.motorista, status: p.status, eventos: p.eventos,
  eta_min: p.etaMin, fila_portaria: p.filaPortaria, ordem: p.ordem, criado_em: new Date(p.criadoEm).toISOString(),
  dest_lat: p.destLat, dest_lng: p.destLng,
});

// ---------- Carregar e manter atualizado ----------
async function carregar() {
  const [p, c] = await Promise.all([
    supabase.from("pedidos").select("*").order("ordem"),
    supabase.from("clientes").select("*").order("nome"),
  ]);
  if (p.error || c.error) {
    erroCarga = (p.error ?? c.error)!.message;
    avisar();
    return;
  }
  erroCarga = null;
  estado = { clientes: (c.data ?? []).map(deCliente), pedidos: (p.data ?? []).map(dePedido) };
  avisar();
}

function iniciar() {
  carregar();
  let t: ReturnType<typeof setTimeout> | undefined;
  const recarregar = () => { clearTimeout(t); t = setTimeout(carregar, 200); };

  const canal = supabase
    .channel("laveclean-dados")
    .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, recarregar)
    .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, recarregar)
    .subscribe();

  const timer = setInterval(carregar, 30000); // garantia, caso o tempo real falhe
  const aoVoltar = () => { if (document.visibilityState === "visible") carregar(); };
  document.addEventListener("visibilitychange", aoVoltar);

  return () => {
    clearTimeout(t);
    clearInterval(timer);
    document.removeEventListener("visibilitychange", aoVoltar);
    supabase.removeChannel(canal);
  };
}

let parar: (() => void) | null = null;

function subscribe(cb: () => void) {
  ouvintes.add(cb);
  if (ouvintes.size === 1) parar = iniciar();
  return () => {
    ouvintes.delete(cb);
    if (ouvintes.size === 0) { parar?.(); parar = null; }
  };
}

export function useEstado(): Estado | null {
  return useSyncExternalStore(subscribe, () => estado, () => null);
}
export function useErroDados(): string | null {
  return useSyncExternalStore(subscribe, () => erroCarga, () => null);
}
export function useAviso(): string | null {
  return useSyncExternalStore(subscribe, () => aviso, () => null);
}

function definir(e: Estado) {
  estado = e;
  avisar();
}

// Grava no banco. Se falhar, mostra um aviso e volta para o que está salvo.
async function gravar(op: PromiseLike<{ error: { message: string } | null }>): Promise<boolean> {
  const { error } = await op;
  if (!error) return true;
  console.error(error);
  aviso = "Não foi possível salvar. Confira a internet e tente de novo.";
  avisar();
  setTimeout(() => { aviso = null; avisar(); }, 6000);
  carregar();
  return false;
}

// ---------- Endereço no mapa ----------
// Descobre as coordenadas do endereço (serviço gratuito do OpenStreetMap). Se não achar, o pedido segue sem mapa.
async function geocodificar(endereco: string, cidade: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${endereco}, ${cidade}`);
    const r = await fetch(`/api/geocode?q=${q}`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j?.lat === "number" && typeof j?.lng === "number" ? { lat: j.lat, lng: j.lng } : null;
  } catch {
    return null;
  }
}

// ---------- Pedidos ----------
export async function criarPedido(d: { cliente: string; telefone: string; endereco: string; cidade: string; data: string; tipo: Tipo; itens: string; motorista: "rafael" | "admin" }): Promise<string | null> {
  const e = estado;
  if (!e) return null;
  const id = novoId();
  const existente = e.clientes.find((c) => c.nome.toLowerCase() === d.cliente.toLowerCase());
  const cliente: Cliente = existente
    ? { ...existente, telefone: d.telefone, endereco: d.endereco, cidade: d.cidade }
    : { id: `c-${slug(d.cliente)}-${id.slice(0, 4)}`, nome: d.cliente, telefone: d.telefone, endereco: d.endereco, cidade: d.cidade, obs: "" };
  const ordem = Math.max(0, ...e.pedidos.map((p) => p.ordem)) + 1;
  const agora = Date.now();
  const destino = await geocodificar(cliente.endereco, cliente.cidade);
  const p: Pedido = {
    id, codigo: 0, clienteId: cliente.id, cliente: cliente.nome, telefone: cliente.telefone, endereco: cliente.endereco, cidade: cliente.cidade,
    data: d.data, tipo: d.tipo, itens: d.itens, motorista: d.motorista, status: "agendado",
    eventos: [{ status: "agendado", em: agora }], etaMin: 12, filaPortaria: false, criadoEm: agora, ordem,
    destLat: destino?.lat ?? null, destLng: destino?.lng ?? null, lat: null, lng: null, posEm: null,
  };

  // grava primeiro: só entrega o link se o pedido realmente existe no banco
  if (!(await gravar(supabase.from("clientes").upsert(linhaCliente(cliente))))) return null;
  const { data: salvo, error } = await supabase.from("pedidos").insert(linhaPedido(p)).select("codigo").single();
  if (error) { await gravar(Promise.resolve({ error })); return null; }

  const atual = estado ?? e;
  const clientes = existente ? atual.clientes.map((c) => (c.id === cliente.id ? cliente : c)) : [...atual.clientes, cliente];
  definir({ clientes, pedidos: [{ ...p, codigo: salvo.codigo }, ...atual.pedidos] });
  return id;
}

function atualizar(id: string, fn: (p: Pedido) => Pedido, campos: (p: Pedido) => Linha) {
  const e = estado;
  const antes = e?.pedidos.find((p) => p.id === id);
  if (!e || !antes) return;
  const depois = fn(antes);
  if (depois === antes) return;
  definir({ ...e, pedidos: e.pedidos.map((p) => (p.id === id ? depois : p)) });
  gravar(supabase.from("pedidos").update(campos(depois)).eq("id", id));
}

export function avancar(id: string) {
  atualizar(
    id,
    (p) => {
      const i = ORDEM.indexOf(p.status);
      if (i >= ORDEM.length - 1) return p;
      const status: Status = ORDEM[i + 1];
      return { ...p, status, eventos: [...p.eventos, { status, em: Date.now() }] };
    },
    (p) => ({ status: p.status, eventos: p.eventos }),
  );
}

export function voltar(id: string) {
  atualizar(
    id,
    (p) => {
      if (p.eventos.length <= 1) return p;
      const eventos = p.eventos.slice(0, -1);
      return { ...p, eventos, status: eventos[eventos.length - 1].status };
    },
    (p) => ({ status: p.status, eventos: p.eventos }),
  );
}

export function alternarFila(id: string) {
  atualizar(id, (p) => ({ ...p, filaPortaria: !p.filaPortaria }), (p) => ({ fila_portaria: p.filaPortaria }));
}

// Troca a posição de uma parada com a vizinha (dentro das paradas pendentes do mesmo motorista e dia)
export function moverParada(id: string, dir: -1 | 1) {
  const e = estado;
  const alvo = e?.pedidos.find((p) => p.id === id);
  if (!e || !alvo) return;
  const fila = e.pedidos.filter((p) => p.motorista === alvo.motorista && p.data === alvo.data && p.status !== "concluido").sort((a, b) => a.ordem - b.ordem);
  const i = fila.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= fila.length) return;
  const a = fila[i], b = fila[j];
  definir({ ...e, pedidos: e.pedidos.map((p) => (p.id === a.id ? { ...p, ordem: b.ordem } : p.id === b.id ? { ...p, ordem: a.ordem } : p)) });
  gravar(supabase.from("pedidos").update({ ordem: b.ordem }).eq("id", a.id));
  gravar(supabase.from("pedidos").update({ ordem: a.ordem }).eq("id", b.id));
}

// ---------- Clientes ----------
export async function salvarCliente(c: Cliente) {
  const e = estado;
  if (!e) return;
  const antes = e.clientes.find((x) => x.id === c.id);
  const mudouEndereco = !antes || antes.endereco !== c.endereco || antes.cidade !== c.cidade;
  const clientes = antes ? e.clientes.map((x) => (x.id === c.id ? c : x)) : [...e.clientes, c];
  const pedidos = e.pedidos.map((p) => (p.clienteId === c.id ? { ...p, cliente: c.nome, telefone: c.telefone, endereco: c.endereco, cidade: c.cidade } : p));
  definir({ clientes, pedidos });
  // os pedidos já criados passam a usar os dados novos do cliente
  if (await gravar(supabase.from("clientes").upsert(linhaCliente(c)))) {
    await gravar(supabase.from("pedidos").update({ cliente: c.nome, telefone: c.telefone, endereco: c.endereco, cidade: c.cidade }).eq("cliente_id", c.id));
    if (mudouEndereco) {
      // novo endereço: acha o ponto no mapa para os pedidos que ainda não foram concluídos
      const destino = await geocodificar(c.endereco, c.cidade);
      await gravar(supabase.from("pedidos").update({ dest_lat: destino?.lat ?? null, dest_lng: destino?.lng ?? null }).eq("cliente_id", c.id).neq("status", "concluido"));
    }
  }
}

// O celular do motorista manda a posição dele. Sem aviso de erro: a próxima tentativa vem em segundos.
export async function enviarPosicao(id: string, lat: number, lng: number) {
  const { error } = await supabase.from("pedidos").update({ lat, lng, pos_em: new Date().toISOString() }).eq("id", id);
  if (error) console.error(error);
}

export function novoIdCliente(nome: string) {
  return `c-${slug(nome) || "cliente"}-${novoId().slice(0, 4)}`;
}

export function linkDoPedido(id: string) {
  return `${window.location.origin}/acompanhe/${id}`;
}
