"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { PIN, USUARIOS } from "@/lib/config";
import { entrar, useSessao, type Papel } from "@/lib/session";

export default function Inicio() {
  const router = useRouter();
  const sessao = useSessao();
  const [quem, setQuem] = useState<Papel | null>(null);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");

  // quem já entrou neste aparelho vai direto para a própria tela
  useEffect(() => {
    if (sessao) router.replace(sessao === "admin" ? "/painel" : "/motorista");
  }, [sessao, router]);

  function digitar(d: string) {
    if (!PIN) { setErro("PIN não configurado no sistema."); return; }
    setErro("");
    const novo = (pin + d).slice(0, PIN.length);
    setPin(novo);
    if (novo.length === PIN.length && quem) {
      if (novo === PIN) {
        entrar(quem);
        router.replace(quem === "admin" ? "/painel" : "/motorista");
      } else {
        setErro("PIN incorreto. Tente de novo.");
        setTimeout(() => setPin(""), 400);
      }
    }
  }

  return (
    <main className="wrap">
      <div className="top"><Logo tamanho={72} /></div>
      {!quem ? (
        <>
          <h1>Quem está entrando?</h1>
          <p className="muted">Toque no seu nome.</p>
          <button className="btn primary" style={{ minHeight: 80, fontSize: "1.3rem" }} onClick={() => setQuem("admin")}>Luciana</button>
          <button className="btn primary" style={{ minHeight: 80, fontSize: "1.3rem" }} onClick={() => setQuem("rafael")}>Rafael (motorista)</button>
          <div className="tip" style={{ marginTop: 20 }}>
            Cliente? Você não precisa entrar. Abra o link que a LaveClean enviou no WhatsApp.
          </div>
        </>
      ) : (
        <>
          <h1>Olá, {USUARIOS[quem].nome}</h1>
          <p className="muted">Digite o PIN de {PIN.length} números.</p>
          <div className="pin" aria-label={`${pin.length} de ${PIN.length} dígitos`}>
            {Array.from({ length: PIN.length }, (_, i) => <i key={i} className={i < pin.length ? "on" : ""} />)}
          </div>
          <div className="err" role="alert">{erro}</div>
          <div className="pad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button key={d} onClick={() => digitar(d)}>{d}</button>)}
            <button onClick={() => { setQuem(null); setPin(""); setErro(""); }} style={{ fontSize: "1rem" }}>Voltar</button>
            <button onClick={() => digitar("0")}>0</button>
            <button onClick={() => setPin(pin.slice(0, -1))} style={{ fontSize: "1rem" }}>Apagar</button>
          </div>
        </>
      )}
    </main>
  );
}
