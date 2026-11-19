"use client";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { CidadeCampo } from "@/components/CidadeCampo";
import { novoIdCliente, salvarCliente } from "@/lib/store";
import type { Cliente, Estado } from "@/lib/types";

function Editor({ cliente, onSalvo, pedidos }: { cliente: Cliente; onSalvo: (c: Cliente) => void; pedidos: number }) {
  const [f, setF] = useState(cliente);
  const [salvo, setSalvo] = useState(false);
  const set = (p: Partial<Cliente>) => { setF({ ...f, ...p }); setSalvo(false); };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const limpo = { ...f, nome: f.nome.trim(), endereco: f.endereco.trim(), telefone: f.telefone.trim(), cidade: f.cidade.trim(), obs: f.obs.trim() };
        salvarCliente(limpo);
        onSalvo(limpo);
        setSalvo(true);
      }}
    >
      <label htmlFor="n">Nome</label>
      <input id="n" required value={f.nome} onChange={(e) => set({ nome: e.target.value })} />
      <label htmlFor="t">WhatsApp / telefone</label>
      <input id="t" required inputMode="tel" value={f.telefone} onChange={(e) => set({ telefone: e.target.value })} placeholder="(15) 99999-9999" />
      <label htmlFor="e">Endereço</label>
      <input id="e" required value={f.endereco} onChange={(e) => set({ endereco: e.target.value })} placeholder="Rua, número, bairro" />
      <label htmlFor="ci">Cidade</label>
      <CidadeCampo id="ci" valor={f.cidade} onChange={(v) => set({ cidade: v })} />
      <label htmlFor="o">Observações (portaria, ponto de referência)</label>
      <textarea id="o" value={f.obs} onChange={(e) => set({ obs: e.target.value })} placeholder="Ex.: Tocar o interfone do bloco B" />
      <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
        <button className="btn primary" type="submit" style={{ width: "auto", marginTop: 0, padding: "12px 28px" }}>Salvar alterações</button>
        {salvo && <span className="ok-msg" role="status">Salvo!</span>}
      </div>
      <p className="muted" style={{ fontSize: ".88rem", marginTop: 12 }}>
        {pedidos} {pedidos === 1 ? "pedido" : "pedidos"} deste cliente. Ao salvar, os pedidos em andamento usam os dados novos.
      </p>
    </form>
  );
}

function Conteudo({ estado }: { estado: Estado }) {
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [novo, setNovo] = useState<Cliente | null>(null);

  const lista = [...estado.clientes]
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .filter((c) => (c.nome + c.endereco + c.cidade + c.telefone).toLowerCase().includes(busca.toLowerCase()));
  const atual = novo ?? estado.clientes.find((c) => c.id === sel) ?? null;

  return (
    <>
      <div className="head">
        <div>
          <h1>Clientes</h1>
          <p className="muted">Toque em um cliente para ver e alterar os dados dele.</p>
        </div>
        <button className="btn primary" style={{ width: "auto", marginTop: 0, padding: "12px 24px" }}
          onClick={() => { setSel(null); setNovo({ id: novoIdCliente("novo"), nome: "", telefone: "", endereco: "", cidade: "Sorocaba", obs: "" }); }}>
          + Novo cliente
        </button>
      </div>

      <div className="grid dois">
        <div className={`panel ${atual ? "oculta-m" : ""}`}>
          <input type="search" aria-label="Buscar cliente" placeholder="Buscar por nome, endereço ou telefone" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ marginBottom: 8 }} />
          <div className="cli-lista">
            {lista.length === 0 && <p className="muted">Nenhum cliente encontrado.</p>}
            {lista.map((c) => (
              <button key={c.id} className={`cli-item ${atual?.id === c.id ? "on" : ""}`} onClick={() => { setNovo(null); setSel(c.id); }}>
                <b>{c.nome}</b>
                <span>{c.endereco} · {c.cidade}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={`panel ${atual ? "" : "oculta-m"}`}>
          {atual ? (
            <>
              <button className="lk so-mobile" style={{ marginBottom: 10, width: "fit-content" }} onClick={() => { setNovo(null); setSel(null); }}>← Voltar para a lista</button>
              <h2>{novo ? "Novo cliente" : atual.nome}</h2>
              <Editor key={atual.id} cliente={atual} pedidos={estado.pedidos.filter((p) => p.clienteId === atual.id).length}
                onSalvo={(c) => { setNovo(null); setSel(c.id); }} />
            </>
          ) : (
            <p className="muted">Escolha um cliente na lista ao lado ou cadastre um novo.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default function Clientes() {
  return <AdminShell>{(estado) => <Conteudo estado={estado} />}</AdminShell>;
}
