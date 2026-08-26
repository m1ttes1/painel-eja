// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderConfig, lerLimiaresDoFormulario } from '../../src/render/config-ui';
import { LIMIARES_PADRAO } from '../../src/config/limiares';

function montar(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('renderConfig', () => {
  it('preenche os campos com os limiares atuais', () => {
    const raiz = montar(renderConfig({ frequenciaMinima: 80, faltasConsecutivas: 4, notaMinima: 6 }));
    expect(raiz.querySelector<HTMLInputElement>('#limiar-frequencia')!.value).toBe('80');
    expect(raiz.querySelector<HTMLInputElement>('#limiar-faltas')!.value).toBe('4');
    expect(raiz.querySelector<HTMLInputElement>('#limiar-nota')!.value).toBe('6');
  });

  it('associa rotulo a cada campo — requisito de acessibilidade', () => {
    const raiz = montar(renderConfig(LIMIARES_PADRAO));
    for (const id of ['limiar-frequencia', 'limiar-faltas', 'limiar-nota']) {
      expect(raiz.querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
  });
});

describe('lerLimiaresDoFormulario', () => {
  it('le de volta o que o usuario digitou', () => {
    const raiz = montar(renderConfig(LIMIARES_PADRAO));
    raiz.querySelector<HTMLInputElement>('#limiar-frequencia')!.value = '85';
    expect(lerLimiaresDoFormulario(raiz).frequenciaMinima).toBe(85);
  });

  it('cai no padrao quando o campo tem valor invalido', () => {
    const raiz = montar(renderConfig(LIMIARES_PADRAO));
    raiz.querySelector<HTMLInputElement>('#limiar-frequencia')!.value = '999';
    expect(lerLimiaresDoFormulario(raiz).frequenciaMinima).toBe(75);
  });
});
