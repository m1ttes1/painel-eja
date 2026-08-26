# Painel EJA

Painel de acompanhamento pedagógico para turmas de EJA, entregue como um arquivo
HTML único que roda no navegador, sem instalação e sem rede.

Atividade Extensionista II — CST em Análise e Desenvolvimento de Sistemas, UNINTER.
Continuação do levantamento realizado na Atividade Extensionista I.

- Design: `docs/superpowers/specs/2026-08-25-painel-eja-ae2-design.md`
- Plano: `docs/superpowers/plans/2026-08-25-painel-eja.md`
- Guia entregue à escola: `entrega/GUIA-DE-USO.md`

## Desenvolvimento

```bash
npm install
npm test          # suíte completa
npm run dev       # servidor local
npm run build     # gera dist/painel-eja.html
npm run oraculo   # regenera oraculo/esperado.json a partir do protótipo da AE I
```

## Privacidade

Nenhum registro real de aluno entra neste repositório. O painel processa o
arquivo no navegador de quem o abre; nada trafega para fora da máquina. O
`.gitignore` bloqueia mecanicamente os caminhos de dado real.
