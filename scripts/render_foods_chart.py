"""Render the portfolio chart from the values published in 01_logistica.ipynb.

Presentation only: values retain the notebook's published two-decimal precision.
Run with Python + Matplotlib. No database or private data is required.
"""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

ROOT = Path(__file__).resolve().parents[1]
STATES = ['RS', 'SP', 'PR', 'RJ']
COLORS = ['#58dcff', '#4baff5', '#7b99f2', '#a5b9ff']
BACKGROUND, TEXT, MUTED, GRID = '#0d1317', '#f6f9fa', '#a5b4bd', '#26343d'
PANELS = [
    ([3.77, 3.61, 3.31, 3.13], 'Distância média por entrega', 'Quilômetros (km)', ' km'),
    ([2.13, 2.21, 2.28, 2.60], 'Custo registrado por km', 'Reais por quilômetro (R$/km)', ' R$/km'),
]
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 11,
                     'text.color': TEXT, 'axes.labelcolor': MUTED,
                     'xtick.color': MUTED, 'ytick.color': TEXT,
                     'svg.fonttype': 'path', 'svg.hashsalt': 'foods-goods-portfolio'})

def render(mobile=False):
    fig, axes = plt.subplots(2 if mobile else 1, 1 if mobile else 2,
                             figsize=(7, 11) if mobile else (13, 5.8))
    fig.patch.set_facecolor(BACKGROUND)
    for ax, (values, title, unit, suffix) in zip(axes, PANELS):
        ax.set_facecolor(BACKGROUND)
        bars = ax.barh(STATES, values, color=COLORS, height=.55)
        ax.invert_yaxis()
        ax.set_xlim(0, max(values) * 1.36)
        for bar, value in zip(bars, values):
            ax.text(value + max(values) * .025, bar.get_y() + bar.get_height()/2,
                    f'{value:.2f}'.replace('.', ',') + suffix,
                    va='center', fontsize=11, fontweight='bold', color=TEXT)
        ax.set_title(title, loc='left', fontsize=14, fontweight='bold', pad=18, color=TEXT)
        ax.set_xlabel(unit, labelpad=12)
        ax.xaxis.set_major_formatter(FuncFormatter(lambda x, pos: f'{x:.1f}'.replace('.', ',')))
        ax.set_axisbelow(True)
        ax.grid(axis='x', color=GRID, linewidth=.7)
        ax.tick_params(axis='both', length=0)
        for side in ['top', 'right', 'left']:
            ax.spines[side].set_visible(False)
        ax.spines['bottom'].set_color(GRID)
    fig.suptitle('Entregas de moto | distância e custo', x=.065, y=.98,
                 ha='left', fontsize=17 if mobile else 21, fontweight='bold', color=TEXT)
    fig.text(.065, .94 if mobile else .90, 'Estados do hub de origem • janeiro a abril de 2021',
             fontsize=10 if mobile else 11, color=MUTED)
    if mobile:
        fig.text(.065, .07, 'Mesmos estados e cores. Escalas e unidades distintas:\ncompare os estados dentro de cada indicador.', fontsize=9, color=MUTED)
        fig.text(.065, .02, 'Fonte: Delivery Center / Kaggle • Amostras distintas;\nveja cobertura na tabela. Extremos mantidos.\nCusto registrado não comprova pagamento ao entregador.', fontsize=9, color=MUTED)
        fig.tight_layout(rect=[.02,.11,.99,.92], h_pad=3.5)
    else:
        fig.text(.065, .09, 'Mesmos estados e cores. Escalas e unidades distintas: compare os estados dentro de cada indicador.', fontsize=10, color=MUTED)
        fig.text(.065, .045, 'Fonte: Delivery Center / Kaggle • Amostras distintas; veja cobertura na tabela. Extremos mantidos.\nCusto registrado não comprova pagamento ao entregador.', fontsize=9, color=MUTED)
        fig.tight_layout(rect=[.02,.16,.99,.86], w_pad=3)
    name = 'foods-and-goods-mobile.svg' if mobile else 'foods-and-goods.svg'
    fig.savefig(ROOT / name, facecolor=BACKGROUND, metadata={'Date': None})
    plt.close(fig)

if __name__ == '__main__':
    render()
    render(mobile=True)
