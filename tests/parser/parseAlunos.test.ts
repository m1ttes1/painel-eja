import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAlunos } from '../../src/parser';

const CABECALHO =
  'nome;turma;turno;idade;frequencia_pct;nota_portugues;nota_matematica;nota_ciencias;faltas_consecutivas;possui_deficiencia;apoio_recomendado;observacao';

function comLinhas(...linhas: string[]): string {
  return [CABECALHO, ...linhas].join('\n');
}

describe('parseAlunos', () => {
  it('le uma linha valida e deriva mediaNotas', () => {
    const r = parseAlunos(comLinhas('Ana;6A;Noturno;40;90.0;6;7;8;1;nao;;'));
    expect(r.erros).toEqual([]);
    expect(r.totalLinhas).toBe(1);
    expect(r.alunos).toHaveLength(1);
    expect(r.alunos[0]!.nome).toBe('Ana');
    expect(r.alunos[0]!.mediaNotas).toBeCloseTo(7, 10);
    expect(r.alunos[0]!.possuiDeficiencia).toBe(false);
  });

  it('reconhece possui_deficiencia sim, com maiuscula e espaco', () => {
    const r = parseAlunos(comLinhas('Ana;6A;Noturno;40;90;6;7;8;1; SIM ;;'));
    expect(r.alunos[0]!.possuiDeficiencia).toBe(true);
  });

  it('reporta coluna obrigatoria ausente na linha 1 e nao produz aluno', () => {
    const r = parseAlunos('nome;turma\nAna;6A');
    expect(r.alunos).toEqual([]);
    expect(r.erros[0]!.linha).toBe(1);
    expect(r.erros[0]!.motivo).toContain('frequencia_pct');
  });

  it('avisa quando o cabecalho parece separado por virgula em vez de ponto e virgula', () => {
    const cabecalhoVirgula =
      'nome,turma,turno,idade,frequencia_pct,nota_portugues,nota_matematica,nota_ciencias,faltas_consecutivas,possui_deficiencia,apoio_recomendado,observacao';
    const r = parseAlunos([cabecalhoVirgula, 'Ana,6A,Noturno,40,90,6,7,8,1,nao,,'].join('\n'));
    expect(r.alunos).toEqual([]);
    expect(r.erros[0]!.motivo).toContain('separado por vírgula');
    expect(r.erros[0]!.motivo).not.toContain('nome, turma');
  });

  it('descarta so a linha invalida e mantem as validas', () => {
    const r = parseAlunos(
      comLinhas(
        'Ana;6A;Noturno;40;90;6;7;8;1;nao;;',
        'Bruno;6A;Noturno;40;;6;7;8;1;nao;;',
        'Carla;6A;Noturno;40;80;6;7;8;1;nao;;',
      ),
    );
    expect(r.alunos.map((a) => a.nome)).toEqual(['Ana', 'Carla']);
    expect(r.totalLinhas).toBe(3);
    expect(r.erros).toHaveLength(1);
    expect(r.erros[0]!.linha).toBe(3);
    expect(r.erros[0]!.coluna).toBe('frequencia_pct');
  });

  it('reporta valor fora de faixa com o numero da linha', () => {
    const r = parseAlunos(comLinhas('Ana;6A;Noturno;40;120;6;7;8;1;nao;;'));
    expect(r.alunos).toEqual([]);
    expect(r.erros[0]!.linha).toBe(2);
    expect(r.erros[0]!.motivo).toContain('0 e 100');
  });

  it('reporta idade fora da faixa com o numero da linha', () => {
    const r = parseAlunos(comLinhas('Ana;6A;Noturno;9999;90;6;7;8;1;nao;;'));
    expect(r.alunos).toEqual([]);
    expect(r.erros[0]!.coluna).toBe('idade');
    expect(r.erros[0]!.motivo).toContain('0 e 120');
  });

  it('aluno sem nenhuma nota descarta a linha com um erro por coluna de nota', () => {
    const r = parseAlunos(comLinhas('Ana;6A;Noturno;40;90;;;;1;nao;;'));
    expect(r.alunos).toEqual([]);
    expect(r.erros.map((e) => e.coluna)).toEqual(['nota_portugues', 'nota_matematica', 'nota_ciencias']);
    expect(r.erros.every((e) => e.linha === 2)).toBe(true);
  });

  it('arquivo com um unico aluno processa normalmente, sem tratamento especial', () => {
    const r = parseAlunos(comLinhas('Ana;6A;Noturno;40;90;6;7;8;1;nao;;'));
    expect(r.alunos).toHaveLength(1);
    expect(r.erros).toEqual([]);
    expect(r.totalLinhas).toBe(1);
  });

  it('reporta nome vazio', () => {
    const r = parseAlunos(comLinhas(';6A;Noturno;40;90;6;7;8;1;nao;;'));
    expect(r.erros[0]!.coluna).toBe('nome');
  });

  it('avisa quando o arquivo aparenta encoding diferente de UTF-8', () => {
    const r = parseAlunos('nome;turma;frequencia_pct;nota_portugues;nota_matematica;nota_ciencias;faltas_consecutivas\nAn�a;6A;90;6;7;8;1');
    expect(r.erros.some((e) => e.motivo.includes('acentua'))).toBe(true);
  });

  it('trata arquivo vazio sem lancar excecao', () => {
    const r = parseAlunos('');
    expect(r.alunos).toEqual([]);
    expect(r.totalLinhas).toBe(0);
    expect(r.erros[0]!.motivo).toContain('vazio');
  });

  it('arquivo so com cabecalho (zero linhas de dado) nao lanca excecao', () => {
    const r = parseAlunos(CABECALHO);
    expect(r).toEqual({ alunos: [], erros: [], totalLinhas: 0 });
  });

  it('reconhece cabecalho com maiusculas e minusculas misturadas', () => {
    const cabecalhoVariado = CABECALHO.replace('nome', 'Nome').replace('turma', 'Turma');
    const r = parseAlunos([cabecalhoVariado, 'Ana;6A;Noturno;40;90;6;7;8;1;nao;;'].join('\n'));
    expect(r.erros).toEqual([]);
    expect(r.alunos).toHaveLength(1);
    expect(r.alunos[0]!.nome).toBe('Ana');
  });

  it('le o dataset simulado da AE I inteiro sem erro', () => {
    const texto = readFileSync('dados/alunos_simulados.txt', 'utf-8');
    const r = parseAlunos(texto);
    expect(r.erros).toEqual([]);
    expect(r.alunos).toHaveLength(100);
  });

  it('reporta numero de linha correto mesmo com linhas em branco no meio', () => {
    const conteudo =
      'nome;turma;turno;idade;frequencia_pct;nota_portugues;nota_matematica;nota_ciencias;faltas_consecutivas;possui_deficiencia;apoio_recomendado;observacao\n' +
      'Ana;6A;Noturno;40;90;6;7;8;1;nao;;\n' +
      '\n' +
      'Bruno;6A;Noturno;40;150;6;7;8;1;nao;;';
    const r = parseAlunos(conteudo);
    // Ana is on physical line 2 (valid)
    // Blank line on physical line 3
    // Bruno is on physical line 4 (error: frequencia_pct 150 > max 100)
    expect(r.erros[0]!.linha).toBe(4);
    expect(r.erros[0]!.coluna).toBe('frequencia_pct');
  });
});
