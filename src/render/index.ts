import { LIMIARES_PADRAO } from '../config/limiares';
import type { Indicadores } from '../kpi';
import type { ErroLinha } from '../types';
import { graficoBarras } from './barras';
import { renderCards } from './cards';
import { renderErros } from './erros';
import { renderTabelaAlerta } from './tabela';

export function renderPainel(
  ind: Indicadores,
  erros: ErroLinha[],
  totalLinhas: number,
  limiarFrequencia = LIMIARES_PADRAO.frequenciaMinima,
  limiarNota = LIMIARES_PADRAO.notaMinima,
): string {
  const graficoFrequencia = graficoBarras({
    titulo: 'Frequência média por turma',
    itens: ind.frequenciaPorTurma.map((t) => ({ rotulo: t.turma, valor: t.valor })),
    maximo: 100,
    limiar: limiarFrequencia,
    sufixo: '%',
  });

  const graficoDesempenho = graficoBarras({
    titulo: 'Desempenho médio por turma',
    itens: ind.desempenhoPorTurma.map((t) => ({ rotulo: t.turma, valor: t.valor })),
    maximo: 10,
    limiar: limiarNota,
  });

  const graficoComponente = graficoBarras({
    titulo: 'Desempenho médio por componente curricular',
    itens: ind.desempenhoPorComponente.map((c) => ({ rotulo: `${c.turma} — ${c.componente}`, valor: c.media })),
    maximo: 10,
    limiar: limiarNota,
  });

  return `${renderErros(erros, totalLinhas, ind.totalAlunos)}
${renderCards(ind)}
<section class="graficos">
${graficoFrequencia}
${graficoDesempenho}
${graficoComponente}
</section>
${renderTabelaAlerta(ind)}`;
}

export { renderCards } from './cards';
export { renderErros } from './erros';
export { renderTabelaAlerta } from './tabela';
