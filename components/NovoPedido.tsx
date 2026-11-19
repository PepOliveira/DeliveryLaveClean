"use client";
import { useEffect, useState } from "react";
import { CidadeCampo } from "@/components/CidadeCampo";
import { criarPedido, linkDoPedido, useEstado } from "@/lib/store";
import type { Tipo } from "@/lib/types";
import { nomeDia, whatsLink } from "@/lib/util";

export function NovoPedido({ dataPadrao }: { dataPadrao: string }) {
  const estado = useEstado();
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("Sorocaba");
  const [data, setData] = useState(dataPadrao);
  const [tipo, setTipo] = useState<Tipo>("buscar");
  const [itens, setItens] = useState("");
  const [motorista, setMotorista] = useState<"rafael" | "admin">("rafael");
  const [criado, setCriado] = useState<{ link: string; nome: string; telefone: string; data: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // acompanha o dia escolhido no topo da tela
  useEffect(() => { setData(dataPadrao); }, [dataPadrao]);

  const conhecidos = (estado?.clientes ?? []).map((c) => ({ cliente: c.nome, telefone: c.telefone, endereco: c.endereco, cidade: c.cidade }));

  function escolherCliente(nome: string) {
    setCliente(nome);
    const c = conhecidos.find((x) => x.cliente.toLowerCase() === nome.toLowerCase());
    if (c) { setTelefone(c.telefone); setEndereco(c.endereco); setCidade(c.cidade); }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);
    const id = await criarPedido({ cliente: cliente.trim(), telefone, endereco: endereco.trim(), cidade: cidade.trim(), data, tipo, itens: itens.trim(), motorista });
    setSalvando(false);
    if (!id) return; // o aviso de erro já aparece na tela
    setCriado({ link: linkDoPedido(id), nome: cliente.trim(), telefone, data });
    setCopiado(false);
    setCliente(""); setTelefone(""); setEndereco(""); setItens("");
  }

  async function copiar() {
    if (!criado) return;
    try { await navigator.clipboard.writeText(criado.link); setCopiado(true); } catch {}
  }

  if (criado) {
    return (
      <div className="panel" id="novo-pedido">
        <h2>Pedido criado!</h2>
        <p className="muted">{nomeDia(criado.data)}. Agora mande o link para {criado.nome}, para ele acompanhar a entrega.</p>
        <div className="acoes" style={{ flexDirection: "column", marginTop: 14 }} role="status">
          <a className="btn primary" style={{ margin: 0 }} href={whatsLink(criado.telefone, `Olá, ${criado.nome.split(" ")[0]}! Acompanhe sua entrega da LaveClean: ${criado.link}`)} target="_blank" rel="noreferrer">Enviar no WhatsApp</a>
          <button className="btn" style={{ margin: 0 }} onClick={copiar}>{copiado ? "Link copiado!" : "Copiar link"}</button>
          <button className="btn ghost" style={{ margin: 0 }} onClick={() => setCriado(null)}>Criar outro pedido</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel" id="novo-pedido">
      <h2>Novo pedido</h2>
      <form onSubmit={enviar}>
        <label htmlFor="c">Cliente</label>
        <input id="c" list="clientes" required value={cliente} onChange={(e) => escolherCliente(e.target.value)} placeholder="Nome do cliente" autoComplete="off" />
        <datalist id="clientes">{conhecidos.map((c) => <option key={c.cliente} value={c.cliente} />)}</datalist>

        <label htmlFor="t">WhatsApp do cliente</label>
        <input id="t" required inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(15) 99999-9999" />

        <div className="f2">
          <div>
            <label htmlFor="e">Endereço</label>
            <input id="e" required value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro" />
          </div>
          <div>
            <label htmlFor="ci">Cidade</label>
            <CidadeCampo id="ci" valor={cidade} onChange={setCidade} />
          </div>
        </div>

        <label>O que vai fazer?</label>
        <div className="seg">
          <button type="button" className={tipo === "buscar" ? "on" : ""} onClick={() => setTipo("buscar")}>Buscar roupa</button>
          <button type="button" className={tipo === "entregar" ? "on" : ""} onClick={() => setTipo("entregar")}>Entregar roupa</button>
        </div>

        <div className="f2">
          <div>
            <label htmlFor="i">O que é?</label>
            <input id="i" required value={itens} onChange={(e) => setItens(e.target.value)} placeholder="Ex.: 2 cortinas" />
          </div>
          <div>
            <label htmlFor="d">Para qual dia?</label>
            <input id="d" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>

        <label>Quem vai levar?</label>
        <div className="seg">
          <button type="button" className={motorista === "rafael" ? "on" : ""} onClick={() => setMotorista("rafael")}>Rafael</button>
          <button type="button" className={motorista === "admin" ? "on" : ""} onClick={() => setMotorista("admin")}>Luciana</button>
        </div>

        <button className="btn primary" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Criar pedido e gerar link"}</button>
      </form>
    </div>
  );
}
