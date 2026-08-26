# Painel de Acompanhamento Pedagógico — EJA

## Como abrir

Dê dois cliques no arquivo `painel-eja.html`. Ele abre no navegador.
Não precisa instalar nada e não precisa de internet.

## Como carregar a turma

1. Exporte do sistema da secretaria um arquivo `.txt` ou `.csv` separado por ponto e vírgula.
2. Clique em "Escolher arquivo" ou arraste o arquivo até a área indicada.
3. Os indicadores aparecem na hora.

## Colunas que o arquivo precisa ter

`nome`, `turma`, `frequencia_pct`, `nota_portugues`, `nota_matematica`,
`nota_ciencias`, `faltas_consecutivas`.

Opcionais: `turno`, `idade`, `possui_deficiencia`, `apoio_recomendado`,
`observacao`, `periodo`.

A coluna `periodo` (bimestre ou mês) ativa o indicador de queda de frequência.
Ela exige uma linha por aluno em cada período.

## Se aparecer aviso de problema

O painel mostra a linha e o motivo, e calcula os indicadores com as linhas que
deram certo. Corrija a planilha na linha indicada e carregue de novo.

## Como ajustar os limiares

Os três limiares — frequência mínima, faltas consecutivas e média mínima — ficam
no alto da tela. Alterar um deles recalcula tudo na hora. O ajuste fica salvo
neste computador.

## Sobre os dados

O arquivo é lido dentro do próprio navegador, no computador da escola. Nada é
enviado pela internet, nada é gravado em servidor. Para conferir: desligue a
internet e use o painel normalmente.

## Para levar ao conselho de classe

Use `Ctrl+P`. A versão impressa sai sem os controles, só com os indicadores e a
lista de alunos em alerta.
