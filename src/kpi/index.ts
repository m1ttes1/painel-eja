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

export function calcularIndicadores(alunos: Aluno[], limiares: Limiares): Indicadores {
  const porComponente = desempenhoPorComponente(alunos);

  return {
    totalAlunos: alunos.length,
    frequenciaPorTurma: frequenciaPorTurma(alunos),
    desempenhoPorTurma: desempenhoPorTurma(alunos),
    desempenhoPorComponente: porComponente,
    componenteMaisCritico: componenteMaisCritico(porComponente),
    alunosEmAlerta: alunosEmAlerta(alunos, limiares),
    taxaRiscoEvasao: taxaRiscoEvasao(alunos, limiares),
    distribuicaoDefasagem: distribuicaoDefasagem(alunos, limiares),
    coberturaAee: coberturaAee(alunos, limiares),
    quedaFrequencia: quedaFrequenciaJanelaMovel(alunos),
  };
}

export * from './agregacoes';
export * from './aee';
export * from './componente';
export * from './defasagem';
export * from './janela';
export * from './risco';
