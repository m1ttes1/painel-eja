import type { Aluno } from '../types';

export interface MediaTurma {
  turma: string;
  valor: number;
  alunos: number;
}

function mediaPorTurma(alunos: Aluno[], extrair: (a: Aluno) => number): MediaTurma[] {
  const acumulado = new Map<string, { soma: number; contagem: number }>();

  for (const aluno of alunos) {
    const atual = acumulado.get(aluno.turma) ?? { soma: 0, contagem: 0 };
    atual.soma += extrair(aluno);
    atual.contagem += 1;
    acumulado.set(aluno.turma, atual);
  }

  return [...acumulado.entries()]
    .map(([turma, { soma, contagem }]) => ({ turma, valor: soma / contagem, alunos: contagem }))
    .sort((a, b) => a.turma.localeCompare(b.turma, 'pt-BR'));
}

export function frequenciaPorTurma(alunos: Aluno[]): MediaTurma[] {
  return mediaPorTurma(alunos, (a) => a.frequenciaPct);
}

export function desempenhoPorTurma(alunos: Aluno[]): MediaTurma[] {
  return mediaPorTurma(alunos, (a) => a.mediaNotas);
}
