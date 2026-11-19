"use client";
import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { NovoPedido } from "@/components/NovoPedido";
import { SeletorData } from "@/components/SeletorData";
import { useDia } from "@/lib/dia";
import { linkDoPedido } from "@/lib/store";
import { ROTULO_STATUS, type Pedido } from "@/lib/types";
import { hojeISO, nomeDia, whatsLink } from "@/lib/util";

function mensagem(p: Pedido, link: string) {
  const o = p.tipo === "buscar" ? "buscar suas roupas" : "entregar suas roupas";
  return `Olá, ${p.cliente.split(" ")[0]}! A LaveClean está saindo para ${o} (${p.itens}). Acompanhe sua entrega: ${link}`;
}

function Linha({ p }: { p: Pedido }) {
  const [copiado, setCopiado] = useState(false);
  const link = typeof window !== "undefined" ? linkDoPedido(p.id) : "";
  async function copiar() {
    try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch {}
  }
  const pill = p.status === "na_portaria" ? "ok" : p.status === "a_caminho" ? "az" : "";
  return (
    <div className="ped">
      <div className="l1">
        <span className="nm">{p.cliente}</span>
        <span className={`pill ${pill}`}>{ROTULO_STATUS[p.status]}</span>
      </div>
      <div className="l2">
        {p.tipo === "buscar" ? "Buscar" : "Entregar"} · {p.itens} · {p.endereco} · {p.motorista === "rafael" ? "Rafael" : "Luciana"}
        {p.filaPortaria && p.status === "na_portaria" ? " · Fila na portaria" : ""}
      </div>
      <div className="acoes">
        <a className="lk pri" href={whatsLink(p.telefone, mensagem(p, link))} target="_blank" rel="noreferrer">Enviar no WhatsApp</a>
        <button className="lk" onClick={copiar}>{copiado ? "Link copiado!" : "Copiar link"}</button>
        <Link className="lk" href={`/acompanhe/${p.id}`} target="_blank">Ver tela do cliente</Link>
      </div>
    </div>
  );
}

export default function Painel() {
  const [aba, setAba] = useState<"ativos" | "concluidos">("ativos");
  const [dia, setDia] = useDia();

  return (
    <AdminShell>
      {(estado) => {
        const doDia = estado.pedidos.filter((p) => p.data === dia);
        const ativos = doDia.filter((p) => p.status !== "concluido");
        const concluidos = doDia.filter((p) => p.status === "concluido");
        const conta = (s: string) => doDia.filter((p) => p.status === s).length;
        const naPortaria = doDia.filter((p) => p.status === "na_portaria");
        const ehHoje = dia === hojeISO();
        const lista = aba === "ativos" ? ativos : concluidos;
        return (
          <>
            <div className="head">
              <div>
                <h1>{ehHoje ? "Pedidos de hoje" : "Pedidos do dia"}</h1>
                <p className="muted">{nomeDia(dia)}</p>
              </div>
              <div className="head-dir">
              <SeletorData dia={dia} onChange={setDia} />
              <div className="help">
                <button aria-label="Como funciona?" aria-describedby="ajuda">?</button>
                <div className="pop" id="ajuda" role="tooltip">
                  <b>Como funciona</b><br />
                  1) Crie o pedido ao lado.<br />
                  2) Envie o link ao cliente pelo WhatsApp.<br />
                  3) O motorista aperta os botões no celular e o cliente vê tudo em tempo real.<br />
                  Use as setas do topo para ver ou planejar outros dias.
                </div>
              </div>
              </div>
            </div>

            <a className="btn primary so-mobile" href="#novo-pedido" style={{ marginTop: 0 }}>+ Novo pedido</a>

            <div className="stats">
              <div className="stat"><b>{conta("agendado")}</b><span>Aguardando saída</span></div>
              <div className="stat"><b className="az">{conta("a_caminho")}</b><span>A caminho</span></div>
              <div className="stat"><b>{conta("na_portaria")}</b><span>Na portaria</span></div>
              <div className="stat"><b>{conta("concluido")}</b><span>Concluídos</span></div>
            </div>

            {naPortaria.map((p) => (
              <div className="strip" key={p.id} role="status">
                {p.motorista === "rafael" ? "Rafael" : "Luciana"} está na portaria de {p.cliente}. O cliente já foi avisado.
              </div>
            ))}

            <div className="grid">
              <div className="panel">
                <div className="tabs">
                  <button className={aba === "ativos" ? "on" : ""} onClick={() => setAba("ativos")}>Em andamento ({ativos.length})</button>
                  <button className={aba === "concluidos" ? "on" : ""} onClick={() => setAba("concluidos")}>Concluídos ({concluidos.length})</button>
                </div>
                <div className="lista">
                  {lista.length === 0 && <p className="muted">{aba === "ativos" ? "Nenhum pedido em andamento neste dia. Crie um ao lado." : "Nenhum pedido concluído ainda."}</p>}
                  {lista.map((p) => <Linha key={p.id} p={p} />)}
                </div>
              </div>
              <NovoPedido dataPadrao={dia} />
            </div>
          </>
        );
      }}
    </AdminShell>
  );
}
