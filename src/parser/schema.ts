export const COLUNAS_OBRIGATORIAS = [
  'nome',
  'turma',
  'frequencia_pct',
  'nota_portugues',
  'nota_matematica',
  'nota_ciencias',
  'faltas_consecutivas',
] as const;

/** Aceita vírgula ou ponto decimal. Devolve null quando não é número. */
export function lerNumero(bruto: string): number | null {
  const limpo = bruto.trim().replace(',', '.');
  if (limpo === '') return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : null;
}

export interface FaixaNumerica {
  min: number;
  max: number;
}

export const FAIXAS: Record<string, FaixaNumerica> = {
  frequencia_pct: { min: 0, max: 100 },
  nota_portugues: { min: 0, max: 10 },
  nota_matematica: { min: 0, max: 10 },
  nota_ciencias: { min: 0, max: 10 },
  faltas_consecutivas: { min: 0, max: 999 },
  idade: { min: 0, max: 120 },
};
