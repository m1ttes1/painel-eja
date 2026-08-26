/**
 * Lê texto delimitado por ponto e vírgula e devolve a matriz de células.
 * Não conhece regra de negócio nem nome de coluna — só estrutura.
 */
export function lerCelulas(texto: string): string[][] {
  const semBom = texto.replace(/^﻿/, '');
  return semBom
    .split(/\r?\n/)
    .filter((linha) => linha.trim() !== '')
    .map((linha) => linha.split(';').map((celula) => celula.trim()));
}
