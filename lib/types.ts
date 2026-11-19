export type Tipo = "buscar" | "entregar";
export type Status = "agendado" | "a_caminho" | "na_portaria" | "concluido";

export interface Evento {
  status: Status;
  em: number;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  cidade: string;
  obs: string; // instruções de portaria, ponto de referência etc.
}

export interface Pedido {
  id: string;
  codigo: number;
  clienteId: string;
  cliente: string;
  telefone: string;
  endereco: string;
  cidade: string;
  data: string; // dia da coleta/entrega (AAAA-MM-DD)
  tipo: Tipo;
  itens: string;
  motorista: "rafael" | "admin";
  status: Status;
  eventos: Evento[];
  etaMin: number;
  filaPortaria: boolean;
  criadoEm: number;
  ordem: number; // posição na rota do dia (menor = primeiro)
  destLat: number | null; // endereço do cliente no mapa
  destLng: number | null;
  lat: number | null; // última posição do motorista
  lng: number | null;
  posEm: number | null; // quando a posição foi enviada
}

export interface Estado {
  clientes: Cliente[];
  pedidos: Pedido[];
}

export const ORDEM: Status[] = ["agendado", "a_caminho", "na_portaria", "concluido"];

export const ROTULO_STATUS: Record<Status, string> = {
  agendado: "Aguardando saída",
  a_caminho: "A caminho",
  na_portaria: "Na portaria",
  concluido: "Concluído",
};
