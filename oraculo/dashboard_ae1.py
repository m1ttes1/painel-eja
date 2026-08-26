"""
Protótipo de dashboard de desempenho escolar para apoio pedagógico (EJA).

Uso:
    python dashboard.py [caminho_do_arquivo.txt]

Se nenhum caminho for informado, usa "dados/alunos_simulados.txt".

Gera:
  - graficos/kpi_frequencia_turma.png
  - graficos/kpi_desempenho_turma.png
  - graficos/kpi_alerta_geral.png
  - graficos/kpi_alunos_alerta_tabela.png
  - dashboard.html (visão interativa local)

Paleta e specs seguem a skill "dataviz" (paleta validada contra daltonismo,
contraste e legibilidade em P&B — ver referências em .claude/skills/dataviz).

Os dados usados por padrão são 100% SIMULADOS (ver gerar_dados_simulados.py).
Nenhum dado real de aluno é utilizado nesta etapa do projeto.
"""
import base64
import io
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import pandas as pd

# --- Paleta (dataviz skill — light mode) ---
INK_PRIMARY = "#0b0b0b"
INK_SECONDARY = "#52514e"
INK_MUTED = "#898781"
GRIDLINE = "#e1e0d9"
BASELINE = "#c3c2b7"
SURFACE = "#fcfcfb"
SERIES_BLUE = "#2a78d6"       # categorical slot 1 — magnitude neutra
SERIES_VIOLET = "#4a3aa7"     # categorical slot 7 — identidade (PCD), nunca status
STATUS_GOOD = "#0ca30c"
STATUS_CRITICAL = "#d03b3b"

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 11,
    "text.color": INK_PRIMARY,
    "axes.edgecolor": BASELINE,
    "axes.labelcolor": INK_SECONDARY,
    "xtick.color": INK_MUTED,
    "ytick.color": INK_PRIMARY,
    "figure.facecolor": SURFACE,
    "axes.facecolor": SURFACE,
})

# --- Regras de KPI (definidas na etapa de Análise e Mapeamento) ---
LIMIAR_FREQUENCIA_RISCO = 75.0
LIMIAR_FALTAS_CONSECUTIVAS_RISCO = 3
LIMIAR_NOTA_ALERTA = 5.0

GRAFICOS_DIR = Path("graficos")


def carregar_dados(caminho: str) -> pd.DataFrame:
    df = pd.read_csv(caminho, sep=";", encoding="utf-8")
    df["media_notas"] = df[["nota_portugues", "nota_matematica", "nota_ciencias"]].mean(axis=1)
    if "possui_deficiencia" in df.columns:
        df["possui_deficiencia"] = df["possui_deficiencia"].astype(str).str.strip().str.lower() == "sim"
    else:
        df["possui_deficiencia"] = False

    def classificar_risco(row):
        motivos = []
        if row["frequencia_pct"] < LIMIAR_FREQUENCIA_RISCO:
            motivos.append("freq. baixa")
        if row["faltas_consecutivas"] >= LIMIAR_FALTAS_CONSECUTIVAS_RISCO:
            motivos.append("faltas seguidas")
        if row["media_notas"] < LIMIAR_NOTA_ALERTA:
            motivos.append("notas baixas")
        return motivos

    df["motivos_alerta"] = df.apply(classificar_risco, axis=1)
    df["em_alerta"] = df["motivos_alerta"].apply(lambda m: len(m) > 0)
    return df


def _no_spines(ax, keep=("bottom",)):
    for side, spine in ax.spines.items():
        spine.set_visible(side in keep)
    ax.grid(axis="x", color=GRIDLINE, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)


def grafico_frequencia_por_turma(df: pd.DataFrame, caminho: Path):
    media_turma = df.groupby("turma")["frequencia_pct"].mean().sort_values()
    fig, ax = plt.subplots(figsize=(7, 3.4), dpi=300)

    cores = [STATUS_CRITICAL if v < LIMIAR_FREQUENCIA_RISCO else SERIES_BLUE for v in media_turma.values]
    bars = ax.barh(media_turma.index, media_turma.values, color=cores, height=0.55, zorder=3)

    for bar, valor in zip(bars, media_turma.values):
        ax.text(valor + 1.2, bar.get_y() + bar.get_height() / 2, f"{valor:.1f}%",
                va="center", ha="left", fontsize=10, color=INK_PRIMARY)

    ax.axvline(LIMIAR_FREQUENCIA_RISCO, color=INK_MUTED, linestyle="--", linewidth=1, zorder=2)
    ax.text(LIMIAR_FREQUENCIA_RISCO, -0.75, f"limiar de risco ({LIMIAR_FREQUENCIA_RISCO:.0f}%)",
            fontsize=8.5, color=INK_MUTED, va="top", ha="center")

    ax.set_title("Frequência média por turma", fontsize=13, color=INK_PRIMARY, loc="left", pad=12, fontweight="bold")
    ax.set_ylim(-1.3, len(media_turma) - 0.3)
    ax.set_xlim(0, 108)
    ax.set_xlabel("Frequência (%)", fontsize=9.5)
    _no_spines(ax)
    fig.tight_layout()
    fig.savefig(caminho, dpi=300, bbox_inches="tight", facecolor=SURFACE)
    plt.close(fig)


def grafico_desempenho_por_turma(df: pd.DataFrame, caminho: Path):
    media_turma = df.groupby("turma")["media_notas"].mean().sort_values()
    fig, ax = plt.subplots(figsize=(7, 3.4), dpi=300)

    cores = [STATUS_CRITICAL if v < LIMIAR_NOTA_ALERTA else SERIES_BLUE for v in media_turma.values]
    bars = ax.barh(media_turma.index, media_turma.values, color=cores, height=0.55, zorder=3)

    for bar, valor in zip(bars, media_turma.values):
        ax.text(valor + 0.12, bar.get_y() + bar.get_height() / 2, f"{valor:.1f}",
                va="center", ha="left", fontsize=10, color=INK_PRIMARY)

    ax.axvline(LIMIAR_NOTA_ALERTA, color=INK_MUTED, linestyle="--", linewidth=1, zorder=2)
    ax.text(LIMIAR_NOTA_ALERTA, -0.75, f"limiar de alerta ({LIMIAR_NOTA_ALERTA:.0f})",
            fontsize=8.5, color=INK_MUTED, va="top", ha="center")

    ax.set_title("Desempenho médio por turma", fontsize=13, color=INK_PRIMARY, loc="left", pad=12, fontweight="bold")
    ax.set_ylim(-1.3, len(media_turma) - 0.3)
    ax.set_xlim(0, 10.8)
    ax.set_xlabel("Média das notas (0–10)", fontsize=9.5)
    _no_spines(ax)
    fig.tight_layout()
    fig.savefig(caminho, dpi=300, bbox_inches="tight", facecolor=SURFACE)
    plt.close(fig)


def grafico_farol_geral(df: pd.DataFrame, caminho: Path):
    total = len(df)
    em_alerta = int(df["em_alerta"].sum())
    ok = total - em_alerta

    fig, ax = plt.subplots(figsize=(5.5, 2.5), dpi=300)
    categorias = ["Sem alerta", "Em alerta"]
    valores = [ok, em_alerta]
    cores = [STATUS_GOOD, STATUS_CRITICAL]

    bars = ax.bar(categorias, valores, color=cores, width=0.5, zorder=3)
    for bar, valor in zip(bars, valores):
        pct = valor / total * 100
        ax.text(bar.get_x() + bar.get_width() / 2, valor + total * 0.02,
                 f"{valor} aluno(s)\n({pct:.0f}%)", ha="center", va="bottom",
                 fontsize=10, color=INK_PRIMARY)

    ax.set_ylim(0, max(valores) * 1.18)
    ax.set_title(f"Situação de alerta — {total} alunos (simulados)", fontsize=13,
                 color=INK_PRIMARY, loc="left", pad=12, fontweight="bold")
    ax.grid(axis="y", color=GRIDLINE, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)
    for side, spine in ax.spines.items():
        spine.set_visible(side == "bottom")
    ax.set_yticks([])
    fig.tight_layout()
    fig.savefig(caminho, dpi=300, bbox_inches="tight", facecolor=SURFACE)
    plt.close(fig)


def grafico_apoio_pcd(df: pd.DataFrame, caminho: Path):
    pcd = df[df["possui_deficiencia"]]
    total_pcd = len(pcd)
    pcd_tambem_alerta = int(pcd["em_alerta"].sum())
    pcd_so_apoio = total_pcd - pcd_tambem_alerta

    fig, ax = plt.subplots(figsize=(7, 2.6), dpi=300)
    categorias = ["Apoio específico (AEE)\nsem alerta pedagógico", "Apoio específico (AEE)\ntambém em alerta"]
    valores = [pcd_so_apoio, pcd_tambem_alerta]
    cores = [SERIES_VIOLET, STATUS_CRITICAL]

    bars = ax.barh(categorias, valores, color=cores, height=0.5, zorder=3)
    for bar, valor in zip(bars, valores):
        ax.text(valor + max(total_pcd, 1) * 0.02, bar.get_y() + bar.get_height() / 2, str(valor),
                va="center", ha="left", fontsize=11, color=INK_PRIMARY, fontweight="bold")

    ax.set_title(f"Alunos com deficiência acompanhados — {total_pcd} de {len(df)}", fontsize=12.5,
                 color=INK_PRIMARY, loc="left", pad=12, fontweight="bold")
    ax.set_xlim(0, max(valores + [1]) * 1.35)
    _no_spines(ax)
    ax.set_xlabel("Alunos", fontsize=9.5)
    fig.tight_layout()
    fig.savefig(caminho, dpi=300, bbox_inches="tight", facecolor=SURFACE)
    plt.close(fig)


# A tabela entra no relatório em espaço fixo (353 pt de largura). Menos linhas com
# fonte maior lê melhor no PDF impresso do que a lista inteira em corpo minúsculo:
# a lista completa é a saída do dashboard.html, aqui é a amostra dos casos críticos.
LINHAS_TABELA_ALERTA = 8
TABELA_PX = (3755, 1513)  # dimensão fixa: preserva o enquadramento já usado no .docx


def _maior_fonte_que_cabe(tbl, fig, minimo=8.0, maximo=22.0):
    """Maior corpo em que nenhum texto estoura a própria célula (evita corte)."""
    tamanho = minimo
    for candidato in [x / 2 for x in range(int(maximo * 2), int(minimo * 2) - 1, -1)]:
        tbl.set_fontsize(candidato)
        fig.canvas.draw()
        ren = fig.canvas.get_renderer()
        cabe = True
        for cell in tbl.get_celld().values():
            if not cell.get_text().get_text():
                continue
            disponivel = cell.get_window_extent(ren).width * (1 - 2 * cell.PAD)
            if cell.get_text().get_window_extent(ren).width > disponivel:
                cabe = False
                break
        if cabe:
            tamanho = candidato
            break
    tbl.set_fontsize(tamanho)
    return tamanho


def tabela_alunos_alerta(df: pd.DataFrame, caminho: Path):
    em_alerta = df[df["em_alerta"]].sort_values("frequencia_pct").head(LINHAS_TABELA_ALERTA)

    colunas = ["Nome", "Turma", "Frequência", "Média", "Faltas cons.", "Motivo(s)"]
    linhas = [
        [r.nome, r.turma.replace("EJA - Equivalente ", "EJA "),
         f"{r.frequencia_pct:.1f}%", f"{r.media_notas:.1f}",
         str(r.faltas_consecutivas), ", ".join(r.motivos_alerta)]
        for r in em_alerta.itertuples()
    ]

    largura_px, altura_px = TABELA_PX
    fig, ax = plt.subplots(figsize=(largura_px / 300, altura_px / 300), dpi=300)
    ax.axis("off")
    ax.set_position([0, 0, 1, 1])

    larguras = [0.19, 0.12, 0.12, 0.09, 0.12, 0.36]
    tbl = ax.table(cellText=linhas, colLabels=colunas,
                   cellLoc="left", colWidths=larguras, bbox=[0.015, 0.03, 0.97, 0.85])
    tbl.auto_set_font_size(False)

    for (row, col), cell in tbl.get_celld().items():
        cell.set_edgecolor(GRIDLINE)
        if row == 0:
            cell.set_facecolor(SERIES_BLUE)
            cell.set_text_props(color="#ffffff", fontweight="bold")
        else:
            cell.set_facecolor(SURFACE if row % 2 else "#f5f5f2")
            cell.set_text_props(color=INK_PRIMARY)

    corpo = _maior_fonte_que_cabe(tbl, fig)

    ax.text(0.015, 0.90, f"Alunos em alerta (top {len(linhas)} por frequência)",
            transform=ax.transAxes, fontsize=corpo * 1.15, fontweight="bold",
            color=INK_PRIMARY, va="bottom", ha="left")

    fig.savefig(caminho, dpi=300, facecolor=SURFACE)
    plt.close(fig)


def _png_para_base64(caminho: Path) -> str:
    return base64.b64encode(caminho.read_bytes()).decode("ascii")


def gerar_html(df: pd.DataFrame, origem: str, imgs: dict) -> str:
    total_alunos = len(df)
    freq_media_geral = df["frequencia_pct"].mean()
    media_geral = df["media_notas"].mean()
    em_alerta = df[df["em_alerta"]]

    return f"""<!doctype html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<title>Dashboard de Desempenho Escolar - EJA (Protótipo)</title>
<style>
  body {{ font-family: system-ui, -apple-system, "Segoe UI", sans-serif; margin: 24px; background: #f9f9f7; color: {INK_PRIMARY}; }}
  h1 {{ font-size: 22px; }}
  .aviso {{ background: #fff8e6; border: 1px solid #eda100; padding: 10px 14px; border-radius: 6px; font-size: 13px; }}
  .kpis {{ display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }}
  .kpi {{ background: {SURFACE}; border: 1px solid {GRIDLINE}; border-radius: 8px; padding: 14px 18px; min-width: 160px; }}
  .kpi .valor {{ font-size: 26px; font-weight: bold; color: {INK_PRIMARY}; }}
  .kpi .label {{ font-size: 12px; color: {INK_SECONDARY}; }}
  .graficos img {{ max-width: 100%; background: {SURFACE}; border: 1px solid {GRIDLINE}; border-radius: 8px; padding: 8px; margin-bottom: 16px; }}
  footer {{ margin-top: 32px; font-size: 11px; color: {INK_MUTED}; }}
</style>
</head>
<body>
  <h1>Dashboard de Desempenho Escolar para Apoio Pedagógico</h1>
  <p>EMEF/EJA Maria de Fátima Faria Área — protótipo conceitual (Atividade Extensionista I)</p>
  <div class="aviso">
    Dados exibidos: <strong>simulados/fictícios</strong>. Nenhum dado real de aluno foi utilizado. Fonte: {origem}
  </div>

  <div class="kpis">
    <div class="kpi"><div class="valor">{total_alunos}</div><div class="label">Alunos (simulados)</div></div>
    <div class="kpi"><div class="valor">{freq_media_geral:.1f}%</div><div class="label">Frequência média geral</div></div>
    <div class="kpi"><div class="valor">{media_geral:.1f}</div><div class="label">Média geral de notas</div></div>
    <div class="kpi"><div class="valor">{len(em_alerta)}</div><div class="label">Alunos em alerta</div></div>
  </div>

  <div class="graficos">
    <img src="data:image/png;base64,{imgs['freq']}" alt="Frequência média por turma">
    <img src="data:image/png;base64,{imgs['desemp']}" alt="Desempenho médio por turma">
    <img src="data:image/png;base64,{imgs['farol']}" alt="Situação de alerta">
    <img src="data:image/png;base64,{imgs['pcd']}" alt="Alunos com deficiência acompanhados">
    <img src="data:image/png;base64,{imgs['tabela']}" alt="Alunos em alerta">
  </div>

  <footer>
    Protótipo gerado automaticamente a partir de arquivo TXT — Atividade Extensionista I: Tecnologia Aplicada à Inclusão Digital (UNINTER).
  </footer>
</body>
</html>
"""


def main():
    caminho = sys.argv[1] if len(sys.argv) > 1 else "dados/alunos_simulados.txt"
    if not Path(caminho).exists():
        print(f"Arquivo não encontrado: {caminho}")
        print("Rode antes: python gerar_dados_simulados.py")
        sys.exit(1)

    GRAFICOS_DIR.mkdir(exist_ok=True)
    df = carregar_dados(caminho)

    p_freq = GRAFICOS_DIR / "kpi_frequencia_turma.png"
    p_desemp = GRAFICOS_DIR / "kpi_desempenho_turma.png"
    p_farol = GRAFICOS_DIR / "kpi_alerta_geral.png"
    p_pcd = GRAFICOS_DIR / "kpi_apoio_pcd.png"
    p_tabela = GRAFICOS_DIR / "kpi_alunos_alerta_tabela.png"

    grafico_frequencia_por_turma(df, p_freq)
    grafico_desempenho_por_turma(df, p_desemp)
    grafico_farol_geral(df, p_farol)
    grafico_apoio_pcd(df, p_pcd)
    tabela_alunos_alerta(df, p_tabela)

    imgs = {
        "freq": _png_para_base64(p_freq),
        "desemp": _png_para_base64(p_desemp),
        "farol": _png_para_base64(p_farol),
        "pcd": _png_para_base64(p_pcd),
        "tabela": _png_para_base64(p_tabela),
    }
    html = gerar_html(df, origem=caminho, imgs=imgs)
    Path("dashboard.html").write_text(html, encoding="utf-8")

    print(f"OK: {len(df)} alunos processados a partir de {caminho}")
    print(f"PNGs em {GRAFICOS_DIR}/ | dashboard.html atualizado")


if __name__ == "__main__":
    main()
