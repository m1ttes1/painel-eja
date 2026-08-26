import { describe, it, expect } from 'vitest';
import { graficoBarras } from '../../src/render/barras';

describe('graficoBarras', () => {
  const base = {
    titulo: 'Frequência média por turma',
    itens: [
      { rotulo: '6º ano', valor: 82.5 },
      { rotulo: '7º ano', valor: 61.2 },
    ],
    maximo: 100,
    limiar: 75,
    sufixo: '%',
  };

  it('produz um svg com titulo acessivel', () => {
    const svg = graficoBarras(base);
    expect(svg).toContain('<svg');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('Frequência média por turma');
  });

  it('desenha uma barra por item', () => {
    const svg = graficoBarras(base);
    expect(svg.match(/<rect class="barra/g)).toHaveLength(2);
  });

  it('mostra o valor como texto — nao codifica so por cor', () => {
    const svg = graficoBarras(base);
    expect(svg).toContain('82,5%');
    expect(svg).toContain('61,2%');
  });

  it('marca visualmente quem esta abaixo do limiar e diz isso no texto', () => {
    const svg = graficoBarras(base);
    expect(svg).toContain('abaixo do limiar');
  });

  it('desenha a linha de limiar quando informado', () => {
    expect(graficoBarras(base)).toContain('class="limiar"');
  });

  it('omite a linha de limiar quando nao informado', () => {
    const { limiar, ...semLimiar } = base;
    expect(graficoBarras(semLimiar)).not.toContain('class="limiar"');
  });

  it('escapa rotulo com caractere de markup', () => {
    const svg = graficoBarras({ ...base, itens: [{ rotulo: '<script>', valor: 10 }] });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('nao quebra com lista vazia', () => {
    expect(() => graficoBarras({ ...base, itens: [] })).not.toThrow();
  });
});
