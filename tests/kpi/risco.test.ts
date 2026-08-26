import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { motivosAlerta, alunosEmAlerta, taxaRiscoEvasao } from '../../src/kpi/risco';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import { parseAlunos } from '../../src/parser';
import type { Aluno } from '../../src/types';

const esperado = JSON.parse(readFileSync('oraculo/esperado.json', 'utf-8'));
const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));

function aluno(parcial: Partial<Aluno>): Aluno {
  const base = {
    nome: 'X',
    turma: 'T',
    frequenciaPct: 90,
    notaPortugues: 7,
    notaMatematica: 7,
    notaCiencias: 7,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    ...parcial,
  };
  return { ...base, mediaNotas: (base.notaPortugues + base.notaMatematica + base.notaCiencias) / 3 };
}

describe('motivosAlerta — fronteiras herdadas da AE I', () => {
  it('frequencia exatamente 75,0 NAO e risco', () => {
    expect(motivosAlerta(aluno({ frequenciaPct: 75 }), LIMIARES_PADRAO)).toEqual([]);
  });

  it('frequencia 74,9 e risco', () => {
    expect(motivosAlerta(aluno({ frequenciaPct: 74.9 }), LIMIARES_PADRAO)).toEqual(['freq. baixa']);
  });

  it('exatamente 3 faltas consecutivas E risco', () => {
    expect(motivosAlerta(aluno({ faltasConsecutivas: 3 }), LIMIARES_PADRAO)).toEqual(['faltas seguidas']);
  });

  it('2 faltas consecutivas nao e risco', () => {
    expect(motivosAlerta(aluno({ faltasConsecutivas: 2 }), LIMIARES_PADRAO)).toEqual([]);
  });

  it('media exatamente 5,0 NAO e risco', () => {
    expect(motivosAlerta(aluno({ notaPortugues: 5, notaMatematica: 5, notaCiencias: 5 }), LIMIARES_PADRAO)).toEqual([]);
  });

  it('media 4,9 e risco', () => {
    expect(motivosAlerta(aluno({ notaPortugues: 4.9, notaMatematica: 4.9, notaCiencias: 4.9 }), LIMIARES_PADRAO)).toEqual([
      'notas baixas',
    ]);
  });

  it('acumula motivos na ordem frequencia, faltas, notas', () => {
    const r = motivosAlerta(
      aluno({ frequenciaPct: 50, faltasConsecutivas: 9, notaPortugues: 1, notaMatematica: 1, notaCiencias: 1 }),
      LIMIARES_PADRAO,
    );
    expect(r).toEqual(['freq. baixa', 'faltas seguidas', 'notas baixas']);
  });

  it('respeita limiar customizado', () => {
    expect(motivosAlerta(aluno({ frequenciaPct: 85 }), { ...LIMIARES_PADRAO, frequenciaMinima: 90 })).toEqual([
      'freq. baixa',
    ]);
  });
});

describe('alunosEmAlerta', () => {
  it('ordena por quantidade de motivos e, no empate, por frequencia crescente', () => {
    const r = alunosEmAlerta(
      [
        aluno({ nome: 'UmMotivo', frequenciaPct: 70 }),
        aluno({ nome: 'TresMotivos', frequenciaPct: 40, faltasConsecutivas: 5, notaPortugues: 2, notaMatematica: 2, notaCiencias: 2 }),
        aluno({ nome: 'UmMotivoPior', frequenciaPct: 50 }),
        aluno({ nome: 'SemAlerta' }),
      ],
      LIMIARES_PADRAO,
    );
    expect(r.map((x) => x.aluno.nome)).toEqual(['TresMotivos', 'UmMotivoPior', 'UmMotivo']);
  });

  it('bate com o oraculo: mesmo conjunto de nomes e mesmos motivos', () => {
    const r = alunosEmAlerta(alunos, LIMIARES_PADRAO);
    expect(r).toHaveLength(esperado.total_em_alerta);

    const meu = r.map((x) => ({ nome: x.aluno.nome, motivos: x.motivos })).sort((a, b) => a.nome.localeCompare(b.nome));
    const dele = esperado.alunos_em_alerta.map((x: { nome: string; motivos: string[] }) => ({
      nome: x.nome,
      motivos: x.motivos,
    }));
    expect(meu).toEqual(dele);
  });
});

describe('taxaRiscoEvasao', () => {
  it('devolve 0 para lista vazia', () => {
    expect(taxaRiscoEvasao([], LIMIARES_PADRAO)).toBe(0);
  });

  it('bate com o oraculo', () => {
    expect(taxaRiscoEvasao(alunos, LIMIARES_PADRAO)).toBeCloseTo(esperado.taxa_risco_evasao, 9);
  });

  it('todos os alunos em alerta produz taxa de risco de 100%', () => {
    const todos = [aluno({ nome: 'A', frequenciaPct: 50 }), aluno({ nome: 'B', frequenciaPct: 50 })];
    expect(taxaRiscoEvasao(todos, LIMIARES_PADRAO)).toBe(100);
  });

  it('nenhum aluno em alerta produz taxa de risco de 0%, mesmo com alunos presentes', () => {
    const nenhum = [aluno({ nome: 'A' }), aluno({ nome: 'B' })];
    expect(taxaRiscoEvasao(nenhum, LIMIARES_PADRAO)).toBe(0);
  });
});
