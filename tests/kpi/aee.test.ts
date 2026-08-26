import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { coberturaAee } from '../../src/kpi/aee';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import { parseAlunos } from '../../src/parser';

const esperado = JSON.parse(readFileSync('oraculo/esperado.json', 'utf-8'));
const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));

describe('coberturaAee', () => {
  it('devolve zeros para lista vazia sem dividir por zero', () => {
    expect(coberturaAee([], LIMIARES_PADRAO)).toEqual({
      totalComDeficiencia: 0,
      comDeficienciaEmAlerta: 0,
      percentualDoTotal: 0,
    });
  });

  it('bate com o oraculo da AE I', () => {
    const r = coberturaAee(alunos, LIMIARES_PADRAO);
    expect(r.totalComDeficiencia).toBe(esperado.cobertura_aee.total_com_deficiencia);
    expect(r.comDeficienciaEmAlerta).toBe(esperado.cobertura_aee.com_deficiencia_em_alerta);
  });
});
