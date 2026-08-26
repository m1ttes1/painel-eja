import { describe, it, expect } from 'vitest';
import { lerNumero, COLUNAS_OBRIGATORIAS } from '../../src/parser/schema';

describe('lerNumero', () => {
  it('aceita ponto como separador decimal', () => {
    expect(lerNumero('82.5')).toBe(82.5);
  });

  it('aceita virgula como separador decimal — export brasileiro usa virgula', () => {
    expect(lerNumero('82,5')).toBe(82.5);
  });

  it('aceita inteiro', () => {
    expect(lerNumero('3')).toBe(3);
  });

  it('devolve null para vazio e para texto', () => {
    expect(lerNumero('')).toBeNull();
    expect(lerNumero('   ')).toBeNull();
    expect(lerNumero('nao informado')).toBeNull();
  });
});

describe('COLUNAS_OBRIGATORIAS', () => {
  it('lista as sete colunas exigidas pela spec', () => {
    expect(COLUNAS_OBRIGATORIAS).toEqual([
      'nome',
      'turma',
      'frequencia_pct',
      'nota_portugues',
      'nota_matematica',
      'nota_ciencias',
      'faltas_consecutivas',
    ]);
  });
});
