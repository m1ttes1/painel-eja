// tests/sem-rede.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const CAMINHO = 'dist/painel-eja.html';

describe('bundle entregue à escola', () => {
  it('foi gerado — rode npm run build antes', () => {
    expect(existsSync(CAMINHO)).toBe(true);
  });

  it('nao faz nenhuma chamada de rede', () => {
    const html = readFileSync(CAMINHO, 'utf-8');
    for (const proibido of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'navigator.sendBeacon']) {
      expect(html).not.toContain(proibido);
    }
  });

  it('nao referencia nenhum host externo', () => {
    const html = readFileSync(CAMINHO, 'utf-8');
    expect(html).not.toMatch(/(src|href)\s*=\s*["']https?:\/\//i);
    expect(html).not.toMatch(/@import\s+url\(\s*["']?https?:/i);
  });

  it('declara o idioma da pagina', () => {
    expect(readFileSync(CAMINHO, 'utf-8')).toContain('lang="pt-BR"');
  });
});
