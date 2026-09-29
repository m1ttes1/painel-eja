# Painel EJA — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o protótipo Python da AE I em um arquivo HTML único que a equipe pedagógica da EMEF/EJA Maria de Fátima Faria Área opera sem instalação, sem rede e sem que dado de aluno saia da máquina.

**Architecture:** Código modular em TypeScript sob `src/`, dividido em parser (texto → dados), kpi (dados → números, funções puras) e render (números → SVG/DOM). O `app.ts` orquestra via `FileReader`. O build (Vite + `vite-plugin-singlefile`) colapsa tudo em `dist/painel-eja.html` com CSS, JS e fontes inline. Node existe só na máquina de desenvolvimento.

**Tech Stack:** TypeScript, Vite, `vite-plugin-singlefile`, Vitest, jsdom. SVG escrito à mão — nenhuma biblioteca de gráfico. Python 3 apenas para gerar o oráculo de teste a partir do `dashboard.py` da AE I.

**Spec:** `docs/projeto/specs/2026-08-25-painel-eja-ae2-design.md`

## Global Constraints

- **Nenhum registro real de aluno entra no repositório**, em nenhuma circunstância. Os padrões de bloqueio já estão no `.gitignore` (`dados/reais/`, `**/*.real.csv`, `evidencias/brutas/`).
- **Zero rede no bundle.** Nenhum `fetch`, `XMLHttpRequest`, `WebSocket`, `<script src>` externo, `@import` de fonte remota ou `<link>` para CDN. Verificado por teste automatizado na Task 16.
- **`src/kpi/` não conhece DOM.** Nada de `document`, `window`, `localStorage`.
- **`src/render/` não conhece arquivo.** Nada de `File`, `FileReader`, `Blob`.
- **`src/parser/` não conhece regra de negócio.** Não sabe o que é "aluno em risco".
- **Limiares padrão, exatos, herdados da AE I:** frequência `75.0`, faltas consecutivas `3`, nota `5.0`.
- **Comparações de fronteira, exatas:** `frequencia_pct < 75.0` (75,0 exato NÃO é risco), `faltas_consecutivas >= 3` (3 exato É risco), `media_notas < 5.0` (5,0 exato NÃO é risco).
- **`media_notas`** = média aritmética simples de `nota_portugues`, `nota_matematica`, `nota_ciencias`.
- **Componentes curriculares fixos** nesses três. Generalizar está fora de escopo.
- **Idioma:** identificadores de código em português sem acento (`frequenciaPct`), texto de interface em português com acento.
- **Alvo de build:** `es2019`, para tolerar navegador antigo de máquina de escola pública.
- **Quando um arquivo passar de ~300 linhas**, é sinal de responsabilidade acumulada — dividir.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts` | Toolchain |
| `scripts/pos-build.mjs` | Renomeia `dist/index.html` → `dist/painel-eja.html`, imprime tamanho |
| `index.html` | Casca da aplicação (entrada do Vite) |
| `src/types.ts` | `Aluno`, `ErroLinha`, `ResultadoParse` |
| `src/parser/csv.ts` | Texto delimitado → matriz de células |
| `src/parser/schema.ts` | Colunas obrigatórias, conversão e validação de campo |
| `src/parser/index.ts` | `parseAlunos` — orquestra csv + schema |
| `src/config/limiares.ts` | Tipo `Limiares`, `LIMIARES_PADRAO` |
| `src/config/persistencia.ts` | Ler/gravar limiares em `localStorage` |
| `src/kpi/agregacoes.ts` | Médias por turma |
| `src/kpi/risco.ts` | Motivos de alerta, lista ordenada, taxa de evasão |
| `src/kpi/defasagem.ts` | Quadrante frequência × desempenho |
| `src/kpi/aee.ts` | Cobertura de apoio específico |
| `src/kpi/componente.ts` | Desempenho por componente curricular |
| `src/kpi/janela.ts` | Queda de frequência em janela móvel |
| `src/kpi/index.ts` | `calcularIndicadores` — agrega tudo |
| `src/render/formato.ts` | Formatação numérica pt-BR |
| `src/render/barras.ts` | Gráfico de barras horizontais em SVG |
| `src/render/cards.ts` | Cards de indicador |
| `src/render/tabela.ts` | Tabela de alunos em alerta |
| `src/render/erros.ts` | Painel de erros de leitura |
| `src/render/config-ui.ts` | Formulário de limiares |
| `src/render/index.ts` | `renderPainel` |
| `src/estilo.css` | Estilo, tema claro, folha de impressão |
| `src/app.ts` | `FileReader`, arrastar-e-soltar, orquestração |
| `oraculo/dashboard_ae1.py` | Cópia congelada do protótipo da AE I |
| `oraculo/gerar_oraculo.py` | Roda o protótipo e congela saídas em JSON |
| `oraculo/esperado.json` | Valores de referência |
| `dados/alunos_simulados.txt` | Dataset fictício de 100 alunos (AE I) |
| `tests/**` | Espelha `src/` |

---

## Task 1: Toolchain e casca da aplicação

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `scripts/pos-build.mjs`, `src/app.ts`, `src/estilo.css`, `tests/toolchain.test.ts`
- Create: `dados/alunos_simulados.txt` (cópia)

**Interfaces:**
- Consumes: nada
- Produces: `npm test` e `npm run build` funcionando. `dist/painel-eja.html` existe.

- [ ] **Step 1: Copiar o dataset simulado da AE I**

```bash
mkdir -p dados
cp "V:/Uninter/2026 - 1° Semestre/Atividade Extensionista/prototipo/dados/alunos_simulados.txt" dados/alunos_simulados.txt
head -2 dados/alunos_simulados.txt
```

Esperado: cabeçalho com `nome;turma;turno;idade;frequencia_pct;...` e uma linha de aluno fictício.

- [ ] **Step 2: Instalar o toolchain**

```bash
npm init -y
npm install -D typescript vite vite-plugin-singlefile vitest jsdom @types/node
```

Deixe o npm resolver as versões correntes e comite o `package-lock.json` — fixar versão a mão aqui só cria divergência.

- [ ] **Step 3: Escrever `package.json`**

```json
{
  "name": "painel-eja",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && node scripts/pos-build.mjs",
    "test": "vitest run",
    "test:watch": "vitest",
    "oraculo": "python oraculo/gerar_oraculo.py"
  }
}
```

Mantenha o bloco `devDependencies` que o `npm install` gravou.

- [ ] **Step 4: Escrever `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2019", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

- [ ] **Step 5: Escrever `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'es2019',
    outDir: 'dist',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    // Sem o helper de preload do Vite, que emite uma referência a fetch()
    // e faria a trava de rede da Task 16 acusar falso positivo.
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Escrever `scripts/pos-build.mjs`**

```js
import { renameSync, statSync, existsSync } from 'node:fs';

const origem = 'dist/index.html';
const destino = 'dist/painel-eja.html';

if (!existsSync(origem)) {
  console.error(`Build nao gerou ${origem}`);
  process.exit(1);
}

renameSync(origem, destino);
const kb = (statSync(destino).size / 1024).toFixed(0);
console.log(`OK ${destino} — ${kb} KB, arquivo unico`);
```

- [ ] **Step 7: Escrever `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Painel de Acompanhamento Pedagógico — EJA</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/app.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: Escrever `src/estilo.css` mínimo**

```css
:root {
  --tinta: #0b0b0b;
  --tinta-fraca: #52514e;
  --superficie: #fcfcfb;
  --linha: #e1e0d9;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--tinta);
  background: var(--superficie);
}
```

- [ ] **Step 9: Escrever `src/app.ts` mínimo**

```ts
import './estilo.css';

const raiz = document.querySelector<HTMLDivElement>('#app');
if (raiz) {
  raiz.textContent = 'Painel EJA';
}
```

- [ ] **Step 10: Escrever o teste de fumaça do toolchain**

```ts
// tests/toolchain.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('toolchain', () => {
  it('o dataset simulado da AE I esta presente e tem cabecalho esperado', () => {
    const texto = readFileSync('dados/alunos_simulados.txt', 'utf-8');
    const cabecalho = texto.split(/\r?\n/)[0];
    expect(cabecalho).toContain('nome;turma');
    expect(cabecalho).toContain('frequencia_pct');
    expect(cabecalho).toContain('faltas_consecutivas');
  });
});
```

- [ ] **Step 11: Rodar o teste**

Run: `npm test`
Expected: PASS, 1 teste.

- [ ] **Step 12: Rodar o build e confirmar o arquivo único**

Run: `npm run build`
Expected: linha `OK dist/painel-eja.html — NN KB, arquivo unico`. Confirme que `dist/index.html` não existe mais.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html scripts/ src/ tests/ dados/
git commit -m "chore: toolchain Vite+TS+Vitest com build de arquivo unico"
```

---

## Task 2: Oráculo de teste a partir do protótipo da AE I

**Files:**
- Create: `oraculo/dashboard_ae1.py` (cópia), `oraculo/gerar_oraculo.py`, `oraculo/esperado.json` (gerado), `oraculo/README.md`

**Interfaces:**
- Consumes: `dados/alunos_simulados.txt` (Task 1)
- Produces: `oraculo/esperado.json` com as chaves `total_alunos`, `frequencia_por_turma`, `desempenho_por_turma`, `total_em_alerta`, `taxa_risco_evasao`, `alunos_em_alerta`, `cobertura_aee`. Consumido pelas Tasks 6, 7, 8 e 11.

- [ ] **Step 1: Congelar o protótipo da AE I no repositório**

```bash
mkdir -p oraculo
cp "V:/Uninter/2026 - 1° Semestre/Atividade Extensionista/prototipo/dashboard.py" oraculo/dashboard_ae1.py
```

O arquivo não deve ser editado. Ele é a referência contra a qual a reimplementação é verificada.

- [ ] **Step 2: Escrever `oraculo/gerar_oraculo.py`**

```python
"""
Gera oraculo/esperado.json a partir do protótipo da Atividade Extensionista I.

O protótipo `dashboard_ae1.py` é a implementação de referência dos KPIs. Este
script executa suas regras sobre o dataset simulado e congela as saídas, para
que a reimplementação em TypeScript seja verificada contra elas.

Uso:  python oraculo/gerar_oraculo.py
"""
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "oraculo"))

from dashboard_ae1 import (  # noqa: E402
    carregar_dados,
    LIMIAR_FREQUENCIA_RISCO,
    LIMIAR_FALTAS_CONSECUTIVAS_RISCO,
    LIMIAR_NOTA_ALERTA,
)

ENTRADA = RAIZ / "dados" / "alunos_simulados.txt"
SAIDA = RAIZ / "oraculo" / "esperado.json"


def medias_por_turma(df, coluna):
    agrupado = df.groupby("turma")[coluna].agg(["mean", "size"]).reset_index()
    registros = [
        {"turma": r["turma"], "valor": float(r["mean"]), "alunos": int(r["size"])}
        for _, r in agrupado.iterrows()
    ]
    return sorted(registros, key=lambda r: r["turma"])


def main():
    df = carregar_dados(str(ENTRADA))
    total = len(df)
    em_alerta = df[df["em_alerta"]]

    com_deficiencia = df[df["possui_deficiencia"]]
    esperado = {
        "limiares": {
            "frequencia_minima": LIMIAR_FREQUENCIA_RISCO,
            "faltas_consecutivas": LIMIAR_FALTAS_CONSECUTIVAS_RISCO,
            "nota_minima": LIMIAR_NOTA_ALERTA,
        },
        "total_alunos": total,
        "frequencia_por_turma": medias_por_turma(df, "frequencia_pct"),
        "desempenho_por_turma": medias_por_turma(df, "media_notas"),
        "total_em_alerta": int(len(em_alerta)),
        "taxa_risco_evasao": float(len(em_alerta) / total * 100),
        "alunos_em_alerta": sorted(
            [
                {"nome": r["nome"], "turma": r["turma"], "motivos": list(r["motivos_alerta"])}
                for _, r in em_alerta.iterrows()
            ],
            key=lambda r: r["nome"],
        ),
        "cobertura_aee": {
            "total_com_deficiencia": int(len(com_deficiencia)),
            "com_deficiencia_em_alerta": int(len(com_deficiencia[com_deficiencia["em_alerta"]])),
        },
    }

    SAIDA.write_text(json.dumps(esperado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK {SAIDA} — {total} alunos, {esperado['total_em_alerta']} em alerta")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Gerar o oráculo**

Run: `npm run oraculo`
Expected: `OK .../oraculo/esperado.json — 100 alunos, NN em alerta`

Se faltar dependência Python: `pip install pandas matplotlib`.

- [ ] **Step 4: Conferir o JSON gerado**

Run: `python -c "import json;d=json.load(open('oraculo/esperado.json',encoding='utf-8'));print(d['total_alunos'], d['total_em_alerta'], len(d['frequencia_por_turma']))"`
Expected: `100 NN 4` — cem alunos, quatro turmas.

- [ ] **Step 5: Escrever `oraculo/README.md`**

```markdown
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
```

- [ ] **Step 6: Commit**

```bash
git add oraculo/
git commit -m "test: congela o prototipo da AE I como oraculo de KPI"
```

---

## Task 3: Tipos e leitura de texto delimitado

**Files:**
- Create: `src/types.ts`, `src/parser/csv.ts`, `tests/parser/csv.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `interface Aluno`, `interface ErroLinha`, `interface ResultadoParse` (`src/types.ts`)
  - `function lerCelulas(texto: string): string[][]` (`src/parser/csv.ts`) — devolve matriz de células já com `trim`, incluindo a linha de cabeçalho na posição 0, ignorando linhas em branco

- [ ] **Step 1: Escrever `src/types.ts`**

```ts
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
```

- [ ] **Step 2: Escrever o teste que falha**

```ts
// tests/parser/csv.test.ts
import { describe, it, expect } from 'vitest';
import { lerCelulas } from '../../src/parser/csv';

describe('lerCelulas', () => {
  it('separa por ponto e virgula e faz trim de cada celula', () => {
    expect(lerCelulas('a; b ;c')).toEqual([['a', 'b', 'c']]);
  });

  it('separa linhas com LF e com CRLF', () => {
    expect(lerCelulas('a;b\r\nc;d\ne;f')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ]);
  });

  it('ignora linhas em branco, inclusive no fim do arquivo', () => {
    expect(lerCelulas('a;b\n\nc;d\n\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('devolve lista vazia para texto vazio ou so espacos', () => {
    expect(lerCelulas('')).toEqual([]);
    expect(lerCelulas('   \n  \n')).toEqual([]);
  });

  it('remove BOM do inicio do arquivo', () => {
    expect(lerCelulas('\uFEFFnome;turma')).toEqual([['nome', 'turma']]);
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/parser/csv.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/parser/csv"`.

- [ ] **Step 4: Implementar `src/parser/csv.ts`**

```ts
/**
 * Lê texto delimitado por ponto e vírgula e devolve a matriz de células.
 * Não conhece regra de negócio nem nome de coluna — só estrutura.
 */
export function lerCelulas(texto: string): string[][] {
  const semBom = texto.replace(/^\uFEFF/, '');
  return semBom
    .split(/\r?\n/)
    .filter((linha) => linha.trim() !== '')
    .map((linha) => linha.split(';').map((celula) => celula.trim()));
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/parser/csv.test.ts`
Expected: PASS, 5 testes.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/parser/csv.ts tests/parser/csv.test.ts
git commit -m "feat(parser): leitura de texto delimitado por ponto e virgula"
```

---

## Task 4: Validação de schema e erro por linha

**Files:**
- Create: `src/parser/schema.ts`, `src/parser/index.ts`, `tests/parser/schema.test.ts`, `tests/parser/parseAlunos.test.ts`

**Interfaces:**
- Consumes: `lerCelulas` (Task 3), tipos de `src/types.ts`
- Produces:
  - `const COLUNAS_OBRIGATORIAS: string[]` (`src/parser/schema.ts`)
  - `function lerNumero(bruto: string): number | null` — aceita vírgula ou ponto decimal; `null` quando não é número
  - `function parseAlunos(texto: string): ResultadoParse` (`src/parser/index.ts`) — usado pela Task 15

- [ ] **Step 1: Escrever o teste de schema que falha**

```ts
// tests/parser/schema.test.ts
import { describe, it, expect } from 'vitest';
import { lerNumero, COLUNAS_OBRIGATORIAS } from '../../src/parser/schema';

describe('lerNumero', () => {
  it('aceita ponto como separador decimal', () => {
    expect(lerNumero('82.5')).toBe(82.5);
  });

  it('aceita virgula como separador decimal — export brasileiro usa virgula', () => {
    expect(lerNumero('82,5')).toBe(82.5);
  });

  it('aceita inteiro', () => {
    expect(lerNumero('3')).toBe(3);
  });

  it('devolve null para vazio e para texto', () => {
    expect(lerNumero('')).toBeNull();
    expect(lerNumero('   ')).toBeNull();
    expect(lerNumero('nao informado')).toBeNull();
  });
});

describe('COLUNAS_OBRIGATORIAS', () => {
  it('lista as oito colunas exigidas pela spec', () => {
    expect(COLUNAS_OBRIGATORIAS).toEqual([
      'nome',
      'turma',
      'frequencia_pct',
      'nota_portugues',
      'nota_matematica',
      'nota_ciencias',
      'faltas_consecutivas',
    ]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/parser/schema.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/parser/schema.ts`**

```ts
export const COLUNAS_OBRIGATORIAS = [
  'nome',
  'turma',
  'frequencia_pct',
  'nota_portugues',
  'nota_matematica',
  'nota_ciencias',
  'faltas_consecutivas',
] as const;

/** Aceita vírgula ou ponto decimal. Devolve null quando não é número. */
export function lerNumero(bruto: string): number | null {
  const limpo = bruto.trim().replace(',', '.');
  if (limpo === '') return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : null;
}

export interface FaixaNumerica {
  min: number;
  max: number;
}

export const FAIXAS: Record<string, FaixaNumerica> = {
  frequencia_pct: { min: 0, max: 100 },
  nota_portugues: { min: 0, max: 10 },
  nota_matematica: { min: 0, max: 10 },
  nota_ciencias: { min: 0, max: 10 },
  faltas_consecutivas: { min: 0, max: 999 },
  idade: { min: 0, max: 120 },
};
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/parser/schema.test.ts`
Expected: PASS, 5 testes.

- [ ] **Step 5: Escrever o teste de `parseAlunos` que falha**

```ts
// tests/parser/parseAlunos.test.ts
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

  it('reporta nome vazio', () => {
    const r = parseAlunos(comLinhas(';6A;Noturno;40;90;6;7;8;1;nao;;'));
    expect(r.erros[0]!.coluna).toBe('nome');
  });

  it('avisa quando o arquivo aparenta encoding diferente de UTF-8', () => {
    const r = parseAlunos('nome;turma;frequencia_pct;nota_portugues;nota_matematica;nota_ciencias;faltas_consecutivas\nAn\uFFFDa;6A;90;6;7;8;1');
    expect(r.erros.some((e) => e.motivo.includes('acentua'))).toBe(true);
  });

  it('trata arquivo vazio sem lancar excecao', () => {
    const r = parseAlunos('');
    expect(r.alunos).toEqual([]);
    expect(r.totalLinhas).toBe(0);
    expect(r.erros[0]!.motivo).toContain('vazio');
  });

  it('le o dataset simulado da AE I inteiro sem erro', () => {
    const texto = readFileSync('dados/alunos_simulados.txt', 'utf-8');
    const r = parseAlunos(texto);
    expect(r.erros).toEqual([]);
    expect(r.alunos).toHaveLength(100);
  });
});
```

- [ ] **Step 6: Rodar e confirmar falha**

Run: `npx vitest run tests/parser/parseAlunos.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 7: Implementar `src/parser/index.ts`**

```ts
import type { Aluno, ErroLinha, ResultadoParse } from '../types';
import { lerCelulas } from './csv';
import { COLUNAS_OBRIGATORIAS, FAIXAS, lerNumero } from './schema';

function indicePorColuna(cabecalho: string[]): Map<string, number> {
  const mapa = new Map<string, number>();
  cabecalho.forEach((nome, i) => mapa.set(nome.toLowerCase(), i));
  return mapa;
}

function celula(linha: string[], mapa: Map<string, number>, coluna: string): string {
  const i = mapa.get(coluna);
  return i === undefined ? '' : (linha[i] ?? '');
}

export function parseAlunos(texto: string): ResultadoParse {
  const matriz = lerCelulas(texto);

  if (matriz.length === 0) {
    return { alunos: [], erros: [{ linha: 1, motivo: 'Arquivo vazio.' }], totalLinhas: 0 };
  }

  const erros: ErroLinha[] = [];
  const cabecalho = matriz[0]!;

  if (texto.includes('\uFFFD')) {
    erros.push({
      linha: 1,
      motivo:
        'O arquivo parece não estar em UTF-8: a acentuação pode aparecer trocada. Reexporte como UTF-8 se possível.',
    });
  }

  const mapa = indicePorColuna(cabecalho);
  const faltando = COLUNAS_OBRIGATORIAS.filter((c) => !mapa.has(c));
  if (faltando.length > 0) {
    erros.push({
      linha: 1,
      motivo: `Coluna obrigatória ausente no cabeçalho: ${faltando.join(', ')}.`,
    });
    return { alunos: [], erros, totalLinhas: matriz.length - 1 };
  }

  const alunos: Aluno[] = [];
  const linhasDeDado = matriz.slice(1);

  linhasDeDado.forEach((linha, i) => {
    const numeroDaLinha = i + 2;
    const problemas: ErroLinha[] = [];

    const nome = celula(linha, mapa, 'nome');
    const turma = celula(linha, mapa, 'turma');
    if (nome === '') problemas.push({ linha: numeroDaLinha, coluna: 'nome', motivo: 'Nome vazio.' });
    if (turma === '') problemas.push({ linha: numeroDaLinha, coluna: 'turma', motivo: 'Turma vazia.' });

    const numericos: Record<string, number> = {};
    for (const coluna of ['frequencia_pct', 'nota_portugues', 'nota_matematica', 'nota_ciencias', 'faltas_consecutivas']) {
      const valor = lerNumero(celula(linha, mapa, coluna));
      if (valor === null) {
        problemas.push({ linha: numeroDaLinha, coluna, motivo: `Valor de ${coluna} vazio ou não numérico.` });
        continue;
      }
      const faixa = FAIXAS[coluna]!;
      if (valor < faixa.min || valor > faixa.max) {
        problemas.push({
          linha: numeroDaLinha,
          coluna,
          motivo: `Valor de ${coluna} fora da faixa: esperado entre ${faixa.min} e ${faixa.max}, veio ${valor}.`,
        });
        continue;
      }
      numericos[coluna] = valor;
    }

    if (problemas.length > 0) {
      erros.push(...problemas);
      return;
    }

    const notaPortugues = numericos['nota_portugues']!;
    const notaMatematica = numericos['nota_matematica']!;
    const notaCiencias = numericos['nota_ciencias']!;
    const idadeBruta = lerNumero(celula(linha, mapa, 'idade'));
    const periodo = celula(linha, mapa, 'periodo');

    alunos.push({
      nome,
      turma,
      turno: celula(linha, mapa, 'turno') || undefined,
      idade: idadeBruta ?? undefined,
      frequenciaPct: numericos['frequencia_pct']!,
      notaPortugues,
      notaMatematica,
      notaCiencias,
      faltasConsecutivas: numericos['faltas_consecutivas']!,
      possuiDeficiencia: celula(linha, mapa, 'possui_deficiencia').toLowerCase() === 'sim',
      apoioRecomendado: celula(linha, mapa, 'apoio_recomendado') || undefined,
      observacao: celula(linha, mapa, 'observacao') || undefined,
      periodo: periodo || undefined,
      mediaNotas: (notaPortugues + notaMatematica + notaCiencias) / 3,
    });
  });

  return { alunos, erros, totalLinhas: linhasDeDado.length };
}
```

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `npx vitest run tests/parser/parseAlunos.test.ts`
Expected: PASS, 9 testes. O último confirma leitura limpa dos 100 alunos do dataset da AE I.

- [ ] **Step 9: Commit**

```bash
git add src/parser/ tests/parser/
git commit -m "feat(parser): validacao de schema com erro por linha"
```

---

## Task 5: Configuração de limiares

**Files:**
- Create: `src/config/limiares.ts`, `src/config/persistencia.ts`, `tests/config/limiares.test.ts`, `tests/config/persistencia.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `interface Limiares { frequenciaMinima: number; faltasConsecutivas: number; notaMinima: number }`
  - `const LIMIARES_PADRAO: Limiares`
  - `function validarLimiares(parcial: unknown): Limiares` — completa com padrão o que estiver inválido
  - `function carregarLimiares(): Limiares` e `function salvarLimiares(l: Limiares): void` (`persistencia.ts`)
  - Usado pelas Tasks 7, 8, 11, 14

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/config/limiares.test.ts
import { describe, it, expect } from 'vitest';
import { LIMIARES_PADRAO, validarLimiares } from '../../src/config/limiares';

describe('LIMIARES_PADRAO', () => {
  it('reproduz exatamente os limiares da AE I', () => {
    expect(LIMIARES_PADRAO).toEqual({
      frequenciaMinima: 75,
      faltasConsecutivas: 3,
      notaMinima: 5,
    });
  });
});

describe('validarLimiares', () => {
  it('aceita valores validos', () => {
    expect(validarLimiares({ frequenciaMinima: 80, faltasConsecutivas: 5, notaMinima: 6 })).toEqual({
      frequenciaMinima: 80,
      faltasConsecutivas: 5,
      notaMinima: 6,
    });
  });

  it('substitui campo fora de faixa pelo padrao', () => {
    const r = validarLimiares({ frequenciaMinima: 150, faltasConsecutivas: 5, notaMinima: 6 });
    expect(r.frequenciaMinima).toBe(75);
    expect(r.faltasConsecutivas).toBe(5);
  });

  it('devolve o padrao para entrada nao-objeto', () => {
    expect(validarLimiares(null)).toEqual(LIMIARES_PADRAO);
    expect(validarLimiares('texto')).toEqual(LIMIARES_PADRAO);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/config/limiares.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/config/limiares.ts`**

```ts
export interface Limiares {
  /** Frequência abaixo deste valor conta como risco. Padrão 75. */
  frequenciaMinima: number;
  /** Faltas consecutivas iguais ou acima deste valor contam como risco. Padrão 3. */
  faltasConsecutivas: number;
  /** Média abaixo deste valor conta como risco. Padrão 5. */
  notaMinima: number;
}

export const LIMIARES_PADRAO: Limiares = {
  frequenciaMinima: 75,
  faltasConsecutivas: 3,
  notaMinima: 5,
};

const FAIXAS: Record<keyof Limiares, { min: number; max: number }> = {
  frequenciaMinima: { min: 0, max: 100 },
  faltasConsecutivas: { min: 1, max: 60 },
  notaMinima: { min: 0, max: 10 },
};

export function validarLimiares(parcial: unknown): Limiares {
  if (typeof parcial !== 'object' || parcial === null) return { ...LIMIARES_PADRAO };

  const bruto = parcial as Record<string, unknown>;
  const resultado = { ...LIMIARES_PADRAO };

  for (const chave of Object.keys(LIMIARES_PADRAO) as (keyof Limiares)[]) {
    const valor = bruto[chave];
    const faixa = FAIXAS[chave];
    if (typeof valor === 'number' && Number.isFinite(valor) && valor >= faixa.min && valor <= faixa.max) {
      resultado[chave] = valor;
    }
  }

  return resultado;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/config/limiares.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 5: Escrever o teste de persistência que falha**

```ts
// tests/config/persistencia.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { carregarLimiares, salvarLimiares, CHAVE_ARMAZENAMENTO } from '../../src/config/persistencia';
import { LIMIARES_PADRAO } from '../../src/config/limiares';

describe('persistencia de limiares', () => {
  beforeEach(() => localStorage.clear());

  it('devolve o padrao quando nao ha nada gravado', () => {
    expect(carregarLimiares()).toEqual(LIMIARES_PADRAO);
  });

  it('grava e le de volta', () => {
    salvarLimiares({ frequenciaMinima: 80, faltasConsecutivas: 4, notaMinima: 6 });
    expect(carregarLimiares()).toEqual({ frequenciaMinima: 80, faltasConsecutivas: 4, notaMinima: 6 });
  });

  it('devolve o padrao quando o conteudo gravado esta corrompido', () => {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, 'isto nao e json');
    expect(carregarLimiares()).toEqual(LIMIARES_PADRAO);
  });
});
```

- [ ] **Step 6: Rodar e confirmar falha**

Run: `npx vitest run tests/config/persistencia.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 7: Implementar `src/config/persistencia.ts`**

```ts
import { LIMIARES_PADRAO, validarLimiares, type Limiares } from './limiares';

export const CHAVE_ARMAZENAMENTO = 'painel-eja:limiares';

export function carregarLimiares(): Limiares {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (bruto === null) return { ...LIMIARES_PADRAO };
    return validarLimiares(JSON.parse(bruto));
  } catch {
    return { ...LIMIARES_PADRAO };
  }
}

export function salvarLimiares(limiares: Limiares): void {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(limiares));
  } catch {
    // Navegador com armazenamento bloqueado: o painel segue funcionando
    // com os limiares em memória. Não é motivo para interromper o uso.
  }
}
```

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `npx vitest run tests/config/persistencia.test.ts`
Expected: PASS, 3 testes.

- [ ] **Step 9: Commit**

```bash
git add src/config/ tests/config/
git commit -m "feat(config): limiares configuraveis com persistencia local"
```

---

## Task 6: Agregações por turma, verificadas contra o oráculo

**Files:**
- Create: `src/kpi/agregacoes.ts`, `tests/kpi/agregacoes.test.ts`

**Interfaces:**
- Consumes: `Aluno` (Task 3), `oraculo/esperado.json` (Task 2)
- Produces:
  - `interface MediaTurma { turma: string; valor: number; alunos: number }`
  - `function frequenciaPorTurma(alunos: Aluno[]): MediaTurma[]` — ordenado por nome de turma
  - `function desempenhoPorTurma(alunos: Aluno[]): MediaTurma[]`
  - Usado pelas Tasks 11 e 12

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/kpi/agregacoes.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { frequenciaPorTurma, desempenhoPorTurma } from '../../src/kpi/agregacoes';
import { parseAlunos } from '../../src/parser';
import type { Aluno } from '../../src/types';

const esperado = JSON.parse(readFileSync('oraculo/esperado.json', 'utf-8'));
const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));

function aluno(parcial: Partial<Aluno>): Aluno {
  return {
    nome: 'X',
    turma: 'T',
    frequenciaPct: 90,
    notaPortugues: 7,
    notaMatematica: 7,
    notaCiencias: 7,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    mediaNotas: 7,
    ...parcial,
  };
}

describe('frequenciaPorTurma', () => {
  it('devolve lista vazia para entrada vazia', () => {
    expect(frequenciaPorTurma([])).toEqual([]);
  });

  it('agrupa por turma, faz a media e conta os alunos', () => {
    const r = frequenciaPorTurma([
      aluno({ turma: 'B', frequenciaPct: 80 }),
      aluno({ turma: 'A', frequenciaPct: 60 }),
      aluno({ turma: 'A', frequenciaPct: 100 }),
    ]);
    expect(r).toEqual([
      { turma: 'A', valor: 80, alunos: 2 },
      { turma: 'B', valor: 80, alunos: 1 },
    ]);
  });

  it('bate com o oraculo da AE I no dataset simulado', () => {
    const r = frequenciaPorTurma(alunos);
    expect(r).toHaveLength(esperado.frequencia_por_turma.length);
    r.forEach((item, i) => {
      expect(item.turma).toBe(esperado.frequencia_por_turma[i].turma);
      expect(item.alunos).toBe(esperado.frequencia_por_turma[i].alunos);
      expect(item.valor).toBeCloseTo(esperado.frequencia_por_turma[i].valor, 9);
    });
  });
});

describe('desempenhoPorTurma', () => {
  it('bate com o oraculo da AE I no dataset simulado', () => {
    const r = desempenhoPorTurma(alunos);
    r.forEach((item, i) => {
      expect(item.turma).toBe(esperado.desempenho_por_turma[i].turma);
      expect(item.valor).toBeCloseTo(esperado.desempenho_por_turma[i].valor, 9);
    });
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/kpi/agregacoes.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/kpi/agregacoes.ts`**

```ts
import type { Aluno } from '../types';

export interface MediaTurma {
  turma: string;
  valor: number;
  alunos: number;
}

function mediaPorTurma(alunos: Aluno[], extrair: (a: Aluno) => number): MediaTurma[] {
  const acumulado = new Map<string, { soma: number; contagem: number }>();

  for (const aluno of alunos) {
    const atual = acumulado.get(aluno.turma) ?? { soma: 0, contagem: 0 };
    atual.soma += extrair(aluno);
    atual.contagem += 1;
    acumulado.set(aluno.turma, atual);
  }

  return [...acumulado.entries()]
    .map(([turma, { soma, contagem }]) => ({ turma, valor: soma / contagem, alunos: contagem }))
    .sort((a, b) => a.turma.localeCompare(b.turma, 'pt-BR'));
}

export function frequenciaPorTurma(alunos: Aluno[]): MediaTurma[] {
  return mediaPorTurma(alunos, (a) => a.frequenciaPct);
}

export function desempenhoPorTurma(alunos: Aluno[]): MediaTurma[] {
  return mediaPorTurma(alunos, (a) => a.mediaNotas);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/kpi/agregacoes.test.ts`
Expected: PASS, 4 testes — incluindo os dois que conferem contra o oráculo.

- [ ] **Step 5: Commit**

```bash
git add src/kpi/agregacoes.ts tests/kpi/agregacoes.test.ts
git commit -m "feat(kpi): medias por turma verificadas contra o oraculo da AE I"
```

---

## Task 7: Risco de evasão e lista de alerta

**Files:**
- Create: `src/kpi/risco.ts`, `tests/kpi/risco.test.ts`

**Interfaces:**
- Consumes: `Aluno`, `Limiares` (Task 5), oráculo (Task 2)
- Produces:
  - `type MotivoAlerta = 'freq. baixa' | 'faltas seguidas' | 'notas baixas'`
  - `function motivosAlerta(aluno: Aluno, limiares: Limiares): MotivoAlerta[]`
  - `interface AlunoEmAlerta { aluno: Aluno; motivos: MotivoAlerta[] }`
  - `function alunosEmAlerta(alunos: Aluno[], limiares: Limiares): AlunoEmAlerta[]` — ordenado por criticidade
  - `function taxaRiscoEvasao(alunos: Aluno[], limiares: Limiares): number` — percentual 0–100
  - Usado pelas Tasks 8, 9, 11, 13

A string de motivo é idêntica à do protótipo da AE I, para permitir comparação direta com o oráculo.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/kpi/risco.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { motivosAlerta, alunosEmAlerta, taxaRiscoEvasao } from '../../src/kpi/risco';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import { parseAlunos } from '../../src/parser';
import type { Aluno } from '../../src/types';

const esperado = JSON.parse(readFileSync('oraculo/esperado.json', 'utf-8'));
const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));

function aluno(parcial: Partial<Aluno>): Aluno {
  const base = {
    nome: 'X',
    turma: 'T',
    frequenciaPct: 90,
    notaPortugues: 7,
    notaMatematica: 7,
    notaCiencias: 7,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    ...parcial,
  };
  return { ...base, mediaNotas: (base.notaPortugues + base.notaMatematica + base.notaCiencias) / 3 };
}

describe('motivosAlerta — fronteiras herdadas da AE I', () => {
  it('frequencia exatamente 75,0 NAO e risco', () => {
    expect(motivosAlerta(aluno({ frequenciaPct: 75 }), LIMIARES_PADRAO)).toEqual([]);
  });

  it('frequencia 74,9 e risco', () => {
    expect(motivosAlerta(aluno({ frequenciaPct: 74.9 }), LIMIARES_PADRAO)).toEqual(['freq. baixa']);
  });

  it('exatamente 3 faltas consecutivas E risco', () => {
    expect(motivosAlerta(aluno({ faltasConsecutivas: 3 }), LIMIARES_PADRAO)).toEqual(['faltas seguidas']);
  });

  it('2 faltas consecutivas nao e risco', () => {
    expect(motivosAlerta(aluno({ faltasConsecutivas: 2 }), LIMIARES_PADRAO)).toEqual([]);
  });

  it('media exatamente 5,0 NAO e risco', () => {
    expect(motivosAlerta(aluno({ notaPortugues: 5, notaMatematica: 5, notaCiencias: 5 }), LIMIARES_PADRAO)).toEqual([]);
  });

  it('media 4,9 e risco', () => {
    expect(motivosAlerta(aluno({ notaPortugues: 4.9, notaMatematica: 4.9, notaCiencias: 4.9 }), LIMIARES_PADRAO)).toEqual([
      'notas baixas',
    ]);
  });

  it('acumula motivos na ordem frequencia, faltas, notas', () => {
    const r = motivosAlerta(
      aluno({ frequenciaPct: 50, faltasConsecutivas: 9, notaPortugues: 1, notaMatematica: 1, notaCiencias: 1 }),
      LIMIARES_PADRAO,
    );
    expect(r).toEqual(['freq. baixa', 'faltas seguidas', 'notas baixas']);
  });

  it('respeita limiar customizado', () => {
    expect(motivosAlerta(aluno({ frequenciaPct: 85 }), { ...LIMIARES_PADRAO, frequenciaMinima: 90 })).toEqual([
      'freq. baixa',
    ]);
  });
});

describe('alunosEmAlerta', () => {
  it('ordena por quantidade de motivos e, no empate, por frequencia crescente', () => {
    const r = alunosEmAlerta(
      [
        aluno({ nome: 'UmMotivo', frequenciaPct: 70 }),
        aluno({ nome: 'TresMotivos', frequenciaPct: 40, faltasConsecutivas: 5, notaPortugues: 2, notaMatematica: 2, notaCiencias: 2 }),
        aluno({ nome: 'UmMotivoPior', frequenciaPct: 50 }),
        aluno({ nome: 'SemAlerta' }),
      ],
      LIMIARES_PADRAO,
    );
    expect(r.map((x) => x.aluno.nome)).toEqual(['TresMotivos', 'UmMotivoPior', 'UmMotivo']);
  });

  it('bate com o oraculo: mesmo conjunto de nomes e mesmos motivos', () => {
    const r = alunosEmAlerta(alunos, LIMIARES_PADRAO);
    expect(r).toHaveLength(esperado.total_em_alerta);

    const meu = r.map((x) => ({ nome: x.aluno.nome, motivos: x.motivos })).sort((a, b) => a.nome.localeCompare(b.nome));
    const dele = esperado.alunos_em_alerta.map((x: { nome: string; motivos: string[] }) => ({
      nome: x.nome,
      motivos: x.motivos,
    }));
    expect(meu).toEqual(dele);
  });
});

describe('taxaRiscoEvasao', () => {
  it('devolve 0 para lista vazia', () => {
    expect(taxaRiscoEvasao([], LIMIARES_PADRAO)).toBe(0);
  });

  it('bate com o oraculo', () => {
    expect(taxaRiscoEvasao(alunos, LIMIARES_PADRAO)).toBeCloseTo(esperado.taxa_risco_evasao, 9);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/kpi/risco.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/kpi/risco.ts`**

```ts
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/kpi/risco.test.ts`
Expected: PASS, 12 testes.

- [ ] **Step 5: Commit**

```bash
git add src/kpi/risco.ts tests/kpi/risco.test.ts
git commit -m "feat(kpi): risco de evasao com fronteiras da AE I congeladas em teste"
```

---

## Task 8: Defasagem frequência × desempenho e cobertura AEE

**Files:**
- Create: `src/kpi/defasagem.ts`, `src/kpi/aee.ts`, `tests/kpi/defasagem.test.ts`, `tests/kpi/aee.test.ts`

**Interfaces:**
- Consumes: `Aluno`, `Limiares`, `motivosAlerta` (Task 7), oráculo (Task 2)
- Produces:
  - `type Quadrante = 'regular' | 'intervencao-didatica' | 'acao-permanencia' | 'critico'`
  - `const ROTULO_QUADRANTE: Record<Quadrante, string>` — texto legível de cada quadrante, consumido pela Task 13
  - `function quadranteDefasagem(aluno: Aluno, limiares: Limiares): Quadrante`
  - `function distribuicaoDefasagem(alunos: Aluno[], limiares: Limiares): Record<Quadrante, number>`
  - `interface CoberturaAee { totalComDeficiencia: number; comDeficienciaEmAlerta: number; percentualDoTotal: number }`
  - `function coberturaAee(alunos: Aluno[], limiares: Limiares): CoberturaAee`
  - Usado pelas Tasks 11 e 13

A leitura dos quadrantes, conforme a AE I: aluno presente com desempenho baixo pede intervenção didática; aluno ausente com desempenho razoável pede ação de permanência.

- [ ] **Step 1: Escrever o teste de defasagem que falha**

```ts
// tests/kpi/defasagem.test.ts
import { describe, it, expect } from 'vitest';
import { quadranteDefasagem, distribuicaoDefasagem } from '../../src/kpi/defasagem';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import type { Aluno } from '../../src/types';

function aluno(frequenciaPct: number, nota: number): Aluno {
  return {
    nome: 'X',
    turma: 'T',
    frequenciaPct,
    notaPortugues: nota,
    notaMatematica: nota,
    notaCiencias: nota,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    mediaNotas: nota,
  };
}

describe('quadranteDefasagem', () => {
  it('presente e indo bem e regular', () => {
    expect(quadranteDefasagem(aluno(90, 8), LIMIARES_PADRAO)).toBe('regular');
  });

  it('presente com desempenho baixo pede intervencao didatica', () => {
    expect(quadranteDefasagem(aluno(90, 3), LIMIARES_PADRAO)).toBe('intervencao-didatica');
  });

  it('ausente com desempenho razoavel pede acao de permanencia', () => {
    expect(quadranteDefasagem(aluno(50, 8), LIMIARES_PADRAO)).toBe('acao-permanencia');
  });

  it('ausente e com desempenho baixo e critico', () => {
    expect(quadranteDefasagem(aluno(50, 3), LIMIARES_PADRAO)).toBe('critico');
  });

  it('usa as mesmas fronteiras do risco: 75,0 e presente, 5,0 e razoavel', () => {
    expect(quadranteDefasagem(aluno(75, 5), LIMIARES_PADRAO)).toBe('regular');
  });
});

describe('distribuicaoDefasagem', () => {
  it('conta os quatro quadrantes e zera os ausentes', () => {
    const r = distribuicaoDefasagem([aluno(90, 8), aluno(90, 3), aluno(90, 3)], LIMIARES_PADRAO);
    expect(r).toEqual({ regular: 1, 'intervencao-didatica': 2, 'acao-permanencia': 0, critico: 0 });
  });

  it('devolve tudo zerado para lista vazia', () => {
    expect(distribuicaoDefasagem([], LIMIARES_PADRAO)).toEqual({
      regular: 0,
      'intervencao-didatica': 0,
      'acao-permanencia': 0,
      critico: 0,
    });
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/kpi/defasagem.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/kpi/defasagem.ts`**

```ts
import type { Limiares } from '../config/limiares';
import type { Aluno } from '../types';

export type Quadrante = 'regular' | 'intervencao-didatica' | 'acao-permanencia' | 'critico';

export const ROTULO_QUADRANTE: Record<Quadrante, string> = {
  regular: 'Frequente e com desempenho adequado',
  'intervencao-didatica': 'Frequente, mas com desempenho baixo — intervenção didática',
  'acao-permanencia': 'Desempenho adequado, mas ausente — ação de permanência',
  critico: 'Ausente e com desempenho baixo — atenção prioritária',
};

export function quadranteDefasagem(aluno: Aluno, limiares: Limiares): Quadrante {
  const presente = aluno.frequenciaPct >= limiares.frequenciaMinima;
  const desempenhoOk = aluno.mediaNotas >= limiares.notaMinima;

  if (presente && desempenhoOk) return 'regular';
  if (presente && !desempenhoOk) return 'intervencao-didatica';
  if (!presente && desempenhoOk) return 'acao-permanencia';
  return 'critico';
}

export function distribuicaoDefasagem(alunos: Aluno[], limiares: Limiares): Record<Quadrante, number> {
  const contagem: Record<Quadrante, number> = {
    regular: 0,
    'intervencao-didatica': 0,
    'acao-permanencia': 0,
    critico: 0,
  };
  for (const aluno of alunos) contagem[quadranteDefasagem(aluno, limiares)] += 1;
  return contagem;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/kpi/defasagem.test.ts`
Expected: PASS, 7 testes.

- [ ] **Step 5: Escrever o teste de AEE que falha**

```ts
// tests/kpi/aee.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { coberturaAee } from '../../src/kpi/aee';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import { parseAlunos } from '../../src/parser';

const esperado = JSON.parse(readFileSync('oraculo/esperado.json', 'utf-8'));
const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));

describe('coberturaAee', () => {
  it('devolve zeros para lista vazia sem dividir por zero', () => {
    expect(coberturaAee([], LIMIARES_PADRAO)).toEqual({
      totalComDeficiencia: 0,
      comDeficienciaEmAlerta: 0,
      percentualDoTotal: 0,
    });
  });

  it('bate com o oraculo da AE I', () => {
    const r = coberturaAee(alunos, LIMIARES_PADRAO);
    expect(r.totalComDeficiencia).toBe(esperado.cobertura_aee.total_com_deficiencia);
    expect(r.comDeficienciaEmAlerta).toBe(esperado.cobertura_aee.com_deficiencia_em_alerta);
  });
});
```

- [ ] **Step 6: Rodar e confirmar falha**

Run: `npx vitest run tests/kpi/aee.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 7: Implementar `src/kpi/aee.ts`**

```ts
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
```

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `npx vitest run tests/kpi/aee.test.ts`
Expected: PASS, 2 testes.

- [ ] **Step 9: Commit**

```bash
git add src/kpi/defasagem.ts src/kpi/aee.ts tests/kpi/defasagem.test.ts tests/kpi/aee.test.ts
git commit -m "feat(kpi): defasagem frequencia x desempenho e cobertura AEE"
```

---

## Task 9: Desempenho por componente curricular (indicador novo)

**Files:**
- Create: `src/kpi/componente.ts`, `tests/kpi/componente.test.ts`

**Interfaces:**
- Consumes: `Aluno`
- Produces:
  - `type Componente = 'Português' | 'Matemática' | 'Ciências'`
  - `const COMPONENTES: Componente[]`
  - `interface MediaComponente { turma: string; componente: Componente; media: number }`
  - `function desempenhoPorComponente(alunos: Aluno[]): MediaComponente[]` — ordenado por turma e depois pela ordem de `COMPONENTES`
  - `function componenteMaisCritico(medias: MediaComponente[]): MediaComponente | null`
  - Usado pelas Tasks 11 e 13

Este é o primeiro dos dois indicadores que a AE I especificou mas não implementou. O dado já existe no schema.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/kpi/componente.test.ts
import { describe, it, expect } from 'vitest';
import { desempenhoPorComponente, componenteMaisCritico, COMPONENTES } from '../../src/kpi/componente';
import type { Aluno } from '../../src/types';

function aluno(turma: string, p: number, m: number, c: number): Aluno {
  return {
    nome: 'X',
    turma,
    frequenciaPct: 90,
    notaPortugues: p,
    notaMatematica: m,
    notaCiencias: c,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    mediaNotas: (p + m + c) / 3,
  };
}

describe('COMPONENTES', () => {
  it('sao os tres componentes fixos herdados da AE I', () => {
    expect(COMPONENTES).toEqual(['Português', 'Matemática', 'Ciências']);
  });
});

describe('desempenhoPorComponente', () => {
  it('devolve lista vazia para entrada vazia', () => {
    expect(desempenhoPorComponente([])).toEqual([]);
  });

  it('produz uma linha por turma e componente, na ordem definida', () => {
    const r = desempenhoPorComponente([aluno('A', 8, 4, 6), aluno('A', 6, 2, 6)]);
    expect(r).toEqual([
      { turma: 'A', componente: 'Português', media: 7 },
      { turma: 'A', componente: 'Matemática', media: 3 },
      { turma: 'A', componente: 'Ciências', media: 6 },
    ]);
  });

  it('ordena as turmas alfabeticamente', () => {
    const r = desempenhoPorComponente([aluno('B', 5, 5, 5), aluno('A', 5, 5, 5)]);
    expect(r.map((x) => x.turma)).toEqual(['A', 'A', 'A', 'B', 'B', 'B']);
  });
});

describe('componenteMaisCritico', () => {
  it('devolve null para lista vazia', () => {
    expect(componenteMaisCritico([])).toBeNull();
  });

  it('aponta a menor media — a dificuldade concentrada', () => {
    const r = componenteMaisCritico(desempenhoPorComponente([aluno('A', 8, 4, 6)]));
    expect(r).toEqual({ turma: 'A', componente: 'Matemática', media: 4 });
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/kpi/componente.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/kpi/componente.ts`**

```ts
import type { Aluno } from '../types';

export type Componente = 'Português' | 'Matemática' | 'Ciências';

export const COMPONENTES: Componente[] = ['Português', 'Matemática', 'Ciências'];

const EXTRATOR: Record<Componente, (a: Aluno) => number> = {
  'Português': (a) => a.notaPortugues,
  'Matemática': (a) => a.notaMatematica,
  'Ciências': (a) => a.notaCiencias,
};

export interface MediaComponente {
  turma: string;
  componente: Componente;
  media: number;
}

/**
 * Indicador especificado na AE I e implementado nesta etapa. Responde se a
 * dificuldade é individual ou está concentrada em um componente.
 */
export function desempenhoPorComponente(alunos: Aluno[]): MediaComponente[] {
  const turmas = [...new Set(alunos.map((a) => a.turma))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const resultado: MediaComponente[] = [];

  for (const turma of turmas) {
    const daTurma = alunos.filter((a) => a.turma === turma);
    for (const componente of COMPONENTES) {
      const soma = daTurma.reduce((total, a) => total + EXTRATOR[componente](a), 0);
      resultado.push({ turma, componente, media: soma / daTurma.length });
    }
  }

  return resultado;
}

export function componenteMaisCritico(medias: MediaComponente[]): MediaComponente | null {
  if (medias.length === 0) return null;
  return medias.reduce((pior, atual) => (atual.media < pior.media ? atual : pior));
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/kpi/componente.test.ts`
Expected: PASS, 6 testes.

- [ ] **Step 5: Commit**

```bash
git add src/kpi/componente.ts tests/kpi/componente.test.ts
git commit -m "feat(kpi): desempenho por componente curricular — pendencia da AE I"
```

---

## Task 10: Queda de frequência em janela móvel (indicador novo)

**Files:**
- Create: `src/kpi/janela.ts`, `tests/kpi/janela.test.ts`

**Interfaces:**
- Consumes: `Aluno` (campo opcional `periodo`)
- Produces:
  - `interface QuedaFrequencia { nome: string; turma: string; periodoAnterior: string; periodoAtual: string; variacaoPp: number }`
  - `type ResultadoJanela = { disponivel: true; quedas: QuedaFrequencia[] } | { disponivel: false; motivo: string }`
  - `function quedaFrequenciaJanelaMovel(alunos: Aluno[]): ResultadoJanela`
  - Usado pelas Tasks 11 e 13

Segundo indicador pendente da AE I. Depende da coluna opcional `periodo`. Quando ela não existe, o resultado é indisponível **com motivo legível** — o card aparece na tela explicando o que a escola precisaria registrar, em vez de sumir.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/kpi/janela.test.ts
import { describe, it, expect } from 'vitest';
import { quedaFrequenciaJanelaMovel } from '../../src/kpi/janela';
import type { Aluno } from '../../src/types';

function aluno(nome: string, periodo: string | undefined, frequenciaPct: number): Aluno {
  return {
    nome,
    turma: 'A',
    periodo,
    frequenciaPct,
    notaPortugues: 7,
    notaMatematica: 7,
    notaCiencias: 7,
    faltasConsecutivas: 0,
    possuiDeficiencia: false,
    mediaNotas: 7,
  };
}

describe('quedaFrequenciaJanelaMovel', () => {
  it('fica indisponivel, com motivo, quando nao ha coluna periodo', () => {
    const r = quedaFrequenciaJanelaMovel([aluno('Ana', undefined, 90)]);
    expect(r.disponivel).toBe(false);
    if (!r.disponivel) expect(r.motivo).toContain('2 ou mais períodos');
  });

  it('fica indisponivel quando ha um unico periodo', () => {
    const r = quedaFrequenciaJanelaMovel([aluno('Ana', '1', 90), aluno('Bruno', '1', 80)]);
    expect(r.disponivel).toBe(false);
  });

  it('calcula a variacao entre os dois periodos mais recentes', () => {
    const r = quedaFrequenciaJanelaMovel([aluno('Ana', '1', 90), aluno('Ana', '2', 70)]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) {
      expect(r.quedas).toEqual([
        { nome: 'Ana', turma: 'A', periodoAnterior: '1', periodoAtual: '2', variacaoPp: -20 },
      ]);
    }
  });

  it('lista apenas quedas, ignorando quem melhorou ou ficou igual', () => {
    const r = quedaFrequenciaJanelaMovel([
      aluno('Sobe', '1', 60),
      aluno('Sobe', '2', 90),
      aluno('Igual', '1', 80),
      aluno('Igual', '2', 80),
      aluno('Cai', '1', 95),
      aluno('Cai', '2', 60),
    ]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) expect(r.quedas.map((q) => q.nome)).toEqual(['Cai']);
  });

  it('ordena da maior queda para a menor', () => {
    const r = quedaFrequenciaJanelaMovel([
      aluno('QuedaLeve', '1', 90),
      aluno('QuedaLeve', '2', 85),
      aluno('QuedaForte', '1', 90),
      aluno('QuedaForte', '2', 40),
    ]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) expect(r.quedas.map((q) => q.nome)).toEqual(['QuedaForte', 'QuedaLeve']);
  });

  it('usa os dois periodos mais recentes quando ha tres', () => {
    const r = quedaFrequenciaJanelaMovel([
      aluno('Ana', '1', 10),
      aluno('Ana', '2', 90),
      aluno('Ana', '3', 80),
    ]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) {
      expect(r.quedas[0]!.periodoAnterior).toBe('2');
      expect(r.quedas[0]!.periodoAtual).toBe('3');
      expect(r.quedas[0]!.variacaoPp).toBe(-10);
    }
  });

  it('ignora aluno presente em so um dos dois periodos', () => {
    const r = quedaFrequenciaJanelaMovel([
      aluno('Ana', '1', 90),
      aluno('Ana', '2', 60),
      aluno('NovoAluno', '2', 30),
    ]);
    expect(r.disponivel).toBe(true);
    if (r.disponivel) expect(r.quedas.map((q) => q.nome)).toEqual(['Ana']);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/kpi/janela.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/kpi/janela.ts`**

```ts
import type { Aluno } from '../types';

export interface QuedaFrequencia {
  nome: string;
  turma: string;
  periodoAnterior: string;
  periodoAtual: string;
  /** Negativo. Diferença em pontos percentuais. */
  variacaoPp: number;
}

export type ResultadoJanela =
  | { disponivel: true; quedas: QuedaFrequencia[] }
  | { disponivel: false; motivo: string };

const MOTIVO_INDISPONIVEL =
  'Requer histórico de 2 ou mais períodos. Inclua a coluna "periodo" no arquivo, com uma linha por aluno em cada bimestre.';

/**
 * Compara a frequência de cada aluno entre os dois períodos mais recentes.
 * Segundo indicador pendente da AE I.
 */
export function quedaFrequenciaJanelaMovel(alunos: Aluno[]): ResultadoJanela {
  const periodos = [...new Set(alunos.map((a) => a.periodo).filter((p): p is string => !!p))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { numeric: true }),
  );

  if (periodos.length < 2) return { disponivel: false, motivo: MOTIVO_INDISPONIVEL };

  const periodoAnterior = periodos[periodos.length - 2]!;
  const periodoAtual = periodos[periodos.length - 1]!;

  const anterior = new Map(alunos.filter((a) => a.periodo === periodoAnterior).map((a) => [a.nome, a]));
  const quedas: QuedaFrequencia[] = [];

  for (const atual of alunos.filter((a) => a.periodo === periodoAtual)) {
    const antes = anterior.get(atual.nome);
    if (!antes) continue;

    const variacaoPp = atual.frequenciaPct - antes.frequenciaPct;
    if (variacaoPp < 0) {
      quedas.push({ nome: atual.nome, turma: atual.turma, periodoAnterior, periodoAtual, variacaoPp });
    }
  }

  quedas.sort((a, b) => a.variacaoPp - b.variacaoPp);
  return { disponivel: true, quedas };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/kpi/janela.test.ts`
Expected: PASS, 7 testes.

- [ ] **Step 5: Commit**

```bash
git add src/kpi/janela.ts tests/kpi/janela.test.ts
git commit -m "feat(kpi): queda de frequencia em janela movel — pendencia da AE I"
```

---

## Task 11: Agregador de indicadores

**Files:**
- Create: `src/kpi/index.ts`, `tests/kpi/index.test.ts`

**Interfaces:**
- Consumes: tudo de `src/kpi/*` (Tasks 6–10), `Limiares` (Task 5)
- Produces:
  - `interface Indicadores` com os campos `totalAlunos`, `frequenciaPorTurma`, `desempenhoPorTurma`, `desempenhoPorComponente`, `componenteMaisCritico`, `alunosEmAlerta`, `taxaRiscoEvasao`, `distribuicaoDefasagem`, `coberturaAee`, `quedaFrequencia`
  - `function calcularIndicadores(alunos: Aluno[], limiares: Limiares): Indicadores`
  - Consumido pelas Tasks 13 e 15

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/kpi/index.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { calcularIndicadores } from '../../src/kpi';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import { parseAlunos } from '../../src/parser';

const esperado = JSON.parse(readFileSync('oraculo/esperado.json', 'utf-8'));
const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));

describe('calcularIndicadores', () => {
  it('produz os sete indicadores sobre o dataset simulado', () => {
    const r = calcularIndicadores(alunos, LIMIARES_PADRAO);

    expect(r.totalAlunos).toBe(esperado.total_alunos);
    expect(r.frequenciaPorTurma).toHaveLength(4);
    expect(r.desempenhoPorTurma).toHaveLength(4);
    expect(r.desempenhoPorComponente).toHaveLength(12);
    expect(r.componenteMaisCritico).not.toBeNull();
    expect(r.alunosEmAlerta).toHaveLength(esperado.total_em_alerta);
    expect(r.taxaRiscoEvasao).toBeCloseTo(esperado.taxa_risco_evasao, 9);
    expect(r.coberturaAee.totalComDeficiencia).toBe(esperado.cobertura_aee.total_com_deficiencia);
  });

  it('marca a janela movel como indisponivel — o dataset da AE I nao tem periodo', () => {
    const r = calcularIndicadores(alunos, LIMIARES_PADRAO);
    expect(r.quedaFrequencia.disponivel).toBe(false);
  });

  it('nao lanca excecao para lista vazia', () => {
    const r = calcularIndicadores([], LIMIARES_PADRAO);
    expect(r.totalAlunos).toBe(0);
    expect(r.taxaRiscoEvasao).toBe(0);
    expect(r.alunosEmAlerta).toEqual([]);
    expect(r.componenteMaisCritico).toBeNull();
  });

  it('reage a mudanca de limiar — limiar mais rigoroso aumenta a taxa de risco', () => {
    const padrao = calcularIndicadores(alunos, LIMIARES_PADRAO);
    const rigoroso = calcularIndicadores(alunos, { ...LIMIARES_PADRAO, frequenciaMinima: 95 });
    expect(rigoroso.taxaRiscoEvasao).toBeGreaterThan(padrao.taxaRiscoEvasao);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/kpi/index.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/kpi/index.ts`**

```ts
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
```

- [ ] **Step 4: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS em todos os arquivos. Este é o marco em que os sete indicadores estão prontos e verificados.

- [ ] **Step 5: Commit**

```bash
git add src/kpi/index.ts tests/kpi/index.test.ts
git commit -m "feat(kpi): agregador dos sete indicadores"
```

---

## Task 12: Formatação e gráfico de barras em SVG

**Files:**
- Create: `src/render/formato.ts`, `src/render/barras.ts`, `tests/render/formato.test.ts`, `tests/render/barras.test.ts`

**Interfaces:**
- Consumes: `MediaTurma` (Task 6)
- Produces:
  - `function numero(valor: number, casas?: number): string` — pt-BR, vírgula decimal
  - `function percentual(valor: number, casas?: number): string`
  - `function escapar(texto: string): string` — escapa texto vindo do arquivo do usuário antes de entrar em markup; usado por `barras.ts`, `cards.ts`, `tabela.ts` e `erros.ts`
  - `interface OpcoesBarras { titulo: string; itens: { rotulo: string; valor: number }[]; maximo: number; limiar?: number; sufixo?: string }`
  - `function graficoBarras(opcoes: OpcoesBarras): string` — devolve markup SVG
  - Usado pela Task 13

Sem biblioteca de gráfico: o bundle precisa ser pequeno e funcionar offline, e barras horizontais com rótulo são simples o bastante para escrever à mão. A codificação nunca é só por cor — todo item traz rótulo textual com o valor.

- [ ] **Step 1: Escrever o teste de formatação que falha**

```ts
// tests/render/formato.test.ts
import { describe, it, expect } from 'vitest';
import { numero, percentual } from '../../src/render/formato';

describe('numero', () => {
  it('usa virgula decimal, padrao brasileiro', () => {
    expect(numero(82.55)).toBe('82,6');
  });

  it('aceita casas customizadas', () => {
    expect(numero(7, 2)).toBe('7,00');
  });
});

describe('percentual', () => {
  it('acrescenta o sinal de porcentagem', () => {
    expect(percentual(82.55)).toBe('82,6%');
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/render/formato.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/render/formato.ts`**

```ts
export function numero(valor: number, casas = 1): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function percentual(valor: number, casas = 1): string {
  return `${numero(valor, casas)}%`;
}

/** Escapa texto vindo do arquivo do usuário antes de entrar em markup. */
export function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/render/formato.test.ts`
Expected: PASS, 3 testes.

- [ ] **Step 5: Escrever o teste do gráfico que falha**

```ts
// tests/render/barras.test.ts
import { describe, it, expect } from 'vitest';
import { graficoBarras } from '../../src/render/barras';

describe('graficoBarras', () => {
  const base = {
    titulo: 'Frequência média por turma',
    itens: [
      { rotulo: '6º ano', valor: 82.5 },
      { rotulo: '7º ano', valor: 61.2 },
    ],
    maximo: 100,
    limiar: 75,
    sufixo: '%',
  };

  it('produz um svg com titulo acessivel', () => {
    const svg = graficoBarras(base);
    expect(svg).toContain('<svg');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('Frequência média por turma');
  });

  it('desenha uma barra por item', () => {
    const svg = graficoBarras(base);
    expect(svg.match(/<rect class="barra"/g)).toHaveLength(2);
  });

  it('mostra o valor como texto — nao codifica so por cor', () => {
    const svg = graficoBarras(base);
    expect(svg).toContain('82,5%');
    expect(svg).toContain('61,2%');
  });

  it('marca visualmente quem esta abaixo do limiar e diz isso no texto', () => {
    const svg = graficoBarras(base);
    expect(svg).toContain('abaixo do limiar');
  });

  it('desenha a linha de limiar quando informado', () => {
    expect(graficoBarras(base)).toContain('class="limiar"');
  });

  it('omite a linha de limiar quando nao informado', () => {
    const { limiar, ...semLimiar } = base;
    expect(graficoBarras(semLimiar)).not.toContain('class="limiar"');
  });

  it('escapa rotulo com caractere de markup', () => {
    const svg = graficoBarras({ ...base, itens: [{ rotulo: '<script>', valor: 10 }] });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('nao quebra com lista vazia', () => {
    expect(() => graficoBarras({ ...base, itens: [] })).not.toThrow();
  });
});
```

- [ ] **Step 6: Rodar e confirmar falha**

Run: `npx vitest run tests/render/barras.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 7: Implementar `src/render/barras.ts`**

```ts
import { escapar, numero } from './formato';

export interface ItemBarra {
  rotulo: string;
  valor: number;
}

export interface OpcoesBarras {
  titulo: string;
  itens: ItemBarra[];
  maximo: number;
  /** Quando informado, desenha a linha de referência e destaca quem está abaixo. */
  limiar?: number;
  sufixo?: string;
}

const LARGURA = 640;
const ALTURA_BARRA = 28;
const ESPACO = 14;
const MARGEM_ESQUERDA = 150;
const MARGEM_TOPO = 16;
const MARGEM_DIREITA = 90;

export function graficoBarras({ titulo, itens, maximo, limiar, sufixo = '' }: OpcoesBarras): string {
  const larguraUtil = LARGURA - MARGEM_ESQUERDA - MARGEM_DIREITA;
  const altura = MARGEM_TOPO * 2 + itens.length * (ALTURA_BARRA + ESPACO) + (limiar === undefined ? 0 : 18);

  const barras = itens
    .map((item, i) => {
      const y = MARGEM_TOPO + i * (ALTURA_BARRA + ESPACO);
      const largura = maximo === 0 ? 0 : Math.max(0, (item.valor / maximo) * larguraUtil);
      const abaixo = limiar !== undefined && item.valor < limiar;
      const classe = abaixo ? 'barra barra--alerta' : 'barra';
      const texto = `${numero(item.valor)}${sufixo}`;
      const sufixoAcessivel = abaixo ? ' — abaixo do limiar' : '';

      return `
    <text class="rotulo" x="${MARGEM_ESQUERDA - 10}" y="${y + ALTURA_BARRA / 2}" text-anchor="end" dominant-baseline="middle">${escapar(item.rotulo)}</text>
    <rect class="${classe}" x="${MARGEM_ESQUERDA}" y="${y}" width="${largura.toFixed(2)}" height="${ALTURA_BARRA}" rx="2" />
    <text class="valor" x="${MARGEM_ESQUERDA + largura + 8}" y="${y + ALTURA_BARRA / 2}" dominant-baseline="middle">${texto}${sufixoAcessivel}</text>`;
    })
    .join('');

  const linhaLimiar =
    limiar === undefined
      ? ''
      : (() => {
          const x = MARGEM_ESQUERDA + (limiar / maximo) * larguraUtil;
          return `
    <line class="limiar" x1="${x.toFixed(2)}" y1="${MARGEM_TOPO - 6}" x2="${x.toFixed(2)}" y2="${altura - 24}" />
    <text class="limiar-rotulo" x="${x.toFixed(2)}" y="${altura - 8}" text-anchor="middle">limiar ${numero(limiar)}${sufixo}</text>`;
        })();

  return `<figure class="grafico">
  <figcaption>${escapar(titulo)}</figcaption>
  <svg viewBox="0 0 ${LARGURA} ${altura}" role="img" aria-label="${escapar(titulo)}" preserveAspectRatio="xMinYMin meet">
    <title>${escapar(titulo)}</title>${barras}${linhaLimiar}
  </svg>
</figure>`;
}
```

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `npx vitest run tests/render/barras.test.ts`
Expected: PASS, 8 testes.

- [ ] **Step 9: Commit**

```bash
git add src/render/formato.ts src/render/barras.ts tests/render/
git commit -m "feat(render): grafico de barras em SVG sem biblioteca externa"
```

---

## Task 13: Cards, tabela de alerta e painel de erros

**Files:**
- Create: `src/render/cards.ts`, `src/render/tabela.ts`, `src/render/erros.ts`, `src/render/index.ts`, `tests/render/painel.test.ts`

**Interfaces:**
- Consumes: `Indicadores` (Task 11), `ErroLinha` (Task 3), `graficoBarras` (Task 12)
- Produces:
  - `function renderCards(ind: Indicadores): string`
  - `function renderTabelaAlerta(ind: Indicadores): string`
  - `function renderErros(erros: ErroLinha[], totalLinhas: number, validas: number): string`
  - `function renderPainel(ind: Indicadores, erros: ErroLinha[], totalLinhas: number): string` (`src/render/index.ts`)
  - Usado pela Task 15

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/render/painel.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderPainel } from '../../src/render';
import { calcularIndicadores } from '../../src/kpi';
import { LIMIARES_PADRAO } from '../../src/config/limiares';
import { parseAlunos } from '../../src/parser';

const { alunos } = parseAlunos(readFileSync('dados/alunos_simulados.txt', 'utf-8'));
const indicadores = calcularIndicadores(alunos, LIMIARES_PADRAO);

describe('renderPainel', () => {
  const html = renderPainel(indicadores, [], 100);

  it('mostra o total de alunos e a taxa de risco', () => {
    expect(html).toContain('100');
    expect(html).toContain('Risco de evasão');
  });

  it('inclui os graficos de frequencia e desempenho por turma', () => {
    expect(html).toContain('Frequência média por turma');
    expect(html).toContain('Desempenho médio por turma');
  });

  it('inclui o desempenho por componente curricular', () => {
    expect(html).toContain('componente curricular');
  });

  it('mostra o card de janela movel indisponivel com a orientacao, em vez de esconder', () => {
    expect(html).toContain('2 ou mais períodos');
  });

  it('lista os alunos em alerta com os motivos', () => {
    expect(html).toContain('Alunos em alerta');
    expect(html).toContain('freq. baixa');
  });

  it('nao mostra painel de erro quando nao ha erro', () => {
    expect(html).not.toContain('Problemas na leitura');
  });

  it('mostra painel de erro com linha e motivo quando ha erro', () => {
    const comErro = renderPainel(indicadores, [{ linha: 47, coluna: 'nota_matematica', motivo: 'Valor vazio.' }], 101);
    expect(comErro).toContain('Problemas na leitura');
    expect(comErro).toContain('47');
    expect(comErro).toContain('Valor vazio.');
    expect(comErro).toContain('100 de 101');
  });

  it('escapa nome de aluno com caractere de markup', () => {
    const comNomeRuim = calcularIndicadores(
      [{ ...alunos[0]!, nome: '<img onerror=1>', frequenciaPct: 10 }],
      LIMIARES_PADRAO,
    );
    const perigoso = renderPainel(comNomeRuim, [], 1);
    expect(perigoso).not.toContain('<img onerror=1>');
    expect(perigoso).toContain('&lt;img');
  });

  it('nao quebra com zero alunos', () => {
    const vazio = calcularIndicadores([], LIMIARES_PADRAO);
    expect(() => renderPainel(vazio, [], 0)).not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/render/painel.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/render/cards.ts`**

```ts
import type { Indicadores } from '../kpi';
import { ROTULO_QUADRANTE, type Quadrante } from '../kpi/defasagem';
import { escapar, numero, percentual } from './formato';

function card(titulo: string, valor: string, apoio: string): string {
  return `<article class="card">
  <h3>${escapar(titulo)}</h3>
  <p class="card__valor">${valor}</p>
  <p class="card__apoio">${escapar(apoio)}</p>
</article>`;
}

export function renderCards(ind: Indicadores): string {
  const critico = ind.componenteMaisCritico;

  const cardJanela = ind.quedaFrequencia.disponivel
    ? card(
        'Queda de frequência',
        String(ind.quedaFrequencia.quedas.length),
        ind.quedaFrequencia.quedas.length === 0
          ? 'Nenhuma queda entre os dois períodos mais recentes.'
          : `Maior queda: ${numero(Math.abs(ind.quedaFrequencia.quedas[0]!.variacaoPp))} pontos percentuais.`,
      )
    : `<article class="card card--indisponivel">
  <h3>Queda de frequência</h3>
  <p class="card__valor">—</p>
  <p class="card__apoio">${escapar(ind.quedaFrequencia.motivo)}</p>
</article>`;

  const quadrantes = (Object.keys(ind.distribuicaoDefasagem) as Quadrante[])
    .map((q) => `<li><strong>${ind.distribuicaoDefasagem[q]}</strong> — ${escapar(ROTULO_QUADRANTE[q])}</li>`)
    .join('');

  return `<section class="cards">
${card('Alunos no arquivo', String(ind.totalAlunos), 'Total de registros válidos lidos.')}
${card('Risco de evasão', percentual(ind.taxaRiscoEvasao), `${ind.alunosEmAlerta.length} aluno(s) em alerta.`)}
${card(
    'Cobertura de apoio (AEE)',
    String(ind.coberturaAee.totalComDeficiencia),
    `${ind.coberturaAee.comDeficienciaEmAlerta} também em alerta pedagógico ou de frequência.`,
  )}
${
    critico
      ? card(
          'Componente mais crítico',
          `${escapar(critico.componente)}`,
          `Turma ${critico.turma}, média ${numero(critico.media)}.`,
        )
      : card('Componente mais crítico', '—', 'Sem dados suficientes.')
  }
${cardJanela}
</section>
<section class="quadrantes">
  <h3>Frequência × desempenho</h3>
  <ul>${quadrantes}</ul>
</section>`;
}
```

- [ ] **Step 4: Implementar `src/render/tabela.ts`**

```ts
import type { Indicadores } from '../kpi';
import { escapar, numero, percentual } from './formato';

export function renderTabelaAlerta(ind: Indicadores): string {
  if (ind.alunosEmAlerta.length === 0) {
    return `<section class="alerta">
  <h2>Alunos em alerta</h2>
  <p>Nenhum aluno em alerta com os limiares atuais.</p>
</section>`;
  }

  const linhas = ind.alunosEmAlerta
    .map(
      ({ aluno, motivos }) => `    <tr>
      <td>${escapar(aluno.nome)}</td>
      <td>${escapar(aluno.turma)}</td>
      <td>${percentual(aluno.frequenciaPct)}</td>
      <td>${numero(aluno.mediaNotas)}</td>
      <td>${aluno.faltasConsecutivas}</td>
      <td>${escapar(motivos.join(', '))}</td>
    </tr>`,
    )
    .join('\n');

  return `<section class="alerta">
  <h2>Alunos em alerta</h2>
  <p>${ind.alunosEmAlerta.length} aluno(s), ordenados por criticidade.</p>
  <table>
    <caption>Alunos em situação de alerta, do mais crítico ao menos crítico</caption>
    <thead>
      <tr><th scope="col">Aluno</th><th scope="col">Turma</th><th scope="col">Frequência</th><th scope="col">Média</th><th scope="col">Faltas seguidas</th><th scope="col">Motivos</th></tr>
    </thead>
    <tbody>
${linhas}
    </tbody>
  </table>
</section>`;
}
```

- [ ] **Step 5: Implementar `src/render/erros.ts`**

```ts
import type { ErroLinha } from '../types';
import { escapar } from './formato';

export function renderErros(erros: ErroLinha[], totalLinhas: number, validas: number): string {
  if (erros.length === 0) return '';

  const itens = erros
    .map((e) => {
      const coluna = e.coluna ? ` (coluna <code>${escapar(e.coluna)}</code>)` : '';
      return `    <li>Linha ${e.linha}${coluna}: ${escapar(e.motivo)}</li>`;
    })
    .join('\n');

  return `<section class="erros" role="status">
  <h2>Problemas na leitura do arquivo</h2>
  <p>${validas} de ${totalLinhas} linha(s) foram lidas. Os indicadores abaixo consideram apenas essas.</p>
  <ul>
${itens}
  </ul>
</section>`;
}
```

- [ ] **Step 6: Implementar `src/render/index.ts`**

```ts
import type { Indicadores } from '../kpi';
import type { ErroLinha } from '../types';
import { graficoBarras } from './barras';
import { renderCards } from './cards';
import { renderErros } from './erros';
import { renderTabelaAlerta } from './tabela';

export function renderPainel(ind: Indicadores, erros: ErroLinha[], totalLinhas: number, limiarFrequencia = 75, limiarNota = 5): string {
  const graficoFrequencia = graficoBarras({
    titulo: 'Frequência média por turma',
    itens: ind.frequenciaPorTurma.map((t) => ({ rotulo: t.turma, valor: t.valor })),
    maximo: 100,
    limiar: limiarFrequencia,
    sufixo: '%',
  });

  const graficoDesempenho = graficoBarras({
    titulo: 'Desempenho médio por turma',
    itens: ind.desempenhoPorTurma.map((t) => ({ rotulo: t.turma, valor: t.valor })),
    maximo: 10,
    limiar: limiarNota,
  });

  const graficoComponente = graficoBarras({
    titulo: 'Desempenho médio por componente curricular',
    itens: ind.desempenhoPorComponente.map((c) => ({ rotulo: `${c.turma} — ${c.componente}`, valor: c.media })),
    maximo: 10,
    limiar: limiarNota,
  });

  return `${renderErros(erros, totalLinhas, ind.totalAlunos)}
${renderCards(ind)}
<section class="graficos">
${graficoFrequencia}
${graficoDesempenho}
${graficoComponente}
</section>
${renderTabelaAlerta(ind)}`;
}

export { renderCards } from './cards';
export { renderErros } from './erros';
export { renderTabelaAlerta } from './tabela';
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `npx vitest run tests/render/painel.test.ts`
Expected: PASS, 9 testes.

- [ ] **Step 8: Commit**

```bash
git add src/render/ tests/render/painel.test.ts
git commit -m "feat(render): cards, tabela de alerta e painel de erros"
```

---

## Task 14: Formulário de limiares

**Files:**
- Create: `src/render/config-ui.ts`, `tests/render/config-ui.test.ts`

**Interfaces:**
- Consumes: `Limiares` (Task 5)
- Produces:
  - `function renderConfig(limiares: Limiares): string`
  - `function lerLimiaresDoFormulario(raiz: ParentNode): Limiares`
  - Usado pela Task 15

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/render/config-ui.test.ts
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderConfig, lerLimiaresDoFormulario } from '../../src/render/config-ui';
import { LIMIARES_PADRAO } from '../../src/config/limiares';

function montar(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('renderConfig', () => {
  it('preenche os campos com os limiares atuais', () => {
    const raiz = montar(renderConfig({ frequenciaMinima: 80, faltasConsecutivas: 4, notaMinima: 6 }));
    expect(raiz.querySelector<HTMLInputElement>('#limiar-frequencia')!.value).toBe('80');
    expect(raiz.querySelector<HTMLInputElement>('#limiar-faltas')!.value).toBe('4');
    expect(raiz.querySelector<HTMLInputElement>('#limiar-nota')!.value).toBe('6');
  });

  it('associa rotulo a cada campo — requisito de acessibilidade', () => {
    const raiz = montar(renderConfig(LIMIARES_PADRAO));
    for (const id of ['limiar-frequencia', 'limiar-faltas', 'limiar-nota']) {
      expect(raiz.querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
  });
});

describe('lerLimiaresDoFormulario', () => {
  it('le de volta o que o usuario digitou', () => {
    const raiz = montar(renderConfig(LIMIARES_PADRAO));
    raiz.querySelector<HTMLInputElement>('#limiar-frequencia')!.value = '85';
    expect(lerLimiaresDoFormulario(raiz).frequenciaMinima).toBe(85);
  });

  it('cai no padrao quando o campo tem valor invalido', () => {
    const raiz = montar(renderConfig(LIMIARES_PADRAO));
    raiz.querySelector<HTMLInputElement>('#limiar-frequencia')!.value = '999';
    expect(lerLimiaresDoFormulario(raiz).frequenciaMinima).toBe(75);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/render/config-ui.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/render/config-ui.ts`**

```ts
import { validarLimiares, type Limiares } from '../config/limiares';

export function renderConfig(limiares: Limiares): string {
  return `<section class="config">
  <h2>Limiares de alerta</h2>
  <p>Ajuste conforme o perfil das turmas. A alteração vale para este navegador.</p>
  <div class="config__campos">
    <div>
      <label for="limiar-frequencia">Frequência mínima (%)</label>
      <input id="limiar-frequencia" name="limiar-frequencia" type="number" min="0" max="100" step="1" value="${limiares.frequenciaMinima}" />
    </div>
    <div>
      <label for="limiar-faltas">Faltas consecutivas</label>
      <input id="limiar-faltas" name="limiar-faltas" type="number" min="1" max="60" step="1" value="${limiares.faltasConsecutivas}" />
    </div>
    <div>
      <label for="limiar-nota">Média mínima</label>
      <input id="limiar-nota" name="limiar-nota" type="number" min="0" max="10" step="0.1" value="${limiares.notaMinima}" />
    </div>
  </div>
</section>`;
}

function valor(raiz: ParentNode, id: string): number {
  const campo = raiz.querySelector<HTMLInputElement>(`#${id}`);
  return campo ? Number(campo.value) : Number.NaN;
}

export function lerLimiaresDoFormulario(raiz: ParentNode): Limiares {
  return validarLimiares({
    frequenciaMinima: valor(raiz, 'limiar-frequencia'),
    faltasConsecutivas: valor(raiz, 'limiar-faltas'),
    notaMinima: valor(raiz, 'limiar-nota'),
  });
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/render/config-ui.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 5: Commit**

```bash
git add src/render/config-ui.ts tests/render/config-ui.test.ts
git commit -m "feat(render): formulario de limiares configuraveis"
```

---

## Task 15: Aplicação — leitura de arquivo e orquestração

**Files:**
- Modify: `src/app.ts` (substitui o conteúdo mínimo da Task 1)
- Create: `src/aplicacao.ts`, `tests/aplicacao.test.ts`

**Interfaces:**
- Consumes: `parseAlunos` (Task 4), `calcularIndicadores` (Task 11), `renderPainel` (Task 13), `renderConfig`/`lerLimiaresDoFormulario` (Task 14), persistência (Task 5)
- Produces:
  - `function montarPainel(texto: string, limiares: Limiares): string` — pipeline puro, testável sem DOM
  - `function iniciar(raiz: HTMLElement): void` (`src/app.ts`) — liga eventos

A separação existe para que o pipeline inteiro seja testável sem `FileReader`: `montarPainel` recebe texto e devolve markup.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/aplicacao.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { montarPainel } from '../src/aplicacao';
import { LIMIARES_PADRAO } from '../src/config/limiares';

const texto = readFileSync('dados/alunos_simulados.txt', 'utf-8');

describe('montarPainel', () => {
  it('vai do texto bruto ao markup do painel', () => {
    const html = montarPainel(texto, LIMIARES_PADRAO);
    expect(html).toContain('Frequência média por turma');
    expect(html).toContain('Alunos em alerta');
  });

  it('reflete mudanca de limiar no resultado', () => {
    const padrao = montarPainel(texto, LIMIARES_PADRAO);
    const rigoroso = montarPainel(texto, { ...LIMIARES_PADRAO, frequenciaMinima: 99 });
    expect(rigoroso).not.toBe(padrao);
  });

  it('mostra o painel de erro para arquivo invalido, sem lancar excecao', () => {
    const html = montarPainel('isto nao e um csv de alunos', LIMIARES_PADRAO);
    expect(html).toContain('Problemas na leitura');
  });

  it('trata arquivo vazio', () => {
    expect(() => montarPainel('', LIMIARES_PADRAO)).not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/aplicacao.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/aplicacao.ts`**

```ts
import type { Limiares } from './config/limiares';
import { calcularIndicadores } from './kpi';
import { parseAlunos } from './parser';
import { renderPainel } from './render';

/** Pipeline completo, sem DOM e sem arquivo: texto entra, markup sai. */
export function montarPainel(texto: string, limiares: Limiares): string {
  const { alunos, erros, totalLinhas } = parseAlunos(texto);
  const indicadores = calcularIndicadores(alunos, limiares);
  return renderPainel(indicadores, erros, totalLinhas, limiares.frequenciaMinima, limiares.notaMinima);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/aplicacao.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 5: Substituir `src/app.ts`**

```ts
import './estilo.css';
import { montarPainel } from './aplicacao';
import { carregarLimiares, salvarLimiares } from './config/persistencia';
import { renderConfig, lerLimiaresDoFormulario } from './render/config-ui';

const CASCA = `<header class="cabecalho">
  <h1>Painel de Acompanhamento Pedagógico — EJA</h1>
  <p>Os dados são lidos no seu computador. Nada é enviado pela internet.</p>
</header>
<section class="entrada">
  <label for="arquivo">Arquivo de alunos (.txt ou .csv, separado por ponto e vírgula)</label>
  <input id="arquivo" type="file" accept=".txt,.csv,text/plain,text/csv" />
  <div id="area-soltar" class="area-soltar">Ou arraste o arquivo até aqui</div>
</section>
<div id="config"></div>
<main id="painel" aria-live="polite"><p class="vazio">Carregue um arquivo para ver os indicadores.</p></main>`;

let limiares = carregarLimiares();
let textoAtual = '';

function atualizar(raiz: HTMLElement): void {
  const painel = raiz.querySelector<HTMLElement>('#painel');
  if (!painel) return;
  painel.innerHTML = textoAtual === ''
    ? '<p class="vazio">Carregue um arquivo para ver os indicadores.</p>'
    : montarPainel(textoAtual, limiares);
}

function lerArquivo(arquivo: File, raiz: HTMLElement): void {
  const leitor = new FileReader();
  leitor.onload = () => {
    textoAtual = String(leitor.result ?? '');
    atualizar(raiz);
  };
  leitor.onerror = () => {
    const painel = raiz.querySelector<HTMLElement>('#painel');
    if (painel) painel.innerHTML = '<p class="vazio">Não foi possível ler o arquivo. Tente selecioná-lo novamente.</p>';
  };
  leitor.readAsText(arquivo, 'utf-8');
}

export function iniciar(raiz: HTMLElement): void {
  raiz.innerHTML = CASCA;

  const areaConfig = raiz.querySelector<HTMLElement>('#config');
  if (areaConfig) areaConfig.innerHTML = renderConfig(limiares);

  raiz.querySelector<HTMLInputElement>('#arquivo')?.addEventListener('change', (evento) => {
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (arquivo) lerArquivo(arquivo, raiz);
  });

  const area = raiz.querySelector<HTMLElement>('#area-soltar');
  area?.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('area-soltar--ativa');
  });
  area?.addEventListener('dragleave', () => area.classList.remove('area-soltar--ativa'));
  area?.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('area-soltar--ativa');
    const arquivo = e.dataTransfer?.files?.[0];
    if (arquivo) lerArquivo(arquivo, raiz);
  });

  areaConfig?.addEventListener('change', () => {
    limiares = lerLimiaresDoFormulario(areaConfig);
    salvarLimiares(limiares);
    atualizar(raiz);
  });
}

const raiz = document.querySelector<HTMLElement>('#app');
if (raiz) iniciar(raiz);
```

- [ ] **Step 6: Verificar no navegador**

Run: `npm run dev`
Abra o endereço impresso, carregue `dados/alunos_simulados.txt`, confirme que os indicadores aparecem, altere a frequência mínima para 90 e confirme que a lista de alerta cresce. Recarregue a página e confirme que o limiar 90 foi lembrado. Encerre com Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add src/app.ts src/aplicacao.ts tests/aplicacao.test.ts
git commit -m "feat(app): leitura de arquivo local e orquestracao do painel"
```

---

## Task 16: Acessibilidade, impressão e trava de rede

**Files:**
- Modify: `src/estilo.css`
- Create: `tests/sem-rede.test.ts`

**Interfaces:**
- Consumes: build da Task 1
- Produces: `dist/painel-eja.html` verificado como offline e acessível

- [ ] **Step 1: Escrever o teste de trava de rede que falha**

```ts
// tests/sem-rede.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const CAMINHO = 'dist/painel-eja.html';

describe('bundle entregue à escola', () => {
  it('foi gerado — rode npm run build antes', () => {
    expect(existsSync(CAMINHO)).toBe(true);
  });

  it('nao faz nenhuma chamada de rede', () => {
    const html = readFileSync(CAMINHO, 'utf-8');
    for (const proibido of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'navigator.sendBeacon']) {
      expect(html).not.toContain(proibido);
    }
  });

  it('nao referencia nenhum host externo', () => {
    const html = readFileSync(CAMINHO, 'utf-8');
    expect(html).not.toMatch(/(src|href)\s*=\s*["']https?:\/\//i);
    expect(html).not.toMatch(/@import\s+url\(\s*["']?https?:/i);
  });

  it('declara o idioma da pagina', () => {
    expect(readFileSync(CAMINHO, 'utf-8')).toContain('lang="pt-BR"');
  });
});
```

- [ ] **Step 2: Rodar o build e depois o teste**

Run: `npm run build && npx vitest run tests/sem-rede.test.ts`
Expected: PASS, 4 testes. Se algum falhar, remova a dependência externa antes de seguir — a garantia de LGPD do projeto depende disso.

- [ ] **Step 3: Completar `src/estilo.css`**

```css
:root {
  --tinta: #0b0b0b;
  --tinta-fraca: #52514e;
  --tinta-apagada: #6b6a65;
  --superficie: #fcfcfb;
  --superficie-card: #ffffff;
  --linha: #e1e0d9;
  --serie: #2a78d6;
  --identidade: #4a3aa7;
  --bom: #0a7a0a;
  --critico: #b02a2a;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 1.5rem;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--tinta);
  background: var(--superficie);
}

h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
h2 { font-size: 1.15rem; margin: 2rem 0 0.5rem; }
h3 { font-size: 0.95rem; margin: 0 0 0.5rem; color: var(--tinta-fraca); font-weight: 600; }

.cabecalho p { margin: 0; color: var(--tinta-fraca); }

.entrada { margin: 1.5rem 0; }
.entrada label { display: block; margin-bottom: 0.4rem; font-weight: 600; }

.area-soltar {
  margin-top: 0.75rem;
  padding: 1.25rem;
  border: 2px dashed var(--linha);
  border-radius: 6px;
  text-align: center;
  color: var(--tinta-apagada);
}
.area-soltar--ativa { border-color: var(--serie); color: var(--tinta); }

.cards { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1.5rem 0; }
.card {
  flex: 1 1 190px;
  padding: 1rem;
  background: var(--superficie-card);
  border: 1px solid var(--linha);
  border-radius: 6px;
}
.card__valor { margin: 0; font-size: 1.9rem; font-weight: 700; }
.card__apoio { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--tinta-fraca); }
.card--indisponivel { border-style: dashed; }
.card--indisponivel .card__valor { color: var(--tinta-apagada); }

.grafico { margin: 0 0 1.5rem; }
.grafico figcaption { font-weight: 600; margin-bottom: 0.5rem; }
.grafico svg { width: 100%; height: auto; max-width: 640px; }
.barra { fill: var(--serie); }
.barra--alerta { fill: var(--critico); }
.rotulo, .valor { font-size: 12px; fill: var(--tinta); }
.limiar { stroke: var(--tinta-apagada); stroke-width: 1; stroke-dasharray: 4 3; }
.limiar-rotulo { font-size: 10px; fill: var(--tinta-apagada); }

table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
caption { text-align: left; color: var(--tinta-fraca); padding-bottom: 0.5rem; }
th, td { text-align: left; padding: 0.45rem 0.6rem; border-bottom: 1px solid var(--linha); }
th { background: #f4f3ee; }

.erros {
  padding: 1rem;
  border: 1px solid var(--critico);
  border-left-width: 4px;
  border-radius: 4px;
  background: #fdf6f6;
  margin-bottom: 1.5rem;
}
.erros ul { margin: 0.5rem 0 0; padding-left: 1.25rem; }

.config__campos { display: flex; flex-wrap: wrap; gap: 1rem; }
.config label { display: block; font-size: 0.85rem; color: var(--tinta-fraca); }
.config input { width: 8rem; padding: 0.35rem; font-size: 1rem; border: 1px solid var(--linha); border-radius: 4px; }

:focus-visible { outline: 3px solid var(--identidade); outline-offset: 2px; }

.vazio { color: var(--tinta-apagada); }

@media print {
  body { padding: 0; font-size: 12px; }
  .entrada, .config, .area-soltar { display: none; }
  .card, .erros { break-inside: avoid; }
  .grafico { break-inside: avoid; }
  table { font-size: 11px; }
}
```

- [ ] **Step 4: Conferir a acessibilidade à mão**

Rode `npm run dev` e confirme, um a um:

1. `Tab` alcança o seletor de arquivo e os três campos de limiar, com contorno visível.
2. Cada campo de limiar tem rótulo clicável que move o foco para o campo.
3. Nenhum alerta é comunicado só por cor — a barra vermelha traz "abaixo do limiar" em texto, e a tabela traz a coluna "Motivos".
4. `Ctrl+P` mostra a pré-visualização de impressão sem o seletor de arquivo e sem a configuração, com a tabela legível.
5. Zoom do navegador em 200% não corta conteúdo.

- [ ] **Step 5: Commit**

```bash
git add src/estilo.css tests/sem-rede.test.ts
git commit -m "feat(a11y): estilo acessivel, folha de impressao e trava de rede testada"
```

---

## Task 17: Empacotamento e guia de uso

**Files:**
- Create: `entrega/GUIA-DE-USO.md`, `README.md`
- Modify: `.gitignore` (permitir `dist/painel-eja.html` versionado)

**Interfaces:**
- Consumes: build (Tasks 1 e 16)
- Produces: `dist/painel-eja.html` versionado e o guia de uma página levado à escola

- [ ] **Step 1: Rodar a suíte completa e o build**

Run: `npm test && npm run build`
Expected: todos os testes verdes; `OK dist/painel-eja.html — NN KB, arquivo unico`.

- [ ] **Step 2: Verificar o comportamento offline de verdade**

Abra `dist/painel-eja.html` com duplo clique, **com o wi-fi desligado**. Carregue `dados/alunos_simulados.txt`. Confirme que os indicadores aparecem normalmente. Esta é a demonstração que será repetida na escola.

- [ ] **Step 3: Escrever `entrega/GUIA-DE-USO.md`**

```markdown
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
```

- [ ] **Step 4: Escrever `README.md`**

```markdown
# Painel EJA

Painel de acompanhamento pedagógico para turmas de EJA, entregue como um arquivo
HTML único que roda no navegador, sem instalação e sem rede.

Atividade Extensionista II — CST em Análise e Desenvolvimento de Sistemas, UNINTER.
Continuação do levantamento realizado na Atividade Extensionista I.

- Design: `docs/projeto/specs/2026-08-25-painel-eja-ae2-design.md`
- Plano: `docs/projeto/plans/2026-08-25-painel-eja.md`
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
```

- [ ] **Step 5: Versionar o entregável**

```bash
git add -f dist/painel-eja.html
git add entrega/ README.md
git commit -m "chore: empacota o painel e o guia de uso para entrega na escola"
```

O `-f` é intencional: o entregável versionado é a prova de desenvolvimento que entra no relatório, já que o repositório é privado.

- [ ] **Step 6: Verificação final**

Run: `npm test`
Expected: todos verdes, incluindo `tests/sem-rede.test.ts`.

Confirme também: `git log --oneline` mostra um commit por task, e o histórico serve de evidência de desenvolvimento para o relatório.

---

## Marcos não-código

Estas entregas valem nota e não têm ciclo de teste. Ficam registradas aqui para não sumirem do radar; o detalhamento está na spec, seções 9 e 10.

- [ ] **M1 — Abrir contato com a escola (até 07/09/2026).** Mensagem ao professor Valdir Gomes propondo a apresentação. Não depende do código estar pronto.
- [ ] **M2 — Postar a Validação da Proposta (até 07/09/2026).** Modelo institucional, PDF, arquivo único no AVA. Antecipado de propósito: a devolutiva do corretor precisa chegar com tempo de ser incorporada.
- [ ] **M3 — Preparar o material de campo (até 31/10/2026).** Formulário de feedback estruturado, declaração da instituição já preenchida faltando assinatura, guia de uso impresso.
- [ ] **M4 — Decisão sobre plano B (31/10/2026).** Se a escola não confirmou data até aqui, acionar comunidade alternativa.
- [ ] **M5 — Sessão de campo (até 30/11/2026).** Apresentação, demonstração offline, professor operando, formulários respondidos, fotos, declaração assinada.
- [ ] **M6 — Calibrar limiares com o retorno (até 14/12/2026).** Ajustes que saírem da sessão viram commits.
- [ ] **M7 — Trabalho Final (até 28/12/2026).** Dez páginas, modelo institucional. O diagrama de metodologia sai da seção 10 da spec; os resultados saem das evidências de M5 e do histórico de commits.
- [ ] **M8 — Postar no AVA (até 05/01/2027).** PDF, arquivo único, etapa "Trabalho Final".
