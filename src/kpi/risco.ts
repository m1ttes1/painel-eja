import type { Limiares } from '../config/limiares';
import type { Aluno } from '../types';

export type MotivoAlerta = 'freq. baixa' | 'faltas seguidas' | 'notas baixas';

export interface AlunoEmAlerta {
  aluno: Aluno;
  motivos: MotivoAlerta[];
}

/**
 * Regra herdada da AE I. As comparações de fronteira são parte do contrato:
 * frequência exatamente no limiar NÃO é risco; faltas exatamente no limiar SÃO.
 */
export function motivosAlerta(aluno: Aluno, limiares: Limiares): MotivoAlerta[] {
  const motivos: MotivoAlerta[] = [];
  if (aluno.frequenciaPct < limiares.frequenciaMinima) motivos.push('freq. baixa');
  if (aluno.faltasConsecutivas >= limiares.faltasConsecutivas) motivos.push('faltas seguidas');
  if (aluno.mediaNotas < limiares.notaMinima) motivos.push('notas baixas');
  return motivos;
}

export function alunosEmAlerta(alunos: Aluno[], limiares: Limiares): AlunoEmAlerta[] {
  return alunos
    .map((aluno) => ({ aluno, motivos: motivosAlerta(aluno, limiares) }))
    .filter((x) => x.motivos.length > 0)
    .sort((a, b) => {
      if (b.motivos.length !== a.motivos.length) return b.motivos.length - a.motivos.length;
      return a.aluno.frequenciaPct - b.aluno.frequenciaPct;
    });
}

export function taxaRiscoEvasao(alunos: Aluno[], limiares: Limiares): number {
  if (alunos.length === 0) return 0;
  return (alunosEmAlerta(alunos, limiares).length / alunos.length) * 100;
}
