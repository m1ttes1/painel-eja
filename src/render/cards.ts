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
        'Frequência caindo',
        String(ind.quedaFrequencia.quedas.length),
        ind.quedaFrequencia.quedas.length === 0
          ? 'Nenhuma queda entre os dois períodos mais recentes.'
          : `Alunos que passaram a faltar mais. Maior caso: de ${percentual(ind.quedaFrequencia.quedas[0]!.frequenciaAnterior, 0)} para ${percentual(ind.quedaFrequencia.quedas[0]!.frequenciaAtual, 0)}.`,
        'card--info',
        'Alunos cuja frequência caiu entre os dois períodos mais recentes do arquivo',
      )
    : card('Frequência caindo', '—', ind.quedaFrequencia.motivo, 'card--indisponivel', 'Precisa de pelo menos dois períodos no arquivo');

  const quadrantes = (Object.keys(ind.distribuicaoDefasagem) as Quadrante[])
    .map((q) => `<li><strong>${ind.distribuicaoDefasagem[q]}</strong>${escapar(ROTULO_QUADRANTE[q])}</li>`)
    .join('');

  const classRisco = ind.taxaRiscoEvasao > 20 ? 'card--critico' : ind.taxaRiscoEvasao > 10 ? 'card--aviso' : 'card--sucesso';
  const classAEE = ind.coberturaAee.comDeficienciaEmAlerta > 0 ? 'card--aviso' : 'card--info';

  return `<section class="cards">
${ind.periodoAtual
    ? card('Alunos no período', String(ind.totalAlunos), `Período ${ind.periodoAtual}. Histórico com ${ind.totalRegistros} registros.`, 'card--info', 'Alunos do período mais recente do arquivo')
    : card('Alunos no arquivo', String(ind.totalAlunos), 'Total de registros válidos lidos.', 'card--info', 'Quantidade total de alunos carregados do arquivo')}
${card('Risco de evasão', percentual(ind.taxaRiscoEvasao), `${ind.alunosEmAlerta.length} de ${ind.totalAlunos} alunos precisam de atenção.`, classRisco, 'Alunos com frequência baixa, faltas seguidas ou notas abaixo da média mínima')}
${card(
    'Alunos com deficiência (AEE)',
    String(ind.coberturaAee.totalComDeficiencia),
    ind.coberturaAee.comDeficienciaEmAlerta === 1 ? "1 deles também está em alerta." : `${ind.coberturaAee.comDeficienciaEmAlerta} deles também estão em alerta.`,
    classAEE,
    'Alunos com deficiência identificados no arquivo'
  )}
${
    critico
      ? card(
          'Disciplina com menor média',
          critico.componente,
          `Turma ${critico.turma}, média ${numero(critico.media)}.`,
          'card--aviso',
          'Disciplina com menor desempenho médio entre as turmas'
        )
      : card('Disciplina com menor média', '—', 'Sem dados suficientes.', 'card--indisponivel', 'Necessário histórico de mais de um período')
  }
${cardJanela}
</section>
<section class="quadrantes">
  <h3>Frequência × desempenho</h3>
  <ul>${quadrantes}</ul>
</section>`;
}
