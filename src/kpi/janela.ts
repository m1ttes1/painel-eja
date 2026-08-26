import type { Aluno } from '../types';

export interface QuedaFrequencia {
  nome: string;
  turma: string;
  periodoAnterior: string;
  periodoAtual: string;
  /** Negativo. Diferença em pontos percentuais. */
  variacaoPp: number;
}

export type ResultadoJanela =
  | { disponivel: true; quedas: QuedaFrequencia[] }
  | { disponivel: false; motivo: string };

const MOTIVO_INDISPONIVEL =
  'Requer histórico de 2 ou mais períodos. Inclua a coluna "periodo" no arquivo, com uma linha por aluno em cada bimestre.';

/**
 * Compara a frequência de cada aluno entre os dois períodos mais recentes.
 * Segundo indicador pendente da AE I.
 */
export function quedaFrequenciaJanelaMovel(alunos: Aluno[]): ResultadoJanela {
  const periodos = [...new Set(alunos.map((a) => a.periodo).filter((p): p is string => !!p))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { numeric: true }),
  );

  if (periodos.length < 2) return { disponivel: false, motivo: MOTIVO_INDISPONIVEL };

  const periodoAnterior = periodos[periodos.length - 2]!;
  const periodoAtual = periodos[periodos.length - 1]!;

  const anterior = new Map(
    alunos.filter((a) => a.periodo === periodoAnterior).map((a) => [`${a.nome}::${a.turma}`, a]),
  );
  const quedas: QuedaFrequencia[] = [];

  for (const atual of alunos.filter((a) => a.periodo === periodoAtual)) {
    const antes = anterior.get(`${atual.nome}::${atual.turma}`);
    if (!antes) continue;

    const variacaoPp = atual.frequenciaPct - antes.frequenciaPct;
    if (variacaoPp < 0) {
      quedas.push({ nome: atual.nome, turma: atual.turma, periodoAnterior, periodoAtual, variacaoPp });
    }
  }

  quedas.sort((a, b) => a.variacaoPp - b.variacaoPp);
  return { disponivel: true, quedas };
}
