"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, LogOut, PanelLeftClose, PanelLeftOpen, Route, Truck, Users } from "lucide-react";
import { AvisoErro } from "@/components/AvisoErro";
import { Logo } from "@/components/Logo";
import { useErroDados, useEstado } from "@/lib/store";
import { entrar, sair, useSessao } from "@/lib/session";
import type { Estado } from "@/lib/types";

const MENU = [
  { href: "/painel", nome: "Pedidos", Icone: ClipboardList },
  { href: "/rotas", nome: "Rotas", Icone: Route },
  { href: "/calendario", nome: "Calendário", Icone: CalendarDays },
  { href: "/clientes", nome: "Clientes", Icone: Users },
];

const KEY = "laveclean:menu";

// Menu lateral (recolhível no computador) das telas da Luciana. Quem não entrou volta ao menu inicial.
export function AdminShell({ children }: { children: (estado: Estado) => React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const sessao = useSessao();
  const estado = useEstado();
  const erro = useErroDados();
  const [recolhido, setRecolhido] = useState(false);

  useEffect(() => {
    try { setRecolhido(localStorage.getItem(KEY) === "1"); } catch {}
  }, []);

  function alternar() {
    setRecolhido((r) => {
      try { localStorage.setItem(KEY, r ? "0" : "1"); } catch {}
      return !r;
    });
  }

  useEffect(() => {
    if (sessao === null) router.replace("/");
    else if (sessao === "rafael") router.replace("/motorista");
  }, [sessao, router]);

  if (erro && !estado) return <main className="wrap"><AvisoErro /><h1>Sem conexão com os dados</h1><p className="muted">{erro}</p></main>;
  if (!estado || sessao !== "admin") return <main className="wrap"><p>Carregando…</p></main>;

  const sairDaConta = () => { sair(); router.replace("/"); };

  return (
    <div className={`adm ${recolhido ? "rec" : ""}`}>
      <div className="m-top">
        <Logo tamanho={44} />
        <button className="lk" onClick={sairDaConta}>Sair</button>
      </div>
      <aside>
        <button className="alca so-desk" title={recolhido ? "Abrir menu" : "Recolher menu"} aria-label={recolhido ? "Abrir menu" : "Recolher menu"} aria-expanded={!recolhido} onClick={alternar}>
          {recolhido ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
        </button>
        <div className="logo-lado"><Logo tamanho={84} /></div>
        {MENU.map(({ href, nome, Icone }) => (
          <Link key={href} href={href} className={`nav ${path === href ? "on" : ""}`} title={nome} aria-label={nome}>
            <Icone size={22} aria-hidden />
            <span className="rot">{nome}</span>
          </Link>
        ))}
        <Link className="nav" href="/motorista" title="Eu vou entregar" aria-label="Eu vou entregar" onClick={() => entrar("admin")}>
          <Truck size={22} aria-hidden />
          <span className="rot"><span className="lg">Eu vou entregar</span><span className="sm">Entregar</span></span>
        </Link>
        <div className="sp" />
        <button className="nav so-desk" title="Sair" aria-label="Sair" onClick={sairDaConta}>
          <LogOut size={22} aria-hidden /><span className="rot">Sair</span>
        </button>
      </aside>
      <main><AvisoErro />{children(estado)}</main>
    </div>
  );
}
