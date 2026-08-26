import { describe, it, expect } from 'vitest';
import { LIMIARES_PADRAO, validarLimiares } from '../../src/config/limiares';

describe('LIMIARES_PADRAO', () => {
  it('reproduz exatamente os limiares da AE I', () => {
    expect(LIMIARES_PADRAO).toEqual({
      frequenciaMinima: 75,
      faltasConsecutivas: 3,
      notaMinima: 5,
    });
  });
});

describe('validarLimiares', () => {
  it('aceita valores validos', () => {
    expect(validarLimiares({ frequenciaMinima: 80, faltasConsecutivas: 5, notaMinima: 6 })).toEqual({
      frequenciaMinima: 80,
      faltasConsecutivas: 5,
      notaMinima: 6,
    });
  });

  it('substitui campo fora de faixa pelo padrao', () => {
    const r = validarLimiares({ frequenciaMinima: 150, faltasConsecutivas: 5, notaMinima: 6 });
    expect(r.frequenciaMinima).toBe(75);
    expect(r.faltasConsecutivas).toBe(5);
  });

  it('devolve o padrao para entrada nao-objeto', () => {
    expect(validarLimiares(null)).toEqual(LIMIARES_PADRAO);
    expect(validarLimiares('texto')).toEqual(LIMIARES_PADRAO);
  });
});
