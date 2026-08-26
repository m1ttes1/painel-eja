// tests/sem-rede.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CAMINHO = 'dist/painel-eja.html';

describe('bundle entregue à escola', () => {
  it('foi gerado — rode npm run build antes', () => {
    expect(existsSync(CAMINHO)).toBe(true);
  });

  it('o bundle é mais recente que o código-fonte — rode npm run build antes de confiar neste teste', () => {
    const mtimeBundle = statSync(CAMINHO).mtimeMs;
    const arquivosFonte = readdirSync('src', { recursive: true })
      .map((arquivo) => join('src', arquivo.toString()))
      .filter((caminho) => statSync(caminho).isFile());

    for (const arquivo of arquivosFonte) {
      expect(statSync(arquivo).mtimeMs).toBeLessThanOrEqual(mtimeBundle);
    }
  });

  it('nao faz nenhuma chamada de rede', () => {
    const html = readFileSync(CAMINHO, 'utf-8');
    for (const proibido of [
      'fetch(',
      'XMLHttpRequest',
      'WebSocket',
      'navigator.sendBeacon',
      'EventSource',
      'new Worker',
    ]) {
      expect(html).not.toContain(proibido);
    }
  });

  it('nao referencia nenhum host externo', () => {
    const html = readFileSync(CAMINHO, 'utf-8');
    expect(html).not.toMatch(/(src|href)\s*=\s*["']https?:\/\//i);
    expect(html).not.toMatch(/@import\s+url\(\s*["']?https?:/i);
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toMatch(/\/\/[a-z0-9-]+\.[a-z]{2,}/i);
  });

  it('declara o idioma da pagina', () => {
    expect(readFileSync(CAMINHO, 'utf-8')).toContain('lang="pt-BR"');
  });
});
