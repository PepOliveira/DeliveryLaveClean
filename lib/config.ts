export const LAVANDERIA = {
  nome: "LaveClean",
  // Mesmo número para ligar ou mandar mensagem (lavanderia, Rafael e Luciana)
  telefone: "15996606503",
  endereco: "Av. São Paulo, 597, Além Ponte, Sorocaba - SP",
};

export const CIDADES = ["Sorocaba", "Itu"];

// PIN do menu inicial: definido em NEXT_PUBLIC_PIN (.env.local e Vercel). Não fica no código.
export const PIN = process.env.NEXT_PUBLIC_PIN ?? "";

export const USUARIOS = {
  admin: { id: "admin", nome: "Luciana", telefone: LAVANDERIA.telefone },
  rafael: { id: "rafael", nome: "Rafael", telefone: LAVANDERIA.telefone, veiculo: "Fiat Argo", placa: "G4FHJ24" },
} as const;
