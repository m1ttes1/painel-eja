import type { Indicadores } from '../kpi';
import { escapar, numero, percentual } from './formato';

function corMotivo(motivo: string): string {
  const cor = motivo.includes('freq') ? '#b02a2a' : motivo.includes('faltas') ? '#d97706' : motivo.includes('notas') ? '#b02a2a' : '#0369a1';
  return `<span style="background:${cor};color:#fff;padding:2px 6px;border-radius:3px;font-size:0.8rem;margin-right:4px">${escapar(motivo)}</span>`;
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
