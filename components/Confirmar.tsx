"use client";
export function Confirmar({ titulo, texto, sim, onSim, onNao }: {
  titulo: string; texto?: string; sim: string; onSim: () => void; onNao: () => void;
}) {
  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div>
        <h2>{titulo}</h2>
        {texto && <p className="muted">{texto}</p>}
        <button className="btn primary" onClick={onSim}>{sim}</button>
        <button className="btn ghost" onClick={onNao}>Não, voltar</button>
      </div>
    </div>
  );
}
