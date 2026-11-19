"use client";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { Mapa } from "@/components/Mapa";
import type { Ponto } from "@/components/MapaReal";
import { LAVANDERIA, USUARIOS } from "@/lib/config";
import { usePedidoPublico } from "@/lib/publico";
import { calcularTrajeto, type Trajeto } from "@/lib/rota";
import { hojeISO, hora, nomeDia, soNumeros } from "@/lib/util";
import type { Status } from "@/lib/types";

// O mapa real usa o navegador (window), por isso só carrega depois da página abrir
const MapaReal = dynamic(() => import("@/components/MapaReal").then((m) => m.MapaReal), {
  ssr: false,
  loading: () => <div className="mapa-real" />,
});

export default function Acompanhe() {
  const { id } = useParams<{ id: string }>();
  const { pedido: p, falhou } = usePedidoPublico(id);
  const [agora, setAgora] = useState(() => Date.now());
  const [largo, setLargo] = useState(false);
  const [trajeto, setTrajeto] = useState<Trajeto | null>(null);
  const ultimaBusca = useRef(0);
  const montado = useRef(true);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);

  // pontos do mapa (viram "novos" só quando os números mudam)
  const status = p ? p.status : undefined;
  const lat = p?.lat ?? null, lng = p?.lng ?? null, dLat = p?.destLat ?? null, dLng = p?.destLng ?? null;
  const pontoMotorista = useMemo<Ponto | null>(() => (lat != null && lng != null ? [lat, lng] : null), [lat, lng]);
  const pontoDestino = useMemo<Ponto | null>(() => (dLat != null && dLng != null ? [dLat, dLng] : null), [dLat, dLng]);

  // tempo de chegada e trajeto reais, a partir da posição do motorista (no máximo a cada 15 s)
  useEffect(() => {
    if (status !== "a_caminho" || !pontoMotorista || !pontoDestino) { setTrajeto(null); return; }
    const buscar = () => {
      ultimaBusca.current = Date.now();
      calcularTrajeto(pontoMotorista, pontoDestino).then((t) => { if (montado.current && t) setTrajeto(t); });
    };
    // se acabou de calcular, espera o resto dos 15 s e calcula com a posição mais nova
    const falta = 15000 - (Date.now() - ultimaBusca.current);
    if (falta > 0) { const t = setTimeout(buscar, falta); return () => clearTimeout(t); }
    buscar();
  }, [status, pontoMotorista, pontoDestino]);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  // No computador as etapas já aparecem abertas; no celular ficam recolhidas
  useEffect(() => {
    const m = window.matchMedia("(min-width: 900px)");
    const f = () => setLargo(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);

  const fone = soNumeros(LAVANDERIA.telefone);

  if (p === undefined) return <main className="cli"><p>{falhou ? "Sem conexão. Tentando de novo…" : "Carregando…"}</p></main>;

  if (p === null) {
    return (
      <main className="cli">
        <div className="cli-top"><Logo tamanho={48} /></div>
        <h1>Não encontramos esta entrega</h1>
        <p className="muted">Confira se o link está completo ou fale com a lavanderia.</p>
        <a className="btn primary" style={{ maxWidth: 360 }} href={`tel:+55${fone}`}>Ligar para a lavanderia</a>
      </main>
    );
  }

  const motorista = p.motorista === "rafael" ? USUARIOS.rafael : USUARIOS.admin;
  const nomeMot = motorista.nome;
  const objeto = p.tipo === "buscar" ? "buscar suas roupas" : `levar ${p.itens}`;
  const msgWhats = `https://wa.me/55${fone}?text=${encodeURIComponent(`Olá! Sou ${p.cliente}, pedido #${p.codigo} da LaveClean.`)}`;
  const t = (s: Status) => p.eventos.find((e) => e.status === s)?.em;
  const saiu = t("a_caminho");
  const restante = saiu ? Math.max(1, Math.ceil(p.etaMin - (agora - saiu) / 60000)) : p.etaMin;
  const progresso = p.status === "a_caminho" && saiu ? Math.min(0.92, (agora - saiu) / 60000 / p.etaMin) : p.status === "agendado" ? 0 : 1;

  let titulo = "";
  let sub = "";
  if (p.status === "agendado") { titulo = `${nomeMot} vai sair em breve`; sub = p.data > hojeISO() ? `Previsto para ${nomeDia(p.data).toLowerCase()}. Avisaremos quando sair.` : `Para ${objeto}. Avisaremos quando sair.`; }
  if (p.status === "a_caminho") { titulo = `${nomeMot} está a caminho`; sub = `Chegada em cerca de ${trajeto ? trajeto.minutos : restante} min`; }
  if (p.status === "na_portaria") { titulo = `${nomeMot} chegou na portaria`; sub = "Pode descer ou avisar a portaria."; }
  if (p.status === "concluido") { titulo = p.tipo === "buscar" ? "Roupa coletada" : "Entrega concluída"; sub = "Obrigado por escolher a LaveClean!"; }

  const etapas: { s: Status; nome: string }[] = [
    { s: "agendado", nome: "Pedido recebido" },
    { s: "a_caminho", nome: "Saiu da lavanderia" },
    { s: "na_portaria", nome: "Na portaria" },
    { s: "concluido", nome: p.tipo === "buscar" ? "Roupa coletada" : "Entregue" },
  ];
  const idxAtual = etapas.findIndex((e) => e.s === p.status);

  // quando foi a última posição recebida do motorista
  const minSemSinal = p.posEm ? Math.floor((agora - p.posEm) / 60000) : null;
  const avisoPosicao = p.posEm && (p.status === "a_caminho" || p.status === "na_portaria")
    ? (minSemSinal !== null && minSemSinal >= 3 ? `Sem sinal do ${nomeMot} há ${minSemSinal} min. Mostrando a última posição.` : `Posição atualizada às ${hora(p.posEm)}`)
    : null;

  return (
    <main className="cli">
      <div className="cli-top">
        <Logo tamanho={48} />
        <span className="muted">Pedido #{p.codigo}</span>
      </div>

      <div className="cli-grid">
        <section>
          {p.status === "na_portaria" ? (
            <div className="banner" role="status">
              <h1 style={{ margin: 0 }}>{titulo}</h1>
              <p style={{ fontSize: "1.1rem" }}>{sub}</p>
              {p.filaPortaria && <p><b>Há fila na portaria. Já já ele entra.</b></p>}
            </div>
          ) : (
            <>
              <h1 className="cli-h1">{titulo}</h1>
              <p className="muted" style={{ fontSize: "1.1rem" }}>{sub}</p>
              {p.status === "a_caminho" && p.filaPortaria && (
                <div className="banner fila"><b>Estamos com fila na portaria. Sua entrega chega em breve.</b></div>
              )}
            </>
          )}
          {p.status !== "concluido" && (
            pontoDestino
              ? <MapaReal motorista={p.status === "agendado" ? null : pontoMotorista} destino={pontoDestino} rota={trajeto?.linha ?? null} />
              : <Mapa progresso={progresso} />
          )}
          {avisoPosicao && <p className="atualiza">{avisoPosicao}</p>}
        </section>

        <section>
          <div className="card">
            <div className="big">{nomeMot}</div>
            {"veiculo" in motorista && <p className="muted">{motorista.veiculo} · {motorista.placa}</p>}
            <p style={{ marginTop: 8 }}>{p.tipo === "buscar" ? "Vai buscar" : "Vai entregar"}: <b>{p.itens}</b></p>
            <div className="row">
              <a className="btn" href={`tel:+55${fone}`}>Ligar para {nomeMot}</a>
              <a className="btn" href={msgWhats} target="_blank" rel="noreferrer">Mandar mensagem</a>
            </div>
          </div>

          <details className="card" open={largo}>
            <summary>{largo ? "Etapas da entrega" : "Ver todas as etapas"}</summary>
            <ul className="tl">
              {etapas.map((e, i) => (
                <li key={e.s} className={i < idxAtual || p.status === "concluido" ? "done" : i === idxAtual ? "now" : ""}>
                  <span className="dot" />
                  <span>{e.nome}</span>
                  <span className="t">{t(e.s) && i <= idxAtual ? hora(t(e.s)!) : ""}</span>
                </li>
              ))}
            </ul>
          </details>

          <a className="btn dark" href={`tel:+55${fone}`}>Falar com a lavanderia</a>
        </section>
      </div>
    </main>
  );
}
