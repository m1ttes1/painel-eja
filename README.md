# 📊 Painel EJA — Acompanhamento Pedagógico

![Badge Status](https://img.shields.io/badge/status-production%20ready-brightgreen?style=flat-square)
![Badge Tests](https://img.shields.io/badge/tests-118%2F118%20passing-blue?style=flat-square)
![Badge Size](https://img.shields.io/badge/size-22%20KB%20%28single%20file%29-brightgreen?style=flat-square)
![Badge License](https://img.shields.io/badge/license-MIT-gray?style=flat-square)

**Sistema web de análise automática para turmas de Educação de Jovens e Adultos (EJA)**

Desenvolvido como **Atividade Extensionista II** (UNINTER — Universidade Paulista)

---

## 🎯 O Que É?

Painel pedagógico que analisa **frequência**, **notas** e **risco de evasão** de alunos EJA em tempo real. Basta arrastar um arquivo CSV com dados da turma — o resto é automático.

**Ideal para:**
- Gestores EJA que precisam acompanhar 30+ alunos
- Escolas sem infraestrutura complexa
- Análises rápidas e offline (sem internet necessária)

---

## ✨ Destaques

### 🚀 **Simples de Usar**
Drag-and-drop um arquivo → análise instantânea
```
Nenhuma instalação • Sem internet • Sem login • Funciona offline
```

### 📈 **Indicadores Automáticos**
- **Frequência média** por turma (com alertas se abaixo do limiar)
- **Desempenho** por disciplina (9 componentes BNCC)
- **Risco de evasão** — identifica alunos críticos
- **Cobertura AEE** — alunos com deficiência em apoio especializado
- **Queda de frequência** — tendências entre períodos

### 🎨 **Interface Profissional**
Cores semânticas (verde=bom, âmbar=atenção, vermelho=crítico)
Tabelas com ordenação automática, gráficos em SVG, responsivo

### 🔒 **Privacidade Garantida**
- Dados processam **apenas no navegador do usuário**
- Nada sai da máquina
- Arquivo nunca trafega para servidor

---

## 🚀 Como Começar

### ⚡ Opção 1: Download Rápido (Recomendado)

1. **Baixar** `painel-eja-v1.0.zip`  
   👉 https://github.com/m1ttes1/atividade-extensionista-2/releases

2. **Extrair** → dois arquivos:
   - `painel-eja.html` (22 KB — app completo)
   - `turmas-eja-completo.txt` (dataset exemplo)

3. **Abrir** `painel-eja.html` no navegador
   (Funciona offline, em qualquer PC)

4. **Arrastar** `turmas-eja-completo.txt` para o painel
   ✅ Análise renderiza em < 1 segundo

### 🔧 Opção 2: Desenvolvimento (GitHub)

```bash
git clone https://github.com/m1ttes1/atividade-extensionista-2.git
cd atividade-extensionista-2
npm install
npm run build    # Gera dist/painel-eja.html
npm test         # Roda 118 testes
npm run dev      # Dev server (http://localhost:5173)
```

---

## 📊 Exemplo de Análise

**Entrada:** CSV com 36 alunos, 5 turmas, 9 disciplinas

**Saída automática:**
```
✓ 5 KPI cards (alunos, risco, AEE, componente crítico, queda freq)
✓ 3 gráficos em SVG (frequência/turma, desempenho/disciplina, matriz 2x2)
✓ Tabela com alunos em alerta (20 linhas ordenadas por criticidade)
✓ Limiares ajustáveis (frequência mín, faltas consecutivas, nota mín)
```

---

## 📋 Formato do Arquivo

Arquivo CSV semicolonado (`;`) com essas colunas:

| Campo | Exemplo | Obrigatório |
|-------|---------|-------------|
| `nome` | Maria Silva | ✅ |
| `turma` | EJA 1º A | ✅ |
| `frequencia_pct` | 85 | ✅ |
| `nota_portugues` | 7.5 | ✅ |
| `nota_matematica` | 6.5 | ✅ |
| `nota_ciencias` | 7.0 | ✅ |
| `faltas_consecutivas` | 1 | ✅ |
| `periodo` | 2026.2 | ⭕ |
| `turno` | Noite | ⭕ |
| `idade` | 34 | ⭕ |
| `possui_deficiencia` | Não | ⭕ |
| `observacao` | Participativa | ⭕ |

**Nota:** Colunas obrigatórias = `✅`. Opcionais = `⭕`.

---

## 🏛️ Contexto Educacional

### Por que EJA?
Educação de Jovens e Adultos enfrenta desafios únicos:
- Alunos com múltiplas responsabilidades (trabalho, família)
- Taxas de evasão mais altas
- Necessidade de acompanhamento próximo

### Conformidade BNCC
Painel segue a Base Nacional Comum Curricular:
- ✅ 9 componentes curriculares (Português, Matemática, Ciências, Arte, Ed.Física, Inglês, História, Geografia, Religioso)
- ✅ 2 etapas (não 9 séries como ensino regular)
- ✅ Suporta múltiplos turnos

---

## 🧪 Testes & Qualidade

```
Test Files  20 / 20 passing
Tests      118 / 118 passing
Coverage   Cobertura: parser, KPIs, render, config
```

Cobertura:
- **Parser:** validação CSV, UTF-8, colunas obrigatórias
- **KPI:** frequência, desempenho, risco, AEE, defasagem
- **Render:** cards, tabelas, gráficos, config UI
- **Build:** bundle offline, sem deps externas, sem chamadas de rede

---

## 🔒 Privacidade & Segurança

- ✅ Zero dependências runtime (sem npm packages)
- ✅ Processamento 100% local (navegador)
- ✅ Nenhum dado sai da máquina
- ✅ HTTPS namespace SVG obrigatório (offline-safe)
- ✅ `.gitignore` bloqueia dados reais

---

## 📁 Estrutura do Projeto

```
src/
├── parser/        CSV parsing + validação
├── kpi/           Indicadores pedagógicos
├── render/        Geração HTML + gráficos SVG
├── config/        Persistência localStorage
├── app.ts         Entry point + event handlers
└── estilo.css     Design tokens + componentes

tests/
├── parser/        Testes de parsing
├── kpi/           Testes de KPIs
├── render/        Testes de renderização
└── sem-rede.test.ts  Testes offline + bundle

dist/
└── painel-eja.html  App compilado (22 KB, single-file)
```

---

## 🛠️ Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| **Linguagem** | TypeScript 5+ |
| **Build** | Vite + vite-plugin-singlefile |
| **Testes** | Vitest (118 testes) |
| **Estilo** | CSS Grid + Flexbox + SVG |
| **Runtime** | Zero deps (vanilla JS) |

---

## 📞 Contato & Suporte

**Desenvolvedor:**  
Victor Mittestainer  
📧 vmittestainer.dev@gmail.com  
🔗 GitHub: [@m1ttes1](https://github.com/m1ttes1)

**Projeto:**  
Atividade Extensionista II — UNINTER  
Disciplina: Desenvolvimento Web Aplicado  
Período: 2026.2

---

## 📄 Licença

MIT License — Veja LICENSE para detalhes

---

## 🎓 Sobre Este Projeto

Este painel foi desenvolvido **especificamente para a Atividade Extensionista II (UNINTER)** como solução de acompanhamento pedagógico para turmas EJA.

### É pra outro relatório/contexto?

Se você precisa adaptar o painel para:
- Outro formato de arquivo (Excel, JSON, etc.)
- Outros indicadores pedagógicos
- Diferentes campos/disciplinas
- Integração com sistema próprio

**Entre em contato** — podemos customizar! 

📧 **vmittestainer.dev@gmail.com** ou abra uma issue no GitHub

Suportamos:
- ✅ Novos formatos de entrada
- ✅ KPIs adicionais
- ✅ Temas/cores customizadas
- ✅ Exportação de relatórios (PDF/Excel)
- ✅ Integração com APIs

---

## 🙏 Agradecimentos

Desenvolvido com suporte acadêmico UNINTER e orientação em boas práticas de software.

Inspirado em necessidades reais de gestores EJA que lidam com relatórios manuais diariamente.

---

**Versão:** 1.0  
**Status:** Pronto para produção  
**Última atualização:** Setembro de 2026

🚀 **Pronto para usar. Basta baixar, arrastar e analisar.**
