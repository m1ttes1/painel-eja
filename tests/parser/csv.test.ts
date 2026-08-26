import { describe, it, expect } from 'vitest';
import { lerCelulas } from '../../src/parser/csv';

describe('lerCelulas', () => {
  it('separa por ponto e virgula e faz trim de cada celula', () => {
    expect(lerCelulas('a; b ;c')).toEqual([['a', 'b', 'c']]);
  });

  it('separa linhas com LF e com CRLF', () => {
    expect(lerCelulas('a;b\r\nc;d\ne;f')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ]);
  });

  it('ignora linhas em branco, inclusive no fim do arquivo', () => {
    expect(lerCelulas('a;b\n\nc;d\n\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('devolve lista vazia para texto vazio ou so espacos', () => {
    expect(lerCelulas('')).toEqual([]);
    expect(lerCelulas('   \n  \n')).toEqual([]);
  });

  it('remove BOM do inicio do arquivo', () => {
    expect(lerCelulas('﻿nome;turma')).toEqual([['nome', 'turma']]);
  });
});
