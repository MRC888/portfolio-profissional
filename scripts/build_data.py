"""Gera assets/data.js com os dados reais dos gráficos interativos do site.

CVM: resultados do Next Step SP (ml/resultados), passados como pasta no 1º argumento.
Foods & Goods: mesmos números de scripts/render_foods_chart.py.

Uso: python3 scripts/build_data.py "<pasta do Next Step SP>"
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEXT_STEP = Path(sys.argv[1]) / "ml" / "resultados"

Z_RANGE = (-4.0, 12.0)
Z_BINS = 32
NAMES = {
    "z_altman": ("Z'' de Altman", "Altman Z''"),
    "patrimonio_negativo": ("Patrimônio negativo", "Negative equity"),
    "teve_prejuizo": ("Teve prejuízo", "Had a loss"),
    "regressao_logistica": ("Regressão logística", "Logistic regression"),
    "gradient_boosting": ("Gradient boosting", "Gradient boosting"),
}


def z_histogram(rows):
    lo, hi = Z_RANGE
    bins = [0] * Z_BINS
    values = [float(r["z_altman"]) for r in rows if r["z_altman"] not in ("", "nan")]
    for v in values:
        v = min(max(v, lo), hi - 1e-9)  # extremos ficam no primeiro e no último intervalo
        bins[int((v - lo) / (hi - lo) * Z_BINS)] += 1
    return len(values), bins


def main():
    rows = list(csv.DictReader(open(NEXT_STEP / "previsoes_walk_forward.csv", encoding="utf-8")))
    metrics = json.load(open(NEXT_STEP / "metricas.json", encoding="utf-8"))
    z_count, bins = z_histogram(rows)
    models = [
        {
            "id": key,
            "pt": NAMES[key][0],
            "en": NAMES[key][1],
            "auc": m["auc"],
            "precisao_media": m["precisao_media"],
            "recall_top10": m["recall_top10"],
            "ci": m["auc_ic95"],
        }
        for key, m in metrics["modelos"].items()
    ]
    data = {
        "cvm": {
            "rows": len(rows),
            "zCount": z_count,
            "cases": metrics["casos_reais"],
            "companies": metrics["empresas_com_evento"],
            "years": metrics["anos"],
            "baseRate": metrics["taxa_base"],
            "zRange": list(Z_RANGE),
            "zBins": bins,
            "chosen": metrics["modelo_escolhido"],
            "models": models,
        },
        "foods": {
            "states": ["RS", "SP", "PR", "RJ"],
            "distance": [3.77, 3.61, 3.31, 3.13],
            "costKm": [2.13, 2.21, 2.28, 2.60],
        },
        # barcelona.csv e espanha_media.csv do repositório barcelona-sports-analytics.
        # Posse e passes são aproximações exploratórias (ver FONTES_E_METODOLOGIA.md).
        "barca": {
            "seasons": ["04/05", "05/06", "06/07", "07/08", "08/09", "09/10", "10/11", "11/12",
                        "12/13", "13/14", "14/15", "15/16", "16/17", "17/18", "18/19", "19/20"],
            "guardiola": [4, 7],
            "possession": [58.4, 59.1, 60.2, 60, 65.3, 67.1, 68.2, 69, 68.1, 64.3, 62.4, 61.2, 60.4, 58.3, 57.6, 61.3],
            "passes": [470, 485, 498, 500, 610, 640, 670, 685, 670, 630, 590, 580, 575, 545, 535, 550],
            "spainPossession": [48, 48.2, 48.4, 48.7, 49.2, 49.8, 50.3, 50.5, 50.4, 50.1, 49.9, 49.7, 49.5, 49.2, 49, 48.8],
            "spainPasses": [360, 365, 370, 375, 385, 395, 405, 410, 415, 410, 405, 400, 395, 390, 388, 385],
        },
    }
    out = ROOT / "assets" / "data.js"
    out.write_text(
        "// Gerado por scripts/build_data.py. Não editar à mão.\n"
        "window.PORTFOLIO_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"{out.relative_to(ROOT)}: {len(rows)} linhas, {z_count} com Z''")


if __name__ == "__main__":
    main()
