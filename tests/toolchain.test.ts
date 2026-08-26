import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('toolchain', () => {
  it('o dataset simulado da AE I esta presente e tem cabecalho esperado', () => {
    const texto = readFileSync('dados/alunos_simulados.txt', 'utf-8');
    const cabecalho = texto.split(/\r?\n/)[0];
    expect(cabecalho).toContain('nome;turma');
    expect(cabecalho).toContain('frequencia_pct');
    expect(cabecalho).toContain('faltas_consecutivas');
  });
});
