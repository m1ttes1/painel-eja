import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { frequenciaPorTurma, desempenhoPorTurma } from '../../src/kpi/agregacoes';
import { parseAlunos } from '../../src/parser';
import type { Aluno } from '../../src/types';

const esperado = JSON.parse(readFileSync('oraculo/esperado.json', 'utf-8'));
const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));

function aluno(parcial: Partial<Aluno>): Aluno {
  return {
    nome: 'X',
    turma: 'T',
    frequenciaPct: 90,
    notaPortugues: 7,
    notaMatematica: 7,
    notaCiencias: 7,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    mediaNotas: 7,
    ...parcial,
  };
}

describe('frequenciaPorTurma', () => {
  it('devolve lista vazia para entrada vazia', () => {
    expect(frequenciaPorTurma([])).toEqual([]);
  });

  it('agrupa por turma, faz a media e conta os alunos', () => {
    const r = frequenciaPorTurma([
      aluno({ turma: 'B', frequenciaPct: 80 }),
      aluno({ turma: 'A', frequenciaPct: 60 }),
      aluno({ turma: 'A', frequenciaPct: 100 }),
    ]);
    expect(r).toEqual([
      { turma: 'A', valor: 80, alunos: 2 },
      { turma: 'B', valor: 80, alunos: 1 },
    ]);
  });

  it('bate com o oraculo da AE I no dataset simulado', () => {
    const r = frequenciaPorTurma(alunos);
    expect(r).toHaveLength(esperado.frequencia_por_turma.length);
    r.forEach((item, i) => {
      expect(item.turma).toBe(esperado.frequencia_por_turma[i].turma);
      expect(item.alunos).toBe(esperado.frequencia_por_turma[i].alunos);
      expect(item.valor).toBeCloseTo(esperado.frequencia_por_turma[i].valor, 9);
    });
  });
});

describe('desempenhoPorTurma', () => {
  it('bate com o oraculo da AE I no dataset simulado', () => {
    const r = desempenhoPorTurma(alunos);
    r.forEach((item, i) => {
      expect(item.turma).toBe(esperado.desempenho_por_turma[i].turma);
      expect(item.valor).toBeCloseTo(esperado.desempenho_por_turma[i].valor, 9);
    });
  });
});
