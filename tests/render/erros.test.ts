import { describe, it, expect } from 'vitest';
import { renderErros } from '../../src/render/erros';
import type { ErroLinha } from '../../src/types';

function erros(quantidade: number): ErroLinha[] {
  return Array.from({ length: quantidade }, (_, i) => ({
    linha: i + 2,
    coluna: 'frequencia_pct',
    motivo: 'Valor vazio ou não numérico.',
  }));
}

describe('renderErros', () => {
  it('devolve vazio quando nao ha erro', () => {
    expect(renderErros([], 10, 10)).toBe('');
  });

  it('lista todos os erros quando sao 25 ou menos', () => {
    const html = renderErros(erros(25), 100, 75);
    expect((html.match(/<li>/g) ?? []).length).toBe(25);
    expect(html).not.toContain('e mais');
  });

  it('limita a lista a 25 entradas e avisa quantas ficaram de fora', () => {
    const html = renderErros(erros(40), 100, 60);
    expect((html.match(/<li>/g) ?? []).length).toBe(26);
    expect(html).toContain('… e mais 15 problema(s).');
  });
});
