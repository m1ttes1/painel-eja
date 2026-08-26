import { describe, it, expect } from 'vitest';
import { desempenhoPorComponente, componenteMaisCritico, COMPONENTES } from '../../src/kpi/componente';
import type { Aluno } from '../../src/types';

function aluno(turma: string, p: number, m: number, c: number): Aluno {
  return {
    nome: 'X',
    turma,
    frequenciaPct: 90,
    notaPortugues: p,
    notaMatematica: m,
    notaCiencias: c,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    mediaNotas: (p + m + c) / 3,
  };
}

describe('COMPONENTES', () => {
  it('sao os tres componentes fixos herdados da AE I', () => {
    expect(COMPONENTES).toEqual(['Português', 'Matemática', 'Ciências']);
  });
});

describe('desempenhoPorComponente', () => {
  it('devolve lista vazia para entrada vazia', () => {
    expect(desempenhoPorComponente([])).toEqual([]);
  });

  it('produz uma linha por turma e componente, na ordem definida', () => {
    const r = desempenhoPorComponente([aluno('A', 8, 4, 6), aluno('A', 6, 2, 6)]);
    expect(r).toEqual([
      { turma: 'A', componente: 'Português', media: 7 },
      { turma: 'A', componente: 'Matemática', media: 3 },
      { turma: 'A', componente: 'Ciências', media: 6 },
    ]);
  });

  it('ordena as turmas alfabeticamente', () => {
    const r = desempenhoPorComponente([aluno('B', 5, 5, 5), aluno('A', 5, 5, 5)]);
    expect(r.map((x) => x.turma)).toEqual(['A', 'A', 'A', 'B', 'B', 'B']);
  });
});

describe('componenteMaisCritico', () => {
  it('devolve null para lista vazia', () => {
    expect(componenteMaisCritico([])).toBeNull();
  });

  it('aponta a menor media — a dificuldade concentrada', () => {
    const r = componenteMaisCritico(desempenhoPorComponente([aluno('A', 8, 4, 6)]));
    expect(r).toEqual({ turma: 'A', componente: 'Matemática', media: 4 });
  });
});
