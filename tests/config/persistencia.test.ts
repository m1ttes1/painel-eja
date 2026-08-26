// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { carregarLimiares, salvarLimiares, CHAVE_ARMAZENAMENTO } from '../../src/config/persistencia';
import { LIMIARES_PADRAO } from '../../src/config/limiares';

describe('persistencia de limiares', () => {
  beforeEach(() => localStorage.clear());

  it('devolve o padrao quando nao ha nada gravado', () => {
    expect(carregarLimiares()).toEqual(LIMIARES_PADRAO);
  });

  it('grava e le de volta', () => {
    salvarLimiares({ frequenciaMinima: 80, faltasConsecutivas: 4, notaMinima: 6 });
    expect(carregarLimiares()).toEqual({ frequenciaMinima: 80, faltasConsecutivas: 4, notaMinima: 6 });
  });

  it('devolve o padrao quando o conteudo gravado esta corrompido', () => {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, 'isto nao e json');
    expect(carregarLimiares()).toEqual(LIMIARES_PADRAO);
  });
});
