import { describe, it, expect } from 'vitest';
import { quadranteDefasagem, distribuicaoDefasagem } from '../../src/kpi/defasagem';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import type { Aluno } from '../../src/types';

function aluno(frequenciaPct: number, nota: number): Aluno {
  return {
    nome: 'X',
    turma: 'T',
    frequenciaPct,
    notaPortugues: nota,
    notaMatematica: nota,
    notaCiencias: nota,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    mediaNotas: nota,
  };
}

describe('quadranteDefasagem', () => {
  it('presente e indo bem e regular', () => {
    expect(quadranteDefasagem(aluno(90, 8), LIMIARES_PADRAO)).toBe('regular');
  });

  it('presente com desempenho baixo pede intervencao didatica', () => {
    expect(quadranteDefasagem(aluno(90, 3), LIMIARES_PADRAO)).toBe('intervencao-didatica');
  });

  it('ausente com desempenho razoavel pede acao de permanencia', () => {
    expect(quadranteDefasagem(aluno(50, 8), LIMIARES_PADRAO)).toBe('acao-permanencia');
  });

  it('ausente e com desempenho baixo e critico', () => {
    expect(quadranteDefasagem(aluno(50, 3), LIMIARES_PADRAO)).toBe('critico');
  });

  it('usa as mesmas fronteiras do risco: 75,0 e presente, 5,0 e razoavel', () => {
    expect(quadranteDefasagem(aluno(75, 5), LIMIARES_PADRAO)).toBe('regular');
  });
});

describe('distribuicaoDefasagem', () => {
  it('conta os quatro quadrantes e zera os ausentes', () => {
    const r = distribuicaoDefasagem([aluno(90, 8), aluno(90, 3), aluno(90, 3)], LIMIARES_PADRAO);
    expect(r).toEqual({ regular: 1, 'intervencao-didatica': 2, 'acao-permanencia': 0, critico: 0 });
  });

  it('devolve tudo zerado para lista vazia', () => {
    expect(distribuicaoDefasagem([], LIMIARES_PADRAO)).toEqual({
      regular: 0,
      'intervencao-didatica': 0,
      'acao-permanencia': 0,
      critico: 0,
    });
  });
});
