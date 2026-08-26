export interface Limiares {
  /** Frequência abaixo deste valor conta como risco. Padrão 75. */
  frequenciaMinima: number;
  /** Faltas consecutivas iguais ou acima deste valor contam como risco. Padrão 3. */
  faltasConsecutivas: number;
  /** Média abaixo deste valor conta como risco. Padrão 5. */
  notaMinima: number;
}

export const LIMIARES_PADRAO: Limiares = {
  frequenciaMinima: 75,
  faltasConsecutivas: 3,
  notaMinima: 5,
};

const FAIXAS: Record<keyof Limiares, { min: number; max: number }> = {
  frequenciaMinima: { min: 0, max: 100 },
  faltasConsecutivas: { min: 1, max: 60 },
  notaMinima: { min: 0, max: 10 },
};

export function validarLimiares(parcial: unknown): Limiares {
  if (typeof parcial !== 'object' || parcial === null) return { ...LIMIARES_PADRAO };

  const bruto = parcial as Record<string, unknown>;
  const resultado = { ...LIMIARES_PADRAO };

  for (const chave of Object.keys(LIMIARES_PADRAO) as (keyof Limiares)[]) {
    const valor = bruto[chave];
    const faixa = FAIXAS[chave];
    if (typeof valor === 'number' && Number.isFinite(valor) && valor >= faixa.min && valor <= faixa.max) {
      resultado[chave] = valor;
    }
  }

  return resultado;
}
