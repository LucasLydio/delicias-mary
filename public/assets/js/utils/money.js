export function formatBRLFromCents(cents) {
  const value = (Number.parseInt(String(cents ?? 0), 10) || 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

