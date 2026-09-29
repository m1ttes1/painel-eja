import type { Indicadores } from '../kpi';
import { escapar, numero, percentual } from './formato';

const ETIQUETA: Record<string, { texto: string; cor: string }> = {
  'freq. baixa': { texto: 'frequência baixa', cor: '#b02a2a' },
  'faltas seguidas': { texto: 'faltas seguidas', cor: '#b45309' },
  'notas baixas': { texto: 'notas baixas', cor: '#6d28d9' },
};

function corMotivo(motivo: string): string {
  const e = ETIQUETA[motivo] ?? { texto: motivo, cor: '#0369a1' };
  return `<span style="background:${e.cor};color:#fff;padding:2px 8px;border-radius:999px;font-size:0.8rem;margin:0 4px 2px 0;display:inline-block">${escapar(e.texto)}</span>`;
}

export function renderQuedas(ind: Indicadores): string {
  if (!ind.quedaFrequencia.disponivel || ind.quedaFrequencia.quedas.length === 0) return '';
  const { quedas } = ind.quedaFrequencia;
  const linhas = quedas
    .slice(0, 10)
    .map((q) => `    <tr><td>${escapar(q.nome)}</td><td>${escapar(q.turma)}</td><td>${percentual(q.frequenciaAnterior, 0)} → ${percentual(q.frequenciaAtual, 0)}</td><td>${numero(q.variacaoPp, 0)} pontos</td></tr>`)
    .join('\n');
  return `<section class="alerta">
  <h2>Quem está começando a faltar mais</h2>
  <p>De ${escapar(quedas[0]!.periodoAnterior)} para ${escapar(quedas[0]!.periodoAtual)}. Ainda frequentam, mas a presença caiu. Vale conversar antes que parem de vir.</p>
  <table>
    <caption>As 10 maiores quedas de frequência entre os dois últimos períodos</caption>
    <thead><tr><th scope="col">Aluno</th><th scope="col">Turma</th><th scope="col">Frequência</th><th scope="col">Diferença</th></tr></thead>
    <tbody>
${linhas}
    </tbody>
  </table>
</section>`;
}

export function renderTabelaAlerta(ind: Indicadores): string {
  if (ind.alunosEmAlerta.length === 0) {
    return `<section class="alerta">
  <h2>Alunos em alerta</h2>
  <p>Nenhum aluno em alerta com os limiares atuais.</p>
</section>`;
  }

  const linhas = ind.alunosEmAlerta
    .map(
      ({ aluno, motivos }) => `    <tr>
      <td>${escapar(aluno.nome)}</td>
      <td>${escapar(aluno.turma)}</td>
      <td>${percentual(aluno.frequenciaPct)}</td>
      <td>${numero(aluno.mediaNotas)}</td>
      <td>${aluno.faltasConsecutivas}</td>
      <td>${motivos.map(corMotivo).join('')}</td>
    </tr>`,
    )
    .join('\n');

  return `<section class="alerta">
  <h2>Alunos que precisam de atenção</h2>
  <p>${ind.alunosEmAlerta.length} alunos. Os casos mais graves aparecem primeiro.</p>
  <table>
    <caption>Alunos em situação de alerta, do mais crítico ao menos crítico</caption>
    <thead>
      <tr><th scope="col">Aluno</th><th scope="col">Turma</th><th scope="col">Frequência</th><th scope="col">Média</th><th scope="col">Faltas seguidas</th><th scope="col">Motivos</th></tr>
    </thead>
    <tbody>
${linhas}
    </tbody>
  </table>
</section>`;
}
