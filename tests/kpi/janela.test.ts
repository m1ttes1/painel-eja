import { describe, it, expect } from 'vitest';
import { quedaFrequenciaJanelaMovel } from '../../src/kpi/janela';
import type { Aluno } from '../../src/types';

function aluno(nome: string, periodo: string | undefined, frequenciaPct: number): Aluno {
  return {
    nome,
    turma: 'A',
    periodo,
    frequenciaPct,
    notaPortugues: 7,
    notaMatematica: 7,
    notaCiencias: 7,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    mediaNotas: 7,
  };
}

describe('quedaFrequenciaJanelaMovel', () => {
  it('fica indisponivel, com motivo, quando nao ha coluna periodo', () => {
    const r = quedaFrequenciaJanelaMovel([aluno('Ana', undefined, 90)]);
    expect(r.disponivel).toBe(false);
    if (!r.disponivel) expect(r.motivo).toContain('2 ou mais períodos');
  });

  it('fica indisponivel quando ha um unico periodo', () => {
    const r = quedaFrequenciaJanelaMovel([aluno('Ana', '1', 90), aluno('Bruno', '1', 80)]);
    expect(r.disponivel).toBe(false);
  });

  it('calcula a variacao entre os dois periodos mais recentes', () => {
    const r = quedaFrequenciaJanelaMovel([aluno('Ana', '1', 90), aluno('Ana', '2', 70)]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) {
      expect(r.quedas).toEqual([
        { nome: 'Ana', turma: 'A', periodoAnterior: '1', periodoAtual: '2', variacaoPp: -20 },
      ]);
    }
  });

  it('lista apenas quedas, ignorando quem melhorou ou ficou igual', () => {
    const r = quedaFrequenciaJanelaMovel([
      aluno('Sobe', '1', 60),
      aluno('Sobe', '2', 90),
      aluno('Igual', '1', 80),
      aluno('Igual', '2', 80),
      aluno('Cai', '1', 95),
      aluno('Cai', '2', 60),
    ]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) expect(r.quedas.map((q) => q.nome)).toEqual(['Cai']);
  });

  it('ordena da maior queda para a menor', () => {
    const r = quedaFrequenciaJanelaMovel([
      aluno('QuedaLeve', '1', 90),
      aluno('QuedaLeve', '2', 85),
      aluno('QuedaForte', '1', 90),
      aluno('QuedaForte', '2', 40),
    ]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) expect(r.quedas.map((q) => q.nome)).toEqual(['QuedaForte', 'QuedaLeve']);
  });

  it('usa os dois periodos mais recentes quando ha tres', () => {
    const r = quedaFrequenciaJanelaMovel([
      aluno('Ana', '1', 10),
      aluno('Ana', '2', 90),
      aluno('Ana', '3', 80),
    ]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) {
      expect(r.quedas[0]!.periodoAnterior).toBe('2');
      expect(r.quedas[0]!.periodoAtual).toBe('3');
      expect(r.quedas[0]!.variacaoPp).toBe(-10);
    }
  });

  it('ignora aluno presente em so um dos dois periodos', () => {
    const r = quedaFrequenciaJanelaMovel([
      aluno('Ana', '1', 90),
      aluno('Ana', '2', 60),
      aluno('NovoAluno', '2', 30),
    ]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) expect(r.quedas.map((q) => q.nome)).toEqual(['Ana']);
  });
});
