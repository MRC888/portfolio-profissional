"""Render the original discovery charts in portfolio colors.
Usage: python scripts/render_foods_panorama.py /path/to/Analises
Reads the saved SQL aggregates only; never edits the analysis source files.
"""
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter, MultipleLocator
import matplotlib.dates as mdates
import pandas as pd

source=Path(sys.argv[1]); out=Path(__file__).resolve().parents[1]/'foods-panorama';out.mkdir(exist_ok=True)
daily=pd.read_csv(source/'pedidos_por_dia.csv',parse_dates=['dia'])
monthly=pd.read_csv(source/'resumo_mensal.csv')
assert daily.pedidos.sum()==monthly.pedidos.sum()==352020
assert len(daily)==120 and len(monthly)==4
BG='#0d1317';TEXT='#c4d0d7';GRID='#27353e';CYAN='#58dcff';BLUE='#8fafff'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':14,'text.color':TEXT,'axes.labelcolor':TEXT,'xtick.color':TEXT,'ytick.color':TEXT,'svg.fonttype':'path','svg.hashsalt':'foods-discovery'})
months=['Jan','Fev','Mar','Abr']
def br(v,n=0):return f'{v:,.{n}f}'.replace(',','_').replace('.',',').replace('_','.')
def base():
 f,a=plt.subplots(figsize=(6,3.25));f.patch.set_facecolor(BG);a.set_facecolor(BG)
 a.set_axisbelow(True);a.grid(axis='y',color=GRID,linewidth=.6);a.tick_params(length=0,pad=8)
 for side in ['top','right','left']:a.spines[side].set_visible(False)
 a.spines['bottom'].set_color(GRID);return f,a
for kind in ['daily','week','volume','mom','gmv','aov']:
 f,a=base()
 if kind=='daily':
  a.plot(daily.dia,daily.pedidos,color=CYAN,lw=1.3,label='Pedidos')
  a.plot(daily.dia,daily.pedidos.rolling(7).mean(),color=BLUE,lw=2,label='Média de 7 dias')
  a.xaxis.set_major_locator(mdates.MonthLocator());a.xaxis.set_major_formatter(FuncFormatter(lambda v,p:months[mdates.num2date(v).month-1] if mdates.num2date(v).month<=4 else ''))
  a.yaxis.set_major_formatter(FuncFormatter(lambda v,p:br(v)))
  a.legend(frameon=False,loc='upper left',fontsize=12,labelcolor=TEXT)
 elif kind=='week':
  v=daily.groupby(daily.dia.dt.dayofweek).pedidos.mean().reindex(range(7));a.bar(['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],v,color=[BLUE]*4+[CYAN]*3,width=.62);a.set_ylim(0,v.max()*1.2)
  a.yaxis.set_major_formatter(FuncFormatter(lambda v,p:br(v)))
 else:
  v={'volume':monthly.pedidos,'mom':monthly.pedidos.pct_change()*100,'gmv':monthly.gmv/1e6,'aov':monthly.aov}[kind]
  bars=a.bar(months,v,color=[BLUE,BLUE,CYAN,BLUE],width=.55)
  a.set_xlim(-.6,3.6)
  if kind=='mom':
   a.set_ylim(-13,72);a.axhline(0,color=GRID);a.text(0,6,'Sem mês\nanterior',ha='center',fontsize=12,color=TEXT)
  else:a.set_ylim(0,max(v)*1.27)
  for bar,value in zip(bars,v):
   if pd.isna(value):continue
   label=br(value,0 if kind=='volume' else 2)+(' mi' if kind=='gmv' else '%' if kind=='mom' else '')
   if kind=='mom' and value>0:label='+'+label
   a.annotate(label,(bar.get_x()+bar.get_width()/2,value),xytext=(0,7 if value>=0 else -7),textcoords='offset points',ha='center',va='bottom' if value>=0 else 'top',fontsize=13,color='#f6f9fa',weight='bold')
  a.yaxis.set_major_formatter(FuncFormatter(lambda v,p:br(v)))
  if kind=='gmv':a.yaxis.set_major_locator(MultipleLocator(3))
 f.tight_layout(pad=1.2);f.savefig(out/f'{kind}.svg',facecolor=BG,metadata={'Date':None});plt.close(f)
