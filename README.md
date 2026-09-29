# Painel EJA

Painel de acompanhamento pedagógico para turmas da Educação de Jovens e Adultos (EJA).

Projeto da Atividade Extensionista II do curso de Análise e Desenvolvimento de Sistemas (Centro Universitário Internacional UNINTER), aplicado na EMEF/EJA Profa. Maria de Fátima Faria Área, em Campinas/SP.

## O problema

Antes de cada conselho de classe, os professores da EJA noturna juntam frequência, notas e faltas de cada aluno na mão. Isso toma tempo e dificulta ver quem está começando a se afastar da escola, que é justamente o aluno que ainda dá para recuperar.

## O que o painel faz

O professor abre o arquivo `painel-eja.html` no navegador e arrasta a planilha da turma. Na hora aparecem:

- frequência média e desempenho por turma;
- desempenho por disciplina;
- alunos que precisam de atenção, dos casos mais graves para os mais leves;
- alunos cuja frequência caiu entre um período e outro;
- alunos com deficiência e quantos deles estão em alerta;
- a relação entre frequência e desempenho de cada aluno.

Os limites de frequência mínima, faltas seguidas e média mínima podem ser ajustados na tela, conforme o critério da escola. A página tem versão para impressão (Ctrl+P) para levar ao conselho.

## Privacidade

O arquivo é lido dentro do próprio navegador. Nada é enviado pela internet e nada fica gravado em servidor. Dá para conferir desligando a internet e usando o painel normalmente. Os dados deste repositório são fictícios.

## Como usar

1. Baixe `dist/painel-eja.html` e abra no navegador (não precisa instalar nada).
2. Arraste o arquivo da turma para a área indicada. Para testar, use `dataset/turmas-eja-completo.txt`.

O arquivo precisa ser `.txt` ou `.csv` separado por ponto e vírgula, com as colunas `nome`, `turma`, `frequencia_pct`, `nota_portugues`, `nota_matematica`, `nota_ciencias` e `faltas_consecutivas`. Colunas opcionais: `periodo`, `turno`, `idade`, `possui_deficiencia`, `observacao`. Com a coluna `periodo` (uma linha por aluno em cada período), o painel mostra também a queda de frequência.

Mais detalhes para a escola em `entrega/GUIA-DE-USO.md`.

## Para desenvolver

```
npm install
npm test         # testes automatizados (Vitest)
npm run build    # gera dist/painel-eja.html
npm run dev      # servidor local para desenvolvimento
```

Feito em TypeScript com Vite. Os cálculos são conferidos contra o protótipo em Python da Atividade Extensionista I (pasta `oraculo/`), e há testes que conferem regras da interface em vários cenários (arquivo vazio, um período, vários períodos, nomes longos).

## Estrutura

```
src/parser/   leitura e validação do arquivo
src/kpi/      cálculo dos indicadores
src/render/   montagem da tela (cartões, gráficos, tabelas)
tests/        testes automatizados
oraculo/      protótipo da AE I usado como referência
dataset/      dados fictícios de demonstração
docs/projeto/ especificação e plano do projeto
```

## Autor

Victor Mittestainer
