"use client";
import { useAviso, useErroDados } from "@/lib/store";

// Faixa que aparece se algo não for salvo ou se os dados não carregarem
export function AvisoErro() {
  const aviso = useAviso();
  const erro = useErroDados();
  const texto = aviso ?? (erro ? "Não foi possível carregar os dados. Confira a internet." : null);
  if (!texto) return null;
  return <div className="aviso-erro" role="alert">{texto}</div>;
}
