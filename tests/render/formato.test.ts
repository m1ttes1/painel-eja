import { describe, it, expect } from 'vitest';
import { numero, percentual } from '../../src/render/formato';

describe('numero', () => {
  it('usa virgula decimal, padrao brasileiro', () => {
    expect(numero(82.55)).toBe('82,6');
  });

  it('aceita casas customizadas', () => {
    expect(numero(7, 2)).toBe('7,00');
  });
});

describe('percentual', () => {
  it('acrescenta o sinal de porcentagem', () => {
    expect(percentual(82.55)).toBe('82,6%');
  });
});
