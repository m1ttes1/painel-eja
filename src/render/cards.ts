import type { Indicadores } from '../kpi';
import { ROTULO_QUADRANTE, type Quadrante } from '../kpi/defasagem';
import { escapar, numero, percentual } from './formato';

function card(titulo: string, valor: string, apoio: string): string {
  return `<article class="card">
  <h3>${escapar(titulo)}</h3>
  <p class="card__valor">${escapar(valor)}</p>
  <p class="card__apoio">${escapar(apoio)}</p>
</article>`;
}

export function renderCards(ind: Indicadores): string {
  const critico = ind.componenteMaisCritico;

  const cardJanela = ind.quedaFrequencia.disponivel
    ? card(
        'Queda de frequência',
        String(ind.quedaFrequencia.quedas.length),
        ind.quedaFrequencia.quedas.length === 0
          ? 'Nenhuma queda entre os dois períodos mais recentes.'
          : `Maior queda: ${numero(Math.abs(ind.quedaFrequencia.quedas[0]!.variacaoPp))} pontos percentuais.`,
      )
    : `<article class="card card--indisponivel">
  <h3>Queda de frequência</h3>
  <p class="card__valor">—</p>
  <p class="card__apoio">${escapar(ind.quedaFrequencia.motivo)}</p>
</article>`;

  const quadrantes = (Object.keys(ind.distribuicaoDefasagem) as Quadrante[])
    .map((q) => `<li><strong>${ind.distribuicaoDefasagem[q]}</strong> — ${escapar(ROTULO_QUADRANTE[q])}</li>`)
    .join('');

  return `<section class="cards">
${card('Alunos no arquivo', String(ind.totalAlunos), 'Total de registros válidos lidos.')}
${card('Risco de evasão', percentual(ind.taxaRiscoEvasao), `${ind.alunosEmAlerta.length} aluno(s) em alerta.`)}
${card(
    'Cobertura de apoio (AEE)',
    String(ind.coberturaAee.totalComDeficiencia),
    `${ind.coberturaAee.comDeficienciaEmAlerta} também em alerta pedagógico ou de frequência.`,
  )}
${
    critico
      ? card(
          'Componente mais crítico',
          critico.componente,
          `Turma ${critico.turma}, média ${numero(critico.media)}.`,
        )
      : card('Componente mais crítico', '—', 'Sem dados suficientes.')
  }
${cardJanela}
</section>
<section class="quadrantes">
  <h3>Frequência × desempenho</h3>
  <ul>${quadrantes}</ul>
</section>`;
}
