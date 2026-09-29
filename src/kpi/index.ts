import type { Limiares } from '../config/limiares';
import type { Aluno } from '../types';
import { desempenhoPorTurma, frequenciaPorTurma, type MediaTurma } from './agregacoes';
import { coberturaAee, type CoberturaAee } from './aee';
import { componenteMaisCritico, desempenhoPorComponente, type MediaComponente } from './componente';
import { distribuicaoDefasagem, type Quadrante } from './defasagem';
import { quedaFrequenciaJanelaMovel, type ResultadoJanela } from './janela';
import { alunosEmAlerta, taxaRiscoEvasao, type AlunoEmAlerta } from './risco';

export interface Indicadores {
  totalAlunos: number;
  /** Registros lidos no arquivo, somando todos os períodos. */
  totalRegistros: number;
  /** Período usado no retrato, quando o arquivo traz histórico. */
  periodoAtual?: string;
  frequenciaPorTurma: MediaTurma[];
  desempenhoPorTurma: MediaTurma[];
  desempenhoPorComponente: MediaComponente[];
  componenteMaisCritico: MediaComponente | null;
  alunosEmAlerta: AlunoEmAlerta[];
  taxaRiscoEvasao: number;
  distribuicaoDefasagem: Record<Quadrante, number>;
  coberturaAee: CoberturaAee;
  quedaFrequencia: ResultadoJanela;
}

/**
 * Com histórico (coluna "periodo" com vários valores), os indicadores de retrato
 * usam só o período mais recente; o histórico completo alimenta a queda de frequência.
 * Sem isso, cada aluno seria contado uma vez por período.
 */
export function periodoMaisRecente(alunos: Aluno[]): Aluno[] {
  const periodos = [...new Set(alunos.map((a) => a.periodo).filter((p): p is string => !!p))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { numeric: true }),
  );
  if (periodos.length < 2) return alunos;
  const atual = periodos[periodos.length - 1];
  return alunos.filter((a) => a.periodo === atual);
}

export function calcularIndicadores(historico: Aluno[], limiares: Limiares): Indicadores {
  const alunos = periodoMaisRecente(historico);
  const porComponente = desempenhoPorComponente(alunos);

  return {
    totalAlunos: alunos.length,
    totalRegistros: historico.length,
    periodoAtual: alunos.length !== historico.length ? alunos[0]?.periodo : undefined,
    frequenciaPorTurma: frequenciaPorTurma(alunos),
    desempenhoPorTurma: desempenhoPorTurma(alunos),
    desempenhoPorComponente: porComponente,
    componenteMaisCritico: componenteMaisCritico(porComponente),
    alunosEmAlerta: alunosEmAlerta(alunos, limiares),
    taxaRiscoEvasao: taxaRiscoEvasao(alunos, limiares),
    distribuicaoDefasagem: distribuicaoDefasagem(alunos, limiares),
    coberturaAee: coberturaAee(alunos, limiares),
    quedaFrequencia: quedaFrequenciaJanelaMovel(historico),
  };
}

export * from './agregacoes';
export * from './aee';
export * from './componente';
export * from './defasagem';
export * from './janela';
export * from './risco';
