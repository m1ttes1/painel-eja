export function numero(valor: number, casas = 1): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function percentual(valor: number, casas = 1): string {
  return `${numero(valor, casas)}%`;
}

/** Escapa texto vindo do arquivo do usuário antes de entrar em markup. */
export function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
