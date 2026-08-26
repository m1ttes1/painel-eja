export interface Aluno {
  nome: string;
  turma: string;
  turno?: string;
  idade?: number;
  frequenciaPct: number;
  notaPortugues: number;
  notaMatematica: number;
  notaCiencias: number;
  faltasConsecutivas: number;
  possuiDeficiencia: boolean;
  apoioRecomendado?: string;
  observacao?: string;
  periodo?: string;
  /** Média aritmética simples das três notas. Derivado pelo parser. */
  mediaNotas: number;
}

export interface ErroLinha {
  /** 1-based; o cabeçalho é a linha 1. */
  linha: number;
  coluna?: string;
  motivo: string;
}

export interface ResultadoParse {
  alunos: Aluno[];
  erros: ErroLinha[];
  /** Linhas de dado encontradas, válidas ou não. Não conta o cabeçalho. */
  totalLinhas: number;
}
