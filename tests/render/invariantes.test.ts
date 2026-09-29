// @vitest-environment jsdom
/**
 * Testes de invariante da interface: regras que valem para TODO elemento de um tipo.
 * Origem: QA de 28/09/2026 achou card sem dica (title), concordância "1 deles estão"
 * e tabela estourando a largura no celular. Elemento novo que quebrar a regra falha aqui.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderPainel } from '../../src/render';
import { calcularIndicadores } from '../../src/kpi';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import { parseAlunos } from '../../src/parser';

function montar(arquivo: string): Document {
  const { alunos, erros, totalLinhas } = parseAlunos(readFileSync(arquivo, 'utf-8'));
  const doc = document.implementation.createHTMLDocument('t');
  doc.body.innerHTML = renderPainel(calcularIndicadores(alunos, LIMIARES_PADRAO), erros, totalLinhas);
  return doc;
}

// Matriz de estados mínima: arquivo sem histórico e arquivo com 3 anos de histórico.
const CENARIOS = {
  'um período': 'dados/alunos_simulados.txt',
  'histórico de vários períodos': 'dataset/turmas-eja-completo.txt',
};

describe.each(Object.entries(CENARIOS))('invariantes da interface (%s)', (_nome, arquivo) => {
  const doc = montar(arquivo);

  it('todo card tem dica (title) não vazia', () => {
    const cards = [...doc.querySelectorAll('.card')];
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(c.getAttribute('title')?.trim(), c.querySelector('h3')?.textContent ?? '').toBeTruthy();
  });

  it('toda tabela está dentro de uma seção que rola sozinha (.alerta), nunca solta na página', () => {
    for (const t of doc.querySelectorAll('table')) expect(t.closest('.alerta')).not.toBeNull();
  });

  it('toda tabela tem legenda (caption) e cabeçalhos com scope', () => {
    for (const t of doc.querySelectorAll('table')) {
      expect(t.querySelector('caption')?.textContent?.trim()).toBeTruthy();
      for (const th of t.querySelectorAll('thead th')) expect(th.getAttribute('scope')).toBe('col');
    }
  });

  it('todo gráfico tem nome acessível', () => {
    for (const svg of doc.querySelectorAll('svg[role="img"]')) expect(svg.getAttribute('aria-label')?.trim()).toBeTruthy();
  });

  it('nenhum texto tem concordância "1 ... estão" nem jargão "p.p."', () => {
    const texto = doc.body.textContent ?? '';
    expect(texto).not.toMatch(/\b1 [^.]{0,40}\bestão\b/);
    expect(texto).not.toMatch(/p\.p\.|pontos percentuais/);
  });
});

describe('invariante do CSS', () => {
  it('a seção de tabelas rola na horizontal em vez de estourar a página', () => {
    expect(readFileSync('src/estilo.css', 'utf-8')).toMatch(/\.alerta\s*\{[^}]*overflow-x:\s*auto/);
  });
});
