import type { ErroLinha } from '../types';
import { escapar } from './formato';

export function renderErros(erros: ErroLinha[], totalLinhas: number, validas: number): string {
  if (erros.length === 0) return '';

  const itens = erros
    .map((e) => {
      const coluna = e.coluna ? ` (coluna <code>${escapar(e.coluna)}</code>)` : '';
      return `    <li>Linha ${e.linha}${coluna}: ${escapar(e.motivo)}</li>`;
    })
    .join('\n');

  return `<section class="erros" role="status">
  <h2>Problemas na leitura do arquivo</h2>
  <p>${validas} de ${totalLinhas} linha(s) foram lidas. Os indicadores abaixo consideram apenas essas.</p>
  <ul>
${itens}
  </ul>
</section>`;
}
