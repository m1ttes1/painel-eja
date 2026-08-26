import { LIMIARES_PADRAO, validarLimiares, type Limiares } from './limiares';

export const CHAVE_ARMAZENAMENTO = 'painel-eja:limiares';

export function carregarLimiares(): Limiares {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (bruto === null) return { ...LIMIARES_PADRAO };
    return validarLimiares(JSON.parse(bruto));
  } catch {
    return { ...LIMIARES_PADRAO };
  }
}

export function salvarLimiares(limiares: Limiares): void {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(limiares));
  } catch {
    // Navegador com armazenamento bloqueado: o painel segue funcionando
    // com os limiares em memória. Não é motivo para interromper o uso.
  }
}
