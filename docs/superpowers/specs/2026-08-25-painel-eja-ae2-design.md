# Painel EJA — Design da Atividade Extensionista II

**Data:** 2026-08-25
**Autor:** Victor Mittestainer (RU 3655738)
**Curso:** CST em Análise e Desenvolvimento de Sistemas — UNINTER
**Disciplina:** Atividade Extensionista II — Tecnologia Aplicada à Inclusão Digital (Projeto)
**Status:** aguardando revisão

---

## 1. Contexto

A Atividade Extensionista I entregou o levantamento: mapeamento conceitual do
acompanhamento pedagógico em escola pública municipal, definição de sete KPIs para o
contexto de EJA e um protótipo funcional em Python que implementou cinco deles sobre um
dataset simulado de 100 alunos fictícios em quatro turmas.

A conclusão daquele trabalho deixou quatro frentes registradas para esta etapa:

1. apresentar o protótipo à equipe pedagógica e colher retorno estruturado;
2. calibrar os limiares de alerta com o histórico das turmas;
3. implementar os dois indicadores que ficaram especificados mas não construídos;
4. definir com a escola um fluxo de entrada que respeite a LGPD.

Esta etapa executa as quatro.

### 1.1 O que mudou na exigência

Para os cursos tecnólogos a Atividade Extensionista II é a última do curso — não há III nem
IV. O manual específico de tecnólogos move para cá a exigência de campo que, na trilha de
bacharelado, ficaria para a etapa de implementação:

> "Por ser sua última Atividade Extensionista dentro do seu curso, você deve comprovar o
> desenvolvimento do projeto e a aplicação prática do projeto dentro da comunidade local."

A seção 5.5 do manual — "Evidências de aplicação (obrigatório)" — exige demonstrar duas
coisas: a solução implantada e operando, e o benefício ou impacto gerado. O critério R da
rubrica vale 20 dos 100 pontos e mede exatamente isso.

Consequência de projeto: **entregar código funcionando não basta.** O produto precisa
chegar às mãos do professor, funcionar na máquina dele e gerar registro disso.

---

## 2. Objetivo

Transformar o protótipo de prova de conceito da AE I em uma ferramenta que a equipe
pedagógica da EMEF/EJA Maria de Fátima Faria Área (Campinas-SP) consiga operar sozinha,
sem instalação, sem internet e sem que nenhum dado de aluno saia da máquina da escola.

### 2.1 Critérios de sucesso

| # | Critério | Como se verifica |
|---|---|---|
| CS1 | Professor abre o painel e carrega um arquivo sem ajuda técnica | Observação direta na sessão de campo |
| CS2 | Os sete KPIs calculam corretamente | Suíte de testes verde contra o oráculo Python |
| CS3 | Nenhum dado trafega para fora da máquina | Painel funciona com a rede desligada |
| CS4 | Limiares ajustáveis sem tocar em código | Professor altera um limiar durante a sessão |
| CS5 | Aplicação na comunidade comprovada | Declaração assinada + fotos + formulários respondidos |

CS5 é o critério que vale nota e o único que não depende só de código.

---

## 3. Decisões de arquitetura

### 3.1 Entregável: arquivo HTML único

A escola recebe **um arquivo**: `painel-eja.html`. CSS, JavaScript e fontes embutidos.
Duplo clique, abre no navegador, funciona offline.

A alternativa de manter o script Python foi descartada: exigiria Python, pandas e
matplotlib instalados na máquina da escola, o que transforma a adoção em um problema de
infraestrutura da prefeitura — precisamente o atrito que a AE I identificou e evitou ao
optar por consumir CSV em vez de integrar sistemas.

A alternativa de hospedar um app web foi descartada por LGPD: subir registro de frequência
e desempenho de estudante, parte deles menor de idade, para um servidor criaria uma base
legal a justificar, um encarregado a nomear e um fluxo de consentimento a operar. A
arquitetura local elimina o problema em vez de administrá-lo.

### 3.2 Código-fonte modular, entrega monolítica

O desenvolvimento acontece em TypeScript modular sob `src/`. O comando `npm run build`
(Vite + `vite-plugin-singlefile`) colapsa tudo no arquivo único.

Node e npm existem apenas na máquina de desenvolvimento. A escola não sabe que existem.

Isso preserva as duas propriedades que estão em tensão: código testável de um lado,
entregável de zero fricção do outro.

### 3.3 Processamento estritamente local

O bundle não contém `fetch`, `XMLHttpRequest`, WebSocket nem `<script src>` externo. A
leitura do arquivo usa a API `FileReader`, que opera sobre o arquivo selecionado pelo
usuário sem qualquer transmissão.

A verificação disso é demonstrável para leigos: com a rede desligada, o painel continua
funcionando. Essa demonstração entra na sessão de campo e no relatório.

---

## 4. Módulos

Cada módulo tem uma responsabilidade e uma fronteira explícita.

| Módulo | Responsabilidade | Depende de | Testável isolado |
|---|---|---|---|
| `src/parser/` | Ler CSV/TXT delimitado por `;`, validar schema, normalizar tipos, reportar erro por linha | nada | sim — string entra, estrutura sai |
| `src/kpi/` | Sete funções puras, uma por indicador | tipos do parser | sim — dados entram, números saem |
| `src/config/` | Limiares e defaults, persistência em `localStorage` | nada | sim |
| `src/render/` | Gráficos SVG, tabelas, painel de erros | saída de `kpi/` | sim — via snapshot de markup |
| `src/app.ts` | Orquestração: arquivo → parser → kpi → render | todos | teste de integração |

Restrições de fronteira, que valem como regra de revisão:

- `kpi/` não conhece DOM, `document` nem `window`.
- `render/` não conhece arquivo, `File` nem `FileReader`.
- `parser/` não conhece regra de negócio — não sabe o que é "aluno em risco".

Quando um módulo passar de ~300 linhas, é sinal de que acumulou responsabilidade e precisa
ser dividido.

---

## 5. Fluxo de dados

```
professor seleciona ou arrasta o arquivo
   ↓
FileReader lê para a memória do navegador
   ↓
parser: valida schema, normaliza tipos, separa linhas válidas de inválidas
   ↓
kpi: calcula os sete indicadores sobre as linhas válidas
   ↓
render: monta cards, gráficos SVG, lista de alerta e painel de erros
```

O fluxo é unidirecional e sem estado compartilhado. Trocar de arquivo reexecuta o pipeline
inteiro do zero.

---

## 6. Indicadores

### 6.0 Schema de entrada

Arquivo texto delimitado por `;`, codificação UTF-8, uma linha por aluno, com cabeçalho.
Formato herdado do protótipo da AE I e compatível com o que sistemas de gestão escolar
municipal costumam exportar.

| Coluna | Tipo | Obrigatória | Faixa válida |
|---|---|---|---|
| `nome` | texto | sim | não vazio |
| `turma` | texto | sim | não vazio |
| `turno` | texto | não | — |
| `idade` | inteiro | não | 0–120 |
| `frequencia_pct` | decimal | sim | 0–100 |
| `nota_portugues` | decimal | sim | 0–10 |
| `nota_matematica` | decimal | sim | 0–10 |
| `nota_ciencias` | decimal | sim | 0–10 |
| `faltas_consecutivas` | inteiro | sim | ≥ 0 |
| `possui_deficiencia` | `sim`/`nao` | não | — |
| `apoio_recomendado` | texto | não | — |
| `observacao` | texto | não | — |
| `periodo` | texto | não | novo nesta etapa — ver 6.2 |

**Campo derivado.** `media_notas` é a média aritmética simples de `nota_portugues`,
`nota_matematica` e `nota_ciencias`, calculada pelo parser. É o valor usado por todas as
regras que falam em desempenho.

O conjunto de componentes curriculares é fixo nestes três, herdado da AE I. Generalizar
para um número variável de componentes está fora de escopo nesta etapa.

### 6.1 Portados da AE I (quatro)

Já implementados e validados em Python; serão reimplementados em TypeScript com os mesmos
critérios de cálculo, verificados contra o oráculo.

1. Frequência média por turma e por aluno
2. Taxa de risco de evasão — regra combinada
3. Lista nominal de alunos em alerta, ordenada por criticidade
4. Cobertura de apoio específico (AEE)

**Regra de risco, conforme implementada na AE I** — um aluno entra em alerta se qualquer
condição for verdadeira:

| Condição | Comparação | Limiar padrão |
|---|---|---|
| Frequência baixa | `frequencia_pct < LIMIAR` | 75.0 |
| Faltas seguidas | `faltas_consecutivas >= LIMIAR` | 3 |
| Notas baixas | `media_notas < LIMIAR` | 5.0 |

As comparações de fronteira são parte do contrato e não são acidentais: frequência de
exatamente 75,0% **não** é risco; exatamente 3 faltas consecutivas **é** risco. Cada uma
recebe um teste nomeado.

### 6.2 Novos (três)

**Quebra de desempenho por componente curricular.** O dado já existe no schema
(`nota_portugues`, `nota_matematica`, `nota_ciencias`). Implementação direta: distribuição
por componente, por turma, com destaque para o componente que concentra dificuldade.

**Queda de frequência em janela móvel.** Pressupõe série histórica, que o schema atual não
possui. Decisão: o schema ganha a coluna **opcional** `periodo` (bimestre ou mês).

- Coluna presente com dois ou mais períodos → o indicador calcula a variação recente do
  aluno contra o próprio histórico.
- Coluna ausente ou com um só período → o card aparece com a mensagem "requer histórico de
  2 ou mais períodos", em vez de sumir da tela.

A escolha por degradar visivelmente em vez de esconder é deliberada: o card visível
comunica à escola qual registro ela precisaria passar a manter, o que é parte do resultado
do projeto.

**Defasagem entre frequência e desempenho.** Indicador novo desta etapa — não estava no
protótipo da AE I. Cruza os dois eixos que a regra de risco acima já calcula separadamente,
presença e desempenho, numa classificação 2×2 por aluno, com as mesmas fronteiras da seção
6.1: regular (frequente e com desempenho adequado), intervenção didática (frequente, mas com
desempenho baixo), ação de permanência (desempenho adequado, mas ausente) e crítico (ausente
e com desempenho baixo — atenção prioritária).

### 6.3 Configuração de limiares

Os três limiares saem do código e viram tela de configuração, com persistência local por
navegador. Isso executa a frente 2 registrada na AE I — calibrar os limiares ao perfil real
das turmas deixa de ser alteração de implementação e passa a ser ajuste de uso.

---

## 7. Tratamento de erro

Arquivo exportado de sistema de gestão escolar real é sujo. Duas regras governam o
comportamento:

1. **Nunca falhar em silêncio.** Todo problema aparece na tela, com número da linha e
   motivo em português comum.
2. **Nunca descartar o lote por causa de uma linha.** O cálculo prossegue com as linhas
   válidas e informa quantas entraram e quantas ficaram de fora.

Casos cobertos: coluna obrigatória ausente, cabeçalho divergente, tipo inválido, nota fora
de 0–10, frequência fora de 0–100, faltas negativas, linha vazia, arquivo vazio, arquivo
que não é texto delimitado, encoding diferente de UTF-8 (comum em export de sistema
municipal — acentuação quebrada não pode derrubar o painel).

A justificativa é de uso, não técnica: um professor que recebe "erro ao processar arquivo"
abandona a ferramenta; um professor que recebe "linha 47: nota de matemática vazia" corrige
a planilha e segue.

---

## 8. Estratégia de teste

**Ferramenta:** Vitest. **Método:** TDD nas funções de KPI — teste primeiro, vermelho,
implementação, verde.

**Oráculo.** O `dashboard.py` da AE I roda sobre os datasets de referência e suas saídas são
congeladas como valores esperados. Os testes em TypeScript conferem contra elas. Isso dá
duas coisas: uma verificação independente da reimplementação e uma prova documentada de
continuidade técnica entre AE I e AE II.

**Casos de fronteira nomeados** — frequência exatamente 75,0; exatamente 3 faltas
consecutivas; média exatamente 5,0; aluno sem nenhuma nota; turma com um único aluno;
arquivo com um único aluno; todos os alunos em alerta; nenhum aluno em alerta.

**Acessibilidade como teste, não como intenção.** Contraste mínimo verificado; nenhuma
informação codificada apenas por cor (alerta tem rótulo textual além do vermelho);
navegação completa por teclado; folha de estilo de impressão para levar ao conselho de
classe. Alimenta o checklist de acessibilidade que o manual pede e sustenta os princípios
do Desenho Universal já declarados na proposta da AE I.

---

## 9. Plano de campo

Esta seção vale 20 pontos da rubrica e é a única que não depende de código.

**Contato:** Valdir Gomes, professor da EMEF/EJA Maria de Fátima Faria Área há mais de 20
anos. Já viu o protótipo da AE I e avaliou positivamente, de forma informal.

**Sessão de campo** — uma visita presencial, aproximadamente 1 hora:

1. Apresentação do painel funcionando.
2. Demonstração de LGPD com a rede desligada.
3. O professor opera: carrega arquivo e ajusta um limiar por conta própria.
4. Formulário de feedback estruturado respondido por dois a três docentes.
5. Registro fotográfico da sessão.
6. Entrega do arquivo e do guia de uso de uma página.
7. Declaração da instituição, assinada.

**Sobre o dado usado na demonstração.** A demonstração roda sobre o dataset simulado de 100
alunos fictícios, que já existe — risco zero. Se a escola quiser ver o painel com o export
real, o professor abre o arquivo dele na máquina dele; nenhum registro real é copiado,
transmitido ou visto por mim. Fotos da tela com dado real, se houver, saem com os nomes
borrados, e o padrão `evidencias/brutas/` do `.gitignore` impede que material não tratado
entre no repositório.

**Riscos e resposta:**

| Risco | Prob. | Impacto | Resposta |
|---|---|---|---|
| Escola não responde a tempo | Média | Alto | Abrir contato na primeira semana, não em novembro. Data-limite para acionar comunidade alternativa: 31/10/2026 |
| Agenda escolar (recesso, conselho de classe) trava a visita | Média | Alto | Agendar com quatro semanas de antecedência; call gravada como alternativa |
| Máquina da escola com navegador muito antigo | Baixa | Médio | Testar em Chrome, Firefox e Edge; evitar API recente sem fallback |
| Export real da secretaria em formato divergente | Média | Baixo | O parser já trata divergência de cabeçalho com mensagem clara |
| Declaração não assinada na hora | Média | Alto | Levar impressa e preenchida, faltando só a assinatura |

---

## 10. Cronograma

O manual pontua explicitamente o diagrama sequencial **com os dias de duração de cada
etapa** (critério M, 20 pontos). Este cronograma é a fonte desse diagrama.

| Etapa | Período | Dias | Entrega |
|---|---|---|---|
| E0 — Design e planejamento | 25/08 – 30/08 | 6 | Spec e plano de implementação |
| E1 — Proposta + abertura de contato | 31/08 – 07/09 | 8 | Proposta postada no AVA; contato com a escola aberto |
| E2 — Parser e KPIs portados (TDD) | 08/09 – 28/09 | 21 | Cinco KPIs verdes contra o oráculo |
| E3 — KPIs novos e configuração | 29/09 – 19/10 | 21 | Sete KPIs; limiares configuráveis |
| E4 — Render, acessibilidade, build | 20/10 – 09/11 | 21 | `painel-eja.html` pronto |
| E5 — Campo | 10/11 – 30/11 | 21 | Evidências coletadas; declaração assinada |
| E6 — Calibração pós-feedback | 01/12 – 14/12 | 14 | Limiares ajustados; correções do retorno |
| E7 — Relatório final | 15/12 – 28/12 | 14 | Documento de 10 páginas |
| E8 — Revisão e entrega | 29/12 – 05/01 | 8 | PDF postado no AVA |

**Sobre a data da proposta.** A janela vai até 30/10, mas a proposta será postada por volta
de 07/09. O motivo é operacional: o manual determina que o trabalho final incorpore a
devolutiva do corretor. Postar no fim da janela deixaria a devolutiva chegando quando já
não há tempo de agir sobre ela.

**Sobre o contato com a escola.** Abre em E1, não em E5. Agendamento em escola pública leva
semanas, e a data-limite de decisão sobre plano B (31/10) precisa vir com folga suficiente
para redirecionar o projeto se necessário.

---

## 11. Restrições

- Trabalho final limitado a 10 páginas, no modelo institucional, em PDF.
- Um único arquivo por etapa no AVA.
- Nenhum registro real de aluno entra no repositório, em nenhuma circunstância.
- Repositório privado — o link não serve como evidência para o corretor; o registro de
  desenvolvimento entra no relatório como histórico de commits e capturas de tela.
- Objetivos do relatório devem usar verbo no infinitivo e citar a tecnologia (critério OBJ).

---

## 12. Fora de escopo

Registrado para evitar expansão silenciosa:

- Integração com sistema de gestão da prefeitura.
- Autenticação, contas de usuário, multiusuário.
- Persistência de dado de aluno entre sessões.
- Aplicativo móvel.
- Exportação de relatório em PDF por aluno — avaliado e descartado nesta etapa por escopo;
  candidato natural a trabalho futuro.
- Indicadores comportamentais que exigiriam a escola passar a manter registro estruturado
  novo, conforme identificado na conclusão da AE I.

---

## 13. Mapeamento com a rubrica

| Critério | Pts | Onde este design atende |
|---|---|---|
| ER — Estrutura e normas | 10 | Modelo institucional, PDF, 10 páginas (E7/E8) |
| T — Tema | 10 | Inclusão digital em escola pública; continuidade da AE I |
| SA — Setor de aplicação | 10 | EMEF/EJA Maria de Fátima Faria Área, Campinas-SP |
| ODS | 10 | ODS 4 e ODS 10, já alinhados na AE I |
| OBJ — Objetivos | 10 | Verbo no infinitivo, citando TypeScript e o pipeline local |
| M — Metodologia | 20 | Seção 10, com diagrama sequencial e dias por etapa |
| R — Resultados obtidos | 20 | Seções 8 e 9 — desenvolvimento testado e aplicação comprovada |
| CF — Considerações finais | 10 | Aprendizados da reimplementação e do retorno da escola |
