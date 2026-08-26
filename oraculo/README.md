# Oráculo de teste

`dashboard_ae1.py` é a cópia congelada do protótipo da Atividade Extensionista I.
Não editar: ele é a implementação de referência dos KPIs.

`gerar_oraculo.py` roda as regras daquele protótipo sobre `dados/alunos_simulados.txt`
e congela as saídas em `esperado.json`. Os testes em TypeScript conferem a
reimplementação contra esse arquivo.

Regenerar: `npm run oraculo`

Se um valor de `esperado.json` mudar, é porque uma regra de KPI mudou. Isso exige
decisão explícita e registro no relatório — não é para ser regenerado por reflexo
quando um teste fica vermelho.
