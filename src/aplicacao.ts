import type { Limiares } from './config/limiares';
import { calcularIndicadores } from './kpi';
import { parseAlunos } from './parser';
import { renderPainel } from './render';

/** Pipeline completo, sem DOM e sem arquivo: texto entra, markup sai. */
export function montarPainel(texto: string, limiares: Limiares): string {
  const { alunos, erros, totalLinhas } = parseAlunos(texto);
  const indicadores = calcularIndicadores(alunos, limiares);
  return renderPainel(indicadores, erros, totalLinhas, limiares.frequenciaMinima, limiares.notaMinima);
}
