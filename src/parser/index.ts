import type { Aluno, ErroLinha, ResultadoParse } from '../types';
import { lerCelulas } from './csv';
import { COLUNAS_OBRIGATORIAS, FAIXAS, lerNumero } from './schema';

function indicePorColuna(cabecalho: string[]): Map<string, number> {
  const mapa = new Map<string, number>();
  cabecalho.forEach((nome, i) => mapa.set(nome.toLowerCase(), i));
  return mapa;
}

function celula(linha: string[], mapa: Map<string, number>, coluna: string): string {
  const i = mapa.get(coluna);
  return i === undefined ? '' : (linha[i] ?? '');
}

export function parseAlunos(texto: string): ResultadoParse {
  const matriz = lerCelulas(texto);

  if (matriz.length === 0) {
    return { alunos: [], erros: [{ linha: 1, motivo: 'Arquivo vazio.' }], totalLinhas: 0 };
  }

  // Track physical line numbers to account for blank lines that lerCelulas filters out
  const todasAsLinhas = texto.split(/\r?\n/);
  const indicesLinhasNaoVazias: number[] = [];
  for (let i = 0; i < todasAsLinhas.length; i++) {
    if (todasAsLinhas[i]!.trim() !== '') {
      indicesLinhasNaoVazias.push(i);
    }
  }

  const erros: ErroLinha[] = [];
  const cabecalho = matriz[0]!;

  if (texto.includes('�')) {
    erros.push({
      linha: 1,
      motivo:
        'O arquivo parece não estar em UTF-8: a acentuação pode aparecer trocada. Reexporte como UTF-8 se possível.',
    });
  }

  const mapa = indicePorColuna(cabecalho);
  const faltando = COLUNAS_OBRIGATORIAS.filter((c) => !mapa.has(c));
  if (faltando.length > 0) {
    const semPontoEVirgula = cabecalho.length === 1;
    const primeiraCelula = cabecalho[0] ?? '';
    const pareceSeparadoPorVirgula =
      faltando.length === COLUNAS_OBRIGATORIAS.length &&
      semPontoEVirgula &&
      (primeiraCelula.includes(',') || primeiraCelula.includes('\t'));

    erros.push({
      linha: 1,
      motivo: pareceSeparadoPorVirgula
        ? "O arquivo parece estar separado por vírgula, não por ponto e vírgula. Reexporte usando ';' como separador."
        : `Coluna obrigatória ausente no cabeçalho: ${faltando.join(', ')}.`,
    });
    return { alunos: [], erros, totalLinhas: matriz.length - 1 };
  }

  const alunos: Aluno[] = [];
  const linhasDeDado = matriz.slice(1);

  linhasDeDado.forEach((linha, i) => {
    // Get the physical line number from the unfiltered split
    // indicesLinhasNaoVazias[0] is the header (line 1)
    // indicesLinhasNaoVazias[i+1] is the i-th data row
    const fisicalIndex = indicesLinhasNaoVazias[i + 1];
    const numeroDaLinha = fisicalIndex !== undefined ? fisicalIndex + 1 : i + 2;
    const problemas: ErroLinha[] = [];

    const nome = celula(linha, mapa, 'nome');
    const turma = celula(linha, mapa, 'turma');
    if (nome === '') problemas.push({ linha: numeroDaLinha, coluna: 'nome', motivo: 'Nome vazio.' });
    if (turma === '') problemas.push({ linha: numeroDaLinha, coluna: 'turma', motivo: 'Turma vazia.' });

    const numericos: Record<string, number> = {};
    for (const coluna of ['frequencia_pct', 'nota_portugues', 'nota_matematica', 'nota_ciencias', 'faltas_consecutivas']) {
      const valor = lerNumero(celula(linha, mapa, coluna));
      if (valor === null) {
        problemas.push({ linha: numeroDaLinha, coluna, motivo: `Valor de ${coluna} vazio ou não numérico.` });
        continue;
      }
      const faixa = FAIXAS[coluna]!;
      if (valor < faixa.min || valor > faixa.max) {
        problemas.push({
          linha: numeroDaLinha,
          coluna,
          motivo: `Valor de ${coluna} fora da faixa: esperado entre ${faixa.min} e ${faixa.max}, veio ${valor}.`,
        });
        continue;
      }
      numericos[coluna] = valor;
    }

    const idadeBruta = lerNumero(celula(linha, mapa, 'idade'));
    if (idadeBruta !== null) {
      const faixaIdade = FAIXAS['idade']!;
      if (idadeBruta < faixaIdade.min || idadeBruta > faixaIdade.max) {
        problemas.push({
          linha: numeroDaLinha,
          coluna: 'idade',
          motivo: `Valor de idade fora da faixa: esperado entre ${faixaIdade.min} e ${faixaIdade.max}, veio ${idadeBruta}.`,
        });
      }
    }

    if (problemas.length > 0) {
      erros.push(...problemas);
      return;
    }

    const notaPortugues = numericos['nota_portugues']!;
    const notaMatematica = numericos['nota_matematica']!;
    const notaCiencias = numericos['nota_ciencias']!;
    const periodo = celula(linha, mapa, 'periodo');

    alunos.push({
      nome,
      turma,
      turno: celula(linha, mapa, 'turno') || undefined,
      idade: idadeBruta ?? undefined,
      frequenciaPct: numericos['frequencia_pct']!,
      notaPortugues,
      notaMatematica,
      notaCiencias,
      faltasConsecutivas: numericos['faltas_consecutivas']!,
      possuiDeficiencia: celula(linha, mapa, 'possui_deficiencia').toLowerCase() === 'sim',
      apoioRecomendado: celula(linha, mapa, 'apoio_recomendado') || undefined,
      observacao: celula(linha, mapa, 'observacao') || undefined,
      periodo: periodo || undefined,
      mediaNotas: (notaPortugues + notaMatematica + notaCiencias) / 3,
    });
  });

  return { alunos, erros, totalLinhas: linhasDeDado.length };
}
