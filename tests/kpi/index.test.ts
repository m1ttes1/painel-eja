import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { calcularIndicadores } from '../../src/kpi';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import { parseAlunos } from '../../src/parser';

const esperado = JSON.parse(readFileSync('oraculo/esperado.json', 'utf-8'));
const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));

describe('calcularIndicadores', () => {
  it('produz os sete indicadores sobre o dataset simulado', () => {
    const r = calcularIndicadores(alunos, LIMIARES_PADRAO);

    expect(r.totalAlunos).toBe(esperado.total_alunos);
    expect(r.frequenciaPorTurma).toHaveLength(4);
    expect(r.desempenhoPorTurma).toHaveLength(4);
    expect(r.desempenhoPorComponente).toHaveLength(12);
    expect(r.componenteMaisCritico).not.toBeNull();
    expect(r.alunosEmAlerta).toHaveLength(esperado.total_em_alerta);
    expect(r.taxaRiscoEvasao).toBeCloseTo(esperado.taxa_risco_evasao, 9);
    expect(r.coberturaAee.totalComDeficiencia).toBe(esperado.cobertura_aee.total_com_deficiencia);
  });

  it('marca a janela movel como indisponivel — o dataset da AE I nao tem periodo', () => {
    const r = calcularIndicadores(alunos, LIMIARES_PADRAO);
    expect(r.quedaFrequencia.disponivel).toBe(false);
  });

  it('nao lanca excecao para lista vazia', () => {
    const r = calcularIndicadores([], LIMIARES_PADRAO);
    expect(r.totalAlunos).toBe(0);
    expect(r.taxaRiscoEvasao).toBe(0);
    expect(r.alunosEmAlerta).toEqual([]);
    expect(r.componenteMaisCritico).toBeNull();
  });

  it('reage a mudanca de limiar — limiar mais rigoroso aumenta a taxa de risco', () => {
    const padrao = calcularIndicadores(alunos, LIMIARES_PADRAO);
    const rigoroso = calcularIndicadores(alunos, { ...LIMIARES_PADRAO, frequenciaMinima: 95 });
    expect(rigoroso.taxaRiscoEvasao).toBeGreaterThan(padrao.taxaRiscoEvasao);
  });
});

describe('calcularIndicadores com histórico de vários períodos', () => {
  const base = { turma: 'T', notaPortugues: 7, notaMatematica: 7, notaCiencias: 7, faltasConsecutivas: 0, possuiDeficiencia: false, mediaNotas: 7 };
  const historico = [
    { ...base, nome: 'Ana', periodo: '2026.1', frequenciaPct: 90 },
    { ...base, nome: 'Ana', periodo: '2026.2', frequenciaPct: 60 },
    { ...base, nome: 'Bia', periodo: '2026.1', frequenciaPct: 80 },
    { ...base, nome: 'Bia', periodo: '2026.2', frequenciaPct: 85 },
    { ...base, nome: 'Caio', periodo: '2025.2', frequenciaPct: 40 },
  ];

  it('conta cada aluno uma vez, pelo período mais recente', () => {
    const r = calcularIndicadores(historico, LIMIARES_PADRAO);
    expect(r.totalAlunos).toBe(2);
    expect(r.alunosEmAlerta.map((a) => a.aluno.nome)).toEqual(['Ana']);
  });

  it('usa o histórico completo para a queda de frequência', () => {
    const r = calcularIndicadores(historico, LIMIARES_PADRAO);
    expect(r.quedaFrequencia.disponivel).toBe(true);
    if (r.quedaFrequencia.disponivel) expect(r.quedaFrequencia.quedas.map((q) => q.nome)).toEqual(['Ana']);
  });
});
