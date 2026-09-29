import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { montarPainel } from '../src/aplicacao';
import { LIMIARES_PADRAO } from '../src/config/limiares';

const texto = readFileSync('dados/alunos_simulados.txt', 'utf-8');

describe('montarPainel', () => {
  it('vai do texto bruto ao markup do painel', () => {
    const html = montarPainel(texto, LIMIARES_PADRAO);
    expect(html).toContain('Frequência média por turma');
    expect(html).toContain('Alunos que precisam de atenção');
  });

  it('reflete mudanca de limiar no resultado', () => {
    const padrao = montarPainel(texto, LIMIARES_PADRAO);
    const rigoroso = montarPainel(texto, { ...LIMIARES_PADRAO, frequenciaMinima: 99 });
    expect(rigoroso).not.toBe(padrao);
  });

  it('mostra o painel de erro para arquivo invalido, sem lancar excecao', () => {
    const html = montarPainel('isto nao e um csv de alunos', LIMIARES_PADRAO);
    expect(html).toContain('Problemas na leitura');
  });

  it('trata arquivo vazio', () => {
    expect(() => montarPainel('', LIMIARES_PADRAO)).not.toThrow();
  });
});
