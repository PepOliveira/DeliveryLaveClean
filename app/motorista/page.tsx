"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AvisoErro } from "@/components/AvisoErro";
import { Confirmar } from "@/components/Confirmar";
import { Logo } from "@/components/Logo";
import { avancar, alternarFila, enviarPosicao, useEstado, voltar } from "@/lib/store";
import { sair, useSessao } from "@/lib/session";
import { enderecoCompleto, hojeISO, hora, mapaLink, soNumeros } from "@/lib/util";
import type { Pedido } from "@/lib/types";

function acao(p: Pedido) {
  if (p.status === "agendado") return { texto: "Saí da lavanderia", pergunta: "Avisar o cliente que você saiu?", sim: "Sim, avisar", cor: "primary" };
  if (p.status === "a_caminho") return { texto: "Cheguei na portaria", pergunta: "Avisar o cliente que você chegou na portaria?", sim: "Sim, avisar", cor: "green" };
  return {
    texto: p.tipo === "buscar" ? "Peguei a roupa" : "Entreguei",
    pergunta: p.tipo === "buscar" ? "Confirmar que pegou a roupa?" : "Confirmar que entregou?",
    sim: "Sim, confirmar", cor: "dark",
  };
}

function useGps() {
  const [estado, setEstado] = useState<"pedindo" | "ligado" | "desligado">("pedindo");
  useEffect(() => {
    if (!navigator.geolocation) { setEstado("desligado"); return; }
    const id = navigator.geolocation.watchPosition(() => setEstado("ligado"), () => setEstado("desligado"), { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return estado;
}

// Mantém a tela acesa enquanto o app estiver visível (quando o navegador permite)
function useTelaLigada() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const pedir = async () => {
      try {
        const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (wl && document.visibilityState === "visible") lock = await wl.request("screen");
      } catch {}
    };
    pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => { document.removeEventListener("visibilitychange", pedir); lock?.release().catch(() => {}); };
  }, []);
}

export default function Motorista() {
  const router = useRouter();
  const sessao = useSessao();
  const estado = useEstado();
  const gps = useGps();
  useTelaLigada();
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => { if (sessao === null) router.replace("/"); }, [sessao, router]);

  // parada atual (a primeira pendente de hoje ou atrasada)
  const paradaAtual = estado && sessao
    ? estado.pedidos
        .filter((p) => p.motorista === sessao && p.status !== "concluido" && p.data <= hojeISO())
        .sort((x, y) => x.data.localeCompare(y.data) || x.ordem - y.ordem)[0]
    : undefined;
  const idEnviando = paradaAtual && (paradaAtual.status === "a_caminho" || paradaAtual.status === "na_portaria") ? paradaAtual.id : null;

  // enquanto está a caminho ou na portaria, manda a última posição conhecida para o cliente a cada 10 s
  // (mesmo parado, para o cliente saber que o sinal está vivo)
  useEffect(() => {
    if (!idEnviando || !navigator.geolocation) return;
    let ultima: { lat: number; lng: number } | null = null;
    const enviar = () => { if (ultima) enviarPosicao(idEnviando, ultima.lat, ultima.lng); };
    const w = navigator.geolocation.watchPosition(
      (pos) => {
        const primeira = !ultima;
        ultima = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (primeira) enviar(); // a primeira vez vai na hora
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    const t = setInterval(enviar, 10000);
    return () => { navigator.geolocation.clearWatch(w); clearInterval(t); };
  }, [idEnviando]);

  if (!estado || !sessao) return <main className="wrap"><p>Carregando…</p></main>;
  const quem = sessao;

  const meus = estado.pedidos.filter((p) => p.motorista === quem && (p.data === hojeISO() || (p.data < hojeISO() && p.status !== "concluido"))).sort((a, b) => a.data.localeCompare(b.data) || a.ordem - b.ordem);
  const pendentes = meus.filter((p) => p.status !== "concluido");
  const atual = pendentes[0];
  const proximas = pendentes.slice(1);
  const feitas = meus.filter((p) => p.status === "concluido");
  const nome = quem === "rafael" ? "Rafael" : "Luciana";

  return (
    <main className="wrap mot">
      <AvisoErro />
      <div className="top">
        <span className="logo"><Logo tamanho={44} /><span className="brand">{nome}</span></span>
        {quem === "admin"
          ? <Link className="btn ghost small" href="/painel">Painel</Link>
          : <button className="btn ghost small" onClick={() => { sair(); router.replace("/"); }}>Sair</button>}
      </div>

      <div className={`status ${gps === "ligado" ? "on" : ""}`}>
        <i />
        {gps === "ligado" ? "Localização ligada" : gps === "pedindo" ? "Permita a localização no celular" : "Localização desligada. O cliente não vê você no mapa."}
      </div>
      <p className="aviso">
        Os botões abaixo sempre avisam o cliente, mesmo com o mapa aberto. A posição no mapa do cliente só atualiza enquanto este app estiver na tela.
      </p>

      {!atual ? (
        <div className="card" style={{ marginTop: 14 }}>
          <h1>Tudo certo!</h1>
          <p className="muted">Nenhuma parada pendente. {feitas.length > 0 && `Você concluiu ${feitas.length} hoje.`}</p>
        </div>
      ) : (
        <div className="card hl" style={{ marginTop: 14 }}>
          <span className="badge b-a_caminho" style={{ background: "var(--blue-soft)", color: "var(--blue-dark)" }}>
            AGORA · {atual.tipo === "buscar" ? "BUSCAR" : "ENTREGAR"}
          </span>
          <h1 style={{ marginTop: 10 }}>{atual.cliente}</h1>
          <p>{atual.endereco} · {atual.cidade}</p>
          <p className="muted">{atual.itens}</p>

          <button className={`btn ${acao(atual).cor}`} style={{ minHeight: 72, fontSize: "1.25rem" }} onClick={() => setConfirmando(true)}>
            {acao(atual).texto}
          </button>

          {atual.status === "na_portaria" && (
            <button className="btn ghost" onClick={() => alternarFila(atual.id)}>
              {atual.filaPortaria ? "Tirar aviso de fila" : "Tem fila na portaria"}
            </button>
          )}

          <div className="row">
            <a className="btn ghost" href={mapaLink(enderecoCompleto(atual.endereco, atual.cidade))} target="_blank" rel="noreferrer">Abrir no mapa</a>
            <a className="btn ghost" href={`tel:+55${soNumeros(atual.telefone)}`}>Ligar para o cliente</a>
          </div>

          {atual.eventos.length > 1 && (
            <button className="btn ghost" style={{ border: 0, minHeight: 44 }} onClick={() => voltar(atual.id)}>
              Apertei sem querer, voltar um passo
            </button>
          )}
        </div>
      )}

      {proximas.length > 0 && (
        <details className="card">
          <summary>Próximas paradas ({proximas.length})</summary>
          {proximas.map((p) => (
            <div className="order" key={p.id}>
              <b>{p.cliente}</b>
              <p className="muted">{p.tipo === "buscar" ? "Buscar" : "Entregar"} · {p.itens}</p>
            </div>
          ))}
        </details>
      )}

      {feitas.length > 0 && (
        <details className="card">
          <summary>Já concluídas ({feitas.length})</summary>
          {feitas.map((p) => (
            <div className="order" key={p.id}>
              <b>{p.cliente}</b>
              <p className="muted">{p.itens} · {hora(p.eventos[p.eventos.length - 1].em)}</p>
            </div>
          ))}
        </details>
      )}

      {confirmando && atual && (
        <Confirmar
          titulo={acao(atual).pergunta}
          sim={acao(atual).sim}
          onSim={() => { avancar(atual.id); setConfirmando(false); }}
          onNao={() => setConfirmando(false)}
        />
      )}
    </main>
  );
}
