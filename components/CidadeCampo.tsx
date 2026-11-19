"use client";
import { CIDADES } from "@/lib/config";

// Escolha simples entre as cidades de sempre; "Outra" abre um campo para digitar
export function CidadeCampo({ id, valor, onChange }: { id: string; valor: string; onChange: (v: string) => void }) {
  const outra = !CIDADES.includes(valor);
  return (
    <>
      <select id={id} value={outra ? "__outra" : valor} onChange={(e) => onChange(e.target.value === "__outra" ? "" : e.target.value)}>
        {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
        <option value="__outra">Outra cidade…</option>
      </select>
      {outra && <input aria-label="Nome da cidade" value={valor} onChange={(e) => onChange(e.target.value)} placeholder="Digite a cidade" style={{ marginTop: 8 }} required />}
    </>
  );
}
