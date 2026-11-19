"use client";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { SeletorData } from "@/components/SeletorData";
import { useDia } from "@/lib/dia";
import { LAVANDERIA } from "@/lib/config";
import { moverParada } from "@/lib/store";
import { enderecoCompleto, hojeISO, nomeDia, rotaLink } from "@/lib/util";

const KEY = "laveclean:rota";

// Endereço de saída, cidade e "voltar no final" ficam salvos neste navegador
function useAjustes() {
  const [a, setA] = useState({ origem: LAVANDERIA.endereco, voltar: true });
  useEffect(() => {
    try { const r = localStorage.getItem(KEY); if (r) { const j = JSON.parse(r); setA((x) => ({ origem: j.origem || x.origem, voltar: j.voltar ?? x.voltar })); } } catch {}
  }, []);
  const mudar = (p: Partial<typeof a>) => {
    setA((x) => {
      const n = { ...x, ...p };
      try { localStorage.setItem(KEY, JSON.stringify(n)); } catch {}
      return n;
    });
  };
  return [a, mudar] as const;
}

export default function Rotas() {
  const [quem, setQuem] = useState<"rafael" | "admin">("rafael");
  const [aj, mudar] = useAjustes();
  const [dia, setDia] = useDia();

  return (
    <AdminShell>
      {(estado) => {
        const paradas = estado.pedidos.filter((p) => p.data === dia && p.motorista === quem && p.status !== "concluido").sort((a, b) => a.ordem - b.ordem);
        const feitas = estado.pedidos.filter((p) => p.data === dia && p.motorista === quem && p.status === "concluido").length;
        const enderecos = paradas.map((p) => enderecoCompleto(p.endereco, p.cidade));
        const origem = aj.origem.trim();
        const nome = quem === "rafael" ? "Rafael" : "Luciana";
        const buscar = paradas.filter((p) => p.tipo === "buscar").length;
        return (
          <>
            <div className="head">
              <div>
                <h1>{dia === hojeISO() ? "Rotas de hoje" : "Rotas do dia"}</h1>
                <p className="muted">{nomeDia(dia)} · dia de {nome}. Escolha a melhor ordem das paradas.</p>
              </div>
              <div className="head-dir">
              <SeletorData dia={dia} onChange={setDia} />
              <div className="tabs mot-tabs">
                <button className={quem === "rafael" ? "on" : ""} onClick={() => setQuem("rafael")}>Rafael</button>
                <button className={quem === "admin" ? "on" : ""} onClick={() => setQuem("admin")}>Luciana</button>
              </div>
              </div>
            </div>

            <div className="stats">
              <div className="stat"><b>{paradas.length}</b><span>Paradas pendentes</span></div>
              <div className="stat"><b>{buscar}</b><span>Para buscar</span></div>
              <div className="stat"><b>{paradas.length - buscar}</b><span>Para entregar</span></div>
              <div className="stat"><b>{feitas}</b><span>Já concluídas</span></div>
            </div>

            <div className="grid">
              <div className="panel">
                <h2>Ordem das paradas</h2>
                <div className="lista">
                  {paradas.length === 0 && <p className="muted">{nome} não tem paradas pendentes neste dia.</p>}
                  {paradas.map((p, i) => (
                    <div className="rota" key={p.id}>
                      <span className="num">{i + 1}</span>
                      <div className="info">
                        <b>{p.cliente}</b>
                        <span>{p.tipo === "buscar" ? "Buscar" : "Entregar"} · {p.itens}</span>
                        <span style={{ display: "block" }}>{p.endereco} · {p.cidade}</span>
                      </div>
                      <div className="mover">
                        <button className="lk" disabled={i === 0} onClick={() => moverParada(p.id, -1)} aria-label={`Subir ${p.cliente}`}>Subir</button>
                        <button className="lk" disabled={i === paradas.length - 1} onClick={() => moverParada(p.id, 1)} aria-label={`Descer ${p.cliente}`}>Descer</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h2>Rota no Google Maps</h2>
                <label htmlFor="o">Saída (lavanderia)</label>
                <input id="o" value={aj.origem} onChange={(e) => mudar({ origem: e.target.value })} placeholder="Rua, número, cidade" />
                <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 600, color: "var(--ink)" }}>
                  <input type="checkbox" style={{ width: 22, minHeight: 22 }} checked={aj.voltar} onChange={(e) => mudar({ voltar: e.target.checked })} />
                  Voltar para a lavanderia no final
                </label>
                <a className={`btn primary ${paradas.length === 0 ? "off" : ""}`} href={rotaLink(origem, enderecos, aj.voltar)} target="_blank" rel="noreferrer" aria-disabled={paradas.length === 0}>
                  Abrir rota no Google Maps
                </a>
                {paradas.length > 9 && <p className="muted" style={{ fontSize: ".85rem" }}>O Google Maps aceita até 9 paradas por rota. As primeiras 9 serão usadas.</p>}
                <div className="resumo">
                  <b>Resumo da rota</b>
                  <p>Saída: {origem}</p>
                  <p>{paradas.length} {paradas.length === 1 ? "parada" : "paradas"} na ordem ao lado{aj.voltar && origem ? ", depois volta para a lavanderia" : ""}.</p>
                  <p className="muted" style={{ fontSize: ".88rem" }}>Ao abrir, o Google Maps mostra o trajeto, o tempo e o quilômetro total. Se mudar a ordem, abra de novo.</p>
                </div>
              </div>
            </div>
          </>
        );
      }}
    </AdminShell>
  );
}
