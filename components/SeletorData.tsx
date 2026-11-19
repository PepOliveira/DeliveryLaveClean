"use client";
import { hojeISO, somarDias } from "@/lib/util";

export function SeletorData({ dia, onChange }: { dia: string; onChange: (d: string) => void }) {
  const hoje = hojeISO();
  return (
    <div className="dia">
      <button className="lk" onClick={() => onChange(somarDias(dia, -1))} aria-label="Dia anterior">← Anterior</button>
      <input type="date" aria-label="Escolher o dia" value={dia} onChange={(e) => e.target.value && onChange(e.target.value)} />
      <button className="lk" onClick={() => onChange(somarDias(dia, 1))} aria-label="Próximo dia">Próximo →</button>
      {dia !== hoje && <button className="lk pri" onClick={() => onChange(hoje)}>Voltar para hoje</button>}
    </div>
  );
}
