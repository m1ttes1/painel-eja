import type { Limiares } from '../config/limiares';
import type { Aluno } from '../types';

export type Quadrante = 'regular' | 'intervencao-didatica' | 'acao-permanencia' | 'critico';

export const ROTULO_QUADRANTE: Record<Quadrante, string> = {
  regular: 'Frequente e com desempenho adequado',
  'intervencao-didatica': 'Frequente, mas com desempenho baixo — intervenção didática',
  'acao-permanencia': 'Desempenho adequado, mas ausente — ação de permanência',
  critico: 'Ausente e com desempenho baixo — atenção prioritária',
};

export function quadranteDefasagem(aluno: Aluno, limiares: Limiares): Quadrante {
  const presente = aluno.frequenciaPct >= limiares.frequenciaMinima;
  const desempenhoOk = aluno.mediaNotas >= limiares.notaMinima;

  if (presente && desempenhoOk) return 'regular';
  if (presente && !desempenhoOk) return 'intervencao-didatica';
  if (!presente && desempenhoOk) return 'acao-permanencia';
  return 'critico';
}

export function distribuicaoDefasagem(alunos: Aluno[], limiares: Limiares): Record<Quadrante, number> {
  const contagem: Record<Quadrante, number> = {
    regular: 0,
    'intervencao-didatica': 0,
    'acao-permanencia': 0,
    critico: 0,
  };
  for (const aluno of alunos) contagem[quadranteDefasagem(aluno, limiares)] += 1;
  return contagem;
}
