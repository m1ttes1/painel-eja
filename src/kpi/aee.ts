import type { Limiares } from '../config/limiares';
import type { Aluno } from '../types';
import { motivosAlerta } from './risco';

export interface CoberturaAee {
  totalComDeficiencia: number;
  comDeficienciaEmAlerta: number;
  percentualDoTotal: number;
}

/**
 * O indicador não trata deficiência como risco. Ele aponta onde o
 * acompanhamento pedagógico e o atendimento educacional especializado
 * precisam ser coordenados.
 */
export function coberturaAee(alunos: Aluno[], limiares: Limiares): CoberturaAee {
  const comDeficiencia = alunos.filter((a) => a.possuiDeficiencia);
  const emAlerta = comDeficiencia.filter((a) => motivosAlerta(a, limiares).length > 0);

  return {
    totalComDeficiencia: comDeficiencia.length,
    comDeficienciaEmAlerta: emAlerta.length,
    percentualDoTotal: alunos.length === 0 ? 0 : (comDeficiencia.length / alunos.length) * 100,
  };
}
