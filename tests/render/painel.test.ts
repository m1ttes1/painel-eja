import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderPainel } from '../../src/render';
import { calcularIndicadores } from '../../src/kpi';
import type { Componente } from '../../src/kpi/componente';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import { parseAlunos } from '../../src/parser';

const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));
const indicadores = calcularIndicadores(alunos, LIMIARES_PADRAO);

describe('renderPainel', () => {
  const html = renderPainel(indicadores, [], 100);

  it('mostra o total de alunos e a taxa de risco', () => {
    expect(html).toContain('100');
    expect(html).toContain('Risco de evasão');
  });

  it('inclui os graficos de frequencia e desempenho por turma', () => {
    expect(html).toContain('Frequência média por turma');
    expect(html).toContain('Desempenho médio por turma');
  });

  it('inclui o desempenho por componente curricular', () => {
    expect(html).toContain('componente curricular');
  });

  it('mostra o card de janela movel indisponivel com a orientacao, em vez de esconder', () => {
    expect(html).toContain('2 ou mais períodos');
  });

  it('lista os alunos em alerta com os motivos', () => {
    expect(html).toContain('Alunos que precisam de atenção');
    expect(html).toContain('frequência baixa');
  });

  it('nao mostra painel de erro quando nao ha erro', () => {
    expect(html).not.toContain('Problemas na leitura');
  });

  it('mostra painel de erro com linha e motivo quando ha erro', () => {
    const comErro = renderPainel(indicadores, [{ linha: 47, coluna: 'nota_matematica', motivo: 'Valor vazio.' }], 101);
    expect(comErro).toContain('Problemas na leitura');
    expect(comErro).toContain('47');
    expect(comErro).toContain('Valor vazio.');
    expect(comErro).toContain('100 de 101');
  });

  it('escapa nome de aluno com caractere de markup', () => {
    const comNomeRuim = calcularIndicadores(
      [{ ...alunos[0]!, nome: '<img onerror=1>', frequenciaPct: 10 }],
      LIMIARES_PADRAO,
    );
    const perigoso = renderPainel(comNomeRuim, [], 1);
    expect(perigoso).not.toContain('<img onerror=1>');
    expect(perigoso).toContain('&lt;img');
  });

  it('nao quebra com zero alunos', () => {
    const vazio = calcularIndicadores([], LIMIARES_PADRAO);
    expect(() => renderPainel(vazio, [], 0)).not.toThrow();
  });

  it('escapa valor no card quando contem caractere de markup', () => {
    // Construir um Indicadores com componente crítico contendo HTML
    const ind = calcularIndicadores(alunos, LIMIARES_PADRAO);
    // Injetar um nome de componente malicioso na estrutura computada
    const malicioso = {
      ...ind,
      componenteMaisCritico: ind.componenteMaisCritico
        ? {
            ...ind.componenteMaisCritico,
            componente: '<img onerror=alert(1)>' as Componente,
          }
        : null,
    };
    const perigoso = renderPainel(malicioso, [], alunos.length);
    expect(perigoso).not.toContain('<img onerror=alert(1)>');
    expect(perigoso).toContain('&lt;img');
  });
});
