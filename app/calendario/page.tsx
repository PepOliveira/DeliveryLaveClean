"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useDia } from "@/lib/dia";
import type { Estado, Pedido } from "@/lib/types";
import { hojeISO, nomeDia, somarDias } from "@/lib/util";

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// "Buscar" e "Entregar" quando ainda vai acontecer; "Retirado" e "Entregue" quando já foi feito
function rotulo(p: Pedido) {
  const feito = p.status === "concluido";
  return p.tipo === "buscar" ? (feito ? "Retirado" : "Buscar") : feito ? "Entregue" : "Entregar";
}
const primeiro = (n: string) => n.split(" ")[0];
const curto = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

function mesDe(iso: string) {
  return iso.slice(0, 7) + "-01";
}
function mudarMes(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  return new Date(a, m - 1 + n, 1, 12).toLocaleDateString("sv-SE");
}
function nomeMes(mes: string) {
  const t = new Date(mes + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function Chip({ p }: { p: Pedido }) {
  const feito = p.status === "concluido";
  const cls = feito ? "ch ok" : p.tipo === "entregar" ? "ch en" : "ch";
  return (
    <span className={cls} title={`${rotulo(p)} · ${p.cliente} · ${p.itens}`}>
      <span className="ch-a">{feito ? "✓ " : ""}{rotulo(p)}</span>
      <span className="ch-n">{primeiro(p.cliente)}</span>
    </span>
  );
}

function Conteudo({ estado }: { estado: Estado }) {
  const router = useRouter();
  const [, setDiaGlobal] = useDia();
  const hoje = hojeISO();
  const [mes, setMes] = useState(mesDe(hoje));
  const [sel, setSel] = useState(hoje);
  const [vista, setVista] = useState<"calendario" | "clientes">("calendario");

  const porDia = new Map<string, Pedido[]>();
  for (const p of [...estado.pedidos].sort((a, b) => a.ordem - b.ordem)) porDia.set(p.data, [...(porDia.get(p.data) ?? []), p]);

  // grade do mês, começando no domingo
  const deslocamento = new Date(mes + "T12:00:00").getDay();
  const diasNoMes = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate();
  const semanas = Math.ceil((deslocamento + diasNoMes) / 7);
  const inicio = somarDias(mes, -deslocamento);
  const celulas = Array.from({ length: semanas * 7 }, (_, i) => somarDias(inicio, i));

  const doDia = porDia.get(sel) ?? [];

  const navMes = (
    <div className="barra-mes">
      <button className="lk" onClick={() => setMes(mudarMes(mes, -1))} aria-label="Mês anterior">← Mês anterior</button>
      <b>{nomeMes(mes)}</b>
      <button className="lk" onClick={() => setMes(mudarMes(mes, 1))} aria-label="Próximo mês">Próximo mês →</button>
      {mes !== mesDe(hoje) && <button className="lk pri" onClick={() => { setMes(mesDe(hoje)); setSel(hoje); }}>Hoje</button>}
    </div>
  );

  const ir = (rota: string) => { setDiaGlobal(sel); router.push(rota); };

  // por cliente: sequência de retiradas e entregas no mês
  const doMes = estado.pedidos.filter((p) => p.data.startsWith(mes.slice(0, 7)));
  const clientes = estado.clientes
    .map((c) => ({ c, itens: doMes.filter((p) => p.clienteId === c.id).sort((a, b) => a.data.localeCompare(b.data) || a.ordem - b.ordem) }))
    .filter((x) => x.itens.length > 0)
    .sort((a, b) => a.c.nome.localeCompare(b.c.nome));

  return (
    <>
      <div className="head">
        <div>
          <h1>Calendário de entregas</h1>
          <p className="muted">Veja quando cada roupa foi retirada e quando será entregue.</p>
        </div>
        <div className="head-dir">
          <div className="tabs mot-tabs">
            <button className={vista === "calendario" ? "on" : ""} onClick={() => setVista("calendario")}>Calendário</button>
            <button className={vista === "clientes" ? "on" : ""} onClick={() => setVista("clientes")}>Por cliente</button>
          </div>
        </div>
      </div>

      <div className="grid" style={vista === "clientes" ? { gridTemplateColumns: "1fr" } : { gridTemplateColumns: "1fr 330px" }}>
        {vista === "calendario" ? (
          <>
            <div className="panel">
              {navMes}
              <div className="semana">{SEMANA.map((d) => <span key={d}>{d}</span>)}</div>
              <p className="legenda so-mobile"><i className="pt" /> Buscar &nbsp; <i className="pt en" /> Entregar &nbsp; <i className="pt ok" /> Já feito</p>
              <div className="cal" style={{ gridTemplateRows: `repeat(${semanas}, minmax(0, 1fr))` }}>
                {celulas.map((d) => {
                  const itens = porDia.get(d) ?? [];
                  const fora = !d.startsWith(mes.slice(0, 7));
                  return (
                    <button key={d} className={`dia-cel ${fora ? "fora" : ""} ${d === hoje ? "hoje" : ""} ${d === sel ? "sel" : ""}`} onClick={() => setSel(d)} aria-label={`${nomeDia(d)}: ${itens.length} pedidos`}>
                      <span className="topo">
                        <span className="n">{Number(d.slice(8))}</span>
                        {itens.length > 0 && <span className="cont">{itens.length}</span>}
                      </span>
                      {itens.slice(0, 3).map((p) => <Chip key={p.id} p={p} />)}
                      <span className="pontos" aria-hidden>
                        {itens.slice(0, 6).map((p) => <i key={p.id} className={`pt ${p.status === "concluido" ? "ok" : p.tipo === "entregar" ? "en" : ""}`} />)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="panel">
              <h2>{nomeDia(sel)}</h2>
              <div className="lista">
                {doDia.length === 0 && <p className="muted">Nada marcado neste dia.</p>}
                {doDia.map((p) => (
                  <div className="ped" key={p.id}>
                    <div className="l1">
                      <span className="nm">{p.cliente}</span>
                      <span className={`pill ${p.status === "concluido" ? "" : p.tipo === "entregar" ? "az" : ""}`}>{rotulo(p)}</span>
                    </div>
                    <div className="l2">{p.itens} · {p.endereco}, {p.cidade} · {p.motorista === "rafael" ? "Rafael" : "Luciana"}</div>
                  </div>
                ))}
              </div>
              <div className="acoes" style={{ marginTop: 10 }}>
                <button className="lk pri" onClick={() => ir("/painel")}>+ Novo pedido neste dia</button>
                <button className="lk" onClick={() => ir("/painel")}>Ver pedidos do dia</button>
                <button className="lk" onClick={() => ir("/rotas")}>Planejar rota do dia</button>
              </div>
            </div>
          </>
        ) : (
          <div className="panel">
            {navMes}
            <div className="lista">
              {clientes.length === 0 && <p className="muted">Nenhum pedido em {nomeMes(mes)}.</p>}
              {clientes.map(({ c, itens }) => (
                <div className="ped" key={c.id}>
                  <div className="nm" style={{ marginBottom: 8 }}>{c.nome}</div>
                  <div className="fluxo">
                    {itens.map((p, i) => (
                      <span key={p.id} style={{ display: "contents" }}>
                        {i > 0 && <span className="seta" aria-hidden>→</span>}
                        <button className={`etapa ${p.status === "concluido" ? "ok" : p.tipo === "entregar" ? "en" : ""}`} onClick={() => { setSel(p.data); setVista("calendario"); }}>
                          <b>{curto(p.data)}</b> {p.status === "concluido" ? "✓ " : ""}{rotulo(p)} · {p.itens}
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Calendario() {
  return <AdminShell>{(estado) => <Conteudo estado={estado} />}</AdminShell>;
}
