import type { Indicadores } from '../kpi';
import { ROTULO_QUADRANTE, type Quadrante } from '../kpi/defasagem';
import { escapar, numero, percentual } from './formato';

function card(titulo: string, valor: string, apoio: string, classeExtra?: string, tooltip?: string): string {
  const classe = classeExtra ? `card ${classeExtra}` : 'card';
  const tooltipAttr = tooltip ? ` title="${escapar(tooltip)}"` : '';
  return `<article class="${classe}"${tooltipAttr}>
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
    : card('Queda de frequência', '—', ind.quedaFrequencia.motivo, 'card--indisponivel');

  const quadrantes = (Object.keys(ind.distribuicaoDefasagem) as Quadrante[])
    .map((q) => `<li><strong>${ind.distribuicaoDefasagem[q]}</strong> — ${escapar(ROTULO_QUADRANTE[q])}</li>`)
    .join('');

  const classRisco = ind.taxaRiscoEvasao > 20 ? 'card--critico' : ind.taxaRiscoEvasao > 10 ? 'card--aviso' : 'card--sucesso';
  const classAEE = ind.coberturaAee.comDeficienciaEmAlerta > 0 ? 'card--aviso' : 'card--info';

  return `<section class="cards">
${card('Alunos no arquivo', String(ind.totalAlunos), 'Total de registros válidos lidos.', 'card--info', 'Quantidade total de alunos carregados do arquivo')}
${card('Risco de evasão', percentual(ind.taxaRiscoEvasao), `${ind.alunosEmAlerta.length} aluno(s) em alerta.`, classRisco, 'Percentual de alunos em risco de evasão (baixa frequência + baixas notas)')}
${card(
    'Cobertura de apoio (AEE)',
    String(ind.coberturaAee.totalComDeficiencia),
    `${ind.coberturaAee.comDeficienciaEmAlerta} também em alerta pedagógico ou de frequência.`,
    classAEE,
    'Alunos com deficiência identificados no arquivo'
  )}
${
    critico
      ? card(
          'Componente mais crítico',
          critico.componente,
          `Turma ${critico.turma}, média ${numero(critico.media)}.`,
          'card--aviso',
          'Disciplina com menor desempenho médio entre as turmas'
        )
      : card('Componente mais crítico', '—', 'Sem dados suficientes.', 'card--indisponivel', 'Necessário histórico de mais de um período')
  }
${cardJanela}
</section>
<section class="quadrantes">
  <h3>Frequência × desempenho</h3>
  <ul>${quadrantes}</ul>
</section>`;
}
