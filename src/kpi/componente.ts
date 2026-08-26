import type { Aluno } from '../types';

export type Componente = 'Português' | 'Matemática' | 'Ciências';

export const COMPONENTES: Componente[] = ['Português', 'Matemática', 'Ciências'];

const EXTRATOR: Record<Componente, (a: Aluno) => number> = {
  'Português': (a) => a.notaPortugues,
  'Matemática': (a) => a.notaMatematica,
  'Ciências': (a) => a.notaCiencias,
};

export interface MediaComponente {
  turma: string;
  componente: Componente;
  media: number;
}

/**
 * Indicador especificado na AE I e implementado nesta etapa. Responde se a
 * dificuldade é individual ou está concentrada em um componente.
 */
export function desempenhoPorComponente(alunos: Aluno[]): MediaComponente[] {
  const turmas = [...new Set(alunos.map((a) => a.turma))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const resultado: MediaComponente[] = [];

  for (const turma of turmas) {
    const daTurma = alunos.filter((a) => a.turma === turma);
    for (const componente of COMPONENTES) {
      const soma = daTurma.reduce((total, a) => total + EXTRATOR[componente](a), 0);
      resultado.push({ turma, componente, media: soma / daTurma.length });
    }
  }

  return resultado;
}

export function componenteMaisCritico(medias: MediaComponente[]): MediaComponente | null {
  if (medias.length === 0) return null;
  return medias.reduce((pior, atual) => (atual.media < pior.media ? atual : pior));
}
