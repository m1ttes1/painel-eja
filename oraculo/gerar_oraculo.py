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
