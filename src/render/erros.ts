import type { ErroLinha } from '../types';
import { escapar } from './formato';

const LIMITE_ERROS_EXIBIDOS = 25;

export function renderErros(erros: ErroLinha[], totalLinhas: number, validas: number): string {
  if (erros.length === 0) return '';

  const visiveis = erros.slice(0, LIMITE_ERROS_EXIBIDOS);
  const restantes = erros.length - visiveis.length;

  const itens = visiveis
    .map((e) => {
      const coluna = e.coluna ? ` (coluna <code>${escapar(e.coluna)}</code>)` : '';
      return `    <li>Linha ${e.linha}${coluna}: ${escapar(e.motivo)}</li>`;
    })
    .join('\n');

  const itemRestantes = restantes > 0 ? `\n    <li>… e mais ${restantes} problema(s).</li>` : '';

  return `<section class="erros" role="status">
  <h2>Problemas na leitura do arquivo</h2>
  <p>${validas} de ${totalLinhas} linha(s) foram lidas. Os indicadores abaixo consideram apenas essas.</p>
  <ul>
${itens}${itemRestantes}
  </ul>
</section>`;
}
