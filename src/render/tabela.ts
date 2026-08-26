import type { Indicadores } from '../kpi';
import { escapar, numero, percentual } from './formato';

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
      <td>${escapar(motivos.join(', '))}</td>
    </tr>`,
    )
    .join('\n');

  return `<section class="alerta">
  <h2>Alunos em alerta</h2>
  <p>${ind.alunosEmAlerta.length} aluno(s), ordenados por criticidade.</p>
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
