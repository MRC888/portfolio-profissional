/* Portfólio v2: abertura com partículas (dados reais da CVM), contadores,
   cards com profundidade, cases expansíveis e gráficos interativos. */
(() => {
  const DATA = window.PORTFOLIO_DATA;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const isEn = () => document.documentElement.lang === 'en';
  const t = (pt, en) => (isEn() ? en : pt);
  const fmt = (n, d = 0) => n.toLocaleString(isEn() ? 'en-US' : 'pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- Entrada da abertura ---------- */
  const hero = document.querySelector('.hero2');
  if (hero) requestAnimationFrame(() => setTimeout(() => hero.classList.add('is-in'), 60));

  /* ---------- Partículas: distribuição do Z'' de Altman ---------- */
  function particles() {
    const canvas = hero && hero.querySelector('.hero2-canvas');
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx || !DATA) return;

    const { zBins, zRange } = DATA.cvm;
    const bins = zBins.slice(1, -1); // sem os intervalos que acumulam os extremos
    const [zLo, zHi] = zRange;
    const step = (zHi - zLo) / zBins.length;
    const binStart = i => zLo + (i + 1) * step;
    // Zonas do Z'' (Altman): < 1,1 risco; 1,1–2,6 cinza; > 2,6 segura.
    const zoneOf = z => (z < 1.1 ? 0 : z < 2.6 ? 1 : 2);
    const COLORS = ['255,122,138', '165,185,255', '88,220,255'];

    let w = 0, h = 0, dpr = 1, dots = [], frame = 0, visible = true, start = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    function layout() {
      const mobile = w < 820;
      const n = mobile ? 620 : 1500;
      const total = bins.reduce((a, b) => a + b, 0);
      const counts = bins.map(c => Math.max(1, Math.round((c / total) * n)));
      const area = mobile
        ? { x: w * 0.05, y: h - 262, w: w * 0.9, h: 140 }
        : { x: w * 0.54, y: h * 0.16, w: w * 0.42, h: h * 0.5 };
      const colW = area.w / bins.length;
      const perRow = mobile ? 2 : 3;
      const rows = Math.ceil(Math.max(...counts) / perRow);
      const gap = Math.min(colW / perRow, area.h / rows);
      const r = Math.max(1, gap * 0.36);
      const base = area.y + area.h;
      const next = [];
      counts.forEach((c, b) => {
        const zone = zoneOf(binStart(b) + step / 2);
        for (let k = 0; k < c; k++) {
          const tx = area.x + b * colW + (k % perRow + 0.5) * (colW / perRow);
          const ty = base - (Math.floor(k / perRow) + 0.5) * gap;
          const old = dots[next.length];
          next.push({
            x: old ? old.x : Math.random() * w,
            y: old ? old.y : Math.random() * h,
            vx: 0, vy: 0, tx, ty, r, zone,
            delay: 250 + b * 38 + Math.random() * 240,
          });
        }
      });
      dots = next;
      layout.area = area;
      layout.zones = [1.1, 2.6].map(z => area.x + ((z - binStart(0)) / (step * bins.length)) * area.w);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout();
      if (reduce) { dots.forEach(d => { d.x = d.tx; d.y = d.ty; }); draw(0); }
    }

    function drawAxis(alpha) {
      const { area, zones } = layout;
      const base = area.y + area.h + 10;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(255,255,255,.14)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(area.x, base); ctx.lineTo(area.x + area.w, base); ctx.stroke();
      ctx.setLineDash([3, 4]);
      zones.forEach(x => { ctx.beginPath(); ctx.moveTo(x, area.y); ctx.lineTo(x, base); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      const labels = [t('RISCO', 'DISTRESS'), t('ZONA CINZA', 'GREY ZONE'), t('SEGURA', 'SAFE')];
      const edges = [area.x, zones[0], zones[1], area.x + area.w];
      labels.forEach((label, i) => {
        ctx.fillStyle = `rgba(${COLORS[i]},.8)`;
        const mid = (edges[i] + edges[i + 1]) / 2;
        ctx.textAlign = 'center';
        ctx.fillText(label, Math.max(edges[i] + 18, mid), base + 8);
      });
      ctx.globalAlpha = 1;
    }

    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      const elapsed = reduce ? 1e9 : now - start;
      let settled = 0;
      for (const d of dots) {
        if (!reduce && elapsed > d.delay) {
          let fx = (d.tx - d.x) * 0.045, fy = (d.ty - d.y) * 0.045;
          if (mouse.active) {
            const dx = d.x - mouse.x, dy = d.y - mouse.y, dist = Math.hypot(dx, dy);
            if (dist < 110) { const f = (1 - dist / 110) * 6; fx += (dx / (dist || 1)) * f; fy += (dy / (dist || 1)) * f; }
          }
          d.vx = (d.vx + fx) * 0.82; d.vy = (d.vy + fy) * 0.82;
          d.x += d.vx; d.y += d.vy;
        } else if (!reduce) {
          d.x += Math.sin(now * 0.001 + d.delay) * 0.3; d.y += Math.cos(now * 0.0012 + d.delay) * 0.3;
        }
        if (Math.abs(d.tx - d.x) < 1 && Math.abs(d.ty - d.y) < 1) settled++;
        const moving = Math.min(1, Math.hypot(d.vx, d.vy) / 4);
        ctx.fillStyle = `rgba(${COLORS[d.zone]},${0.55 + moving * 0.45})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
      }
      drawAxis(Math.min(1, settled / dots.length * 1.4));
    }

    function loop(now) {
      frame = 0;
      if (!visible || document.hidden) return;
      draw(now);
      frame = requestAnimationFrame(loop);
    }
    const run = () => { if (!reduce && !frame && visible && !document.hidden) frame = requestAnimationFrame(loop); };

    function scatter() {
      dots.forEach(d => {
        const a = Math.random() * 6.283, s = 8 + Math.random() * 22;
        d.vx = Math.cos(a) * s; d.vy = Math.sin(a) * s; d.delay = 0;
      });
      start = performance.now() - 1e4;
    }

    new ResizeObserver(resize).observe(canvas);
    resize();
    start = performance.now();
    if (reduce) return;
    run();

    hero.addEventListener('pointermove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top; mouse.active = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.active = false; });
    canvas.addEventListener('click', scatter);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? run() : (cancelAnimationFrame(frame), frame = 0); }).observe(hero);
    document.addEventListener('visibilitychange', run);
    document.getElementById('lang')?.addEventListener('click', () => setTimeout(() => draw(performance.now()), 0));
  }
  particles();

  /* ---------- Contadores ---------- */
  const suffixOf = el => (isEn() && el.dataset.suffixEn) || el.dataset.suffix || '';
  function countUp(el) {
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0);
    const suffix = suffixOf(el);
    const paint = v => { el.textContent = fmt(v, dec) + suffix; };
    if (reduce) return paint(to);
    const t0 = performance.now(), dur = 1400;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      paint(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll('[data-to]');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); }
  }), { threshold: 0.6 });
  counters.forEach(el => io.observe(el));
  document.getElementById('lang')?.addEventListener('click', () => setTimeout(() => counters.forEach(el => {
    el.textContent = fmt(parseFloat(el.dataset.to), +(el.dataset.dec || 0)) + suffixOf(el);
  }), 0));

  /* ---------- Cards com profundidade e botões magnéticos ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.pcard').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', `${(px - 0.5) * 12}deg`);
        card.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
    document.querySelectorAll('.stat').forEach(s => s.addEventListener('pointermove', e => {
      const r = s.getBoundingClientRect();
      s.style.setProperty('--sx', `${((e.clientX - r.left) / r.width) * 100}%`);
    }));
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Cases expansíveis: a página fica curta, o detalhe continua lá ---------- */
  const grouped = new Set();
  let groupId = 0;
  document.querySelectorAll('.case, .foods-stage:not(.foods-question)').forEach(first => {
    if (grouped.has(first)) return;
    const items = [first];
    let sib = first.nextElementSibling;
    const same = el => el && el.matches(first.matches('.case') ? '.case' : '.foods-stage:not(.foods-question)');
    while (same(sib)) { items.push(sib); sib = sib.nextElementSibling; }
    items.forEach(el => grouped.add(el));
    const isProcess = first.matches('.foods-stage');
    const id = `more-${++groupId}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'more-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    btn.innerHTML = isProcess
      ? '<span><span data-pt="Ver exploração e preparação dos dados" data-en="See data exploration and preparation"></span><br><small data-pt="Panorama, validação e regras dos indicadores" data-en="Overview, validation and metric rules"></small></span><span class="pm" aria-hidden="true">+</span>'
      : '<span><span data-pt="Ver o case completo" data-en="See the full case"></span><br><small data-pt="Processo, evidências e limites da análise" data-en="Process, evidence and limits of the analysis"></small></span><span class="pm" aria-hidden="true">+</span>';
    btn.querySelectorAll('[data-pt]').forEach(s => { s.textContent = s.dataset[isEn() ? 'en' : 'pt']; });
    const body = document.createElement('div');
    body.className = 'more-body';
    body.id = id;
    const inner = document.createElement('div');
    body.append(inner);
    first.before(btn, body);
    items.forEach(el => inner.append(el));
    inner.inert = true;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      body.classList.toggle('open', open);
      inner.inert = !open;
      if (open) inner.querySelectorAll('.motion-item,.kinetic-heading').forEach(el => el.classList.add('is-visible', 'is-assembled'));
    });
  });

  /* ---------- Gráficos interativos (SVG, sem bibliotecas) ---------- */
  function seg(options, current, onPick) {
    const wrap = document.createElement('div');
    wrap.className = 'seg';
    wrap.setAttribute('role', 'group');
    options.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.label();
      b.setAttribute('aria-pressed', String(o.id === current));
      b.addEventListener('click', () => {
        wrap.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        onPick(o.id);
      });
      wrap.append(b);
    });
    return wrap;
  }

  function barChart(el, rows, { max, format, highlight }) {
    const W = 640, rowH = 46, left = 170, right = 70, H = rows.length * rowH + 8;
    const scale = v => (v / max) * (W - left - right);
    const ns = 'http://www.w3.org/2000/svg';
    let svg = el.querySelector('svg');
    const first = !svg;
    if (first) {
      svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('role', 'img');
      el.append(svg);
    }
    svg.setAttribute('aria-label', rows.map(r => `${r.label}: ${r.value == null ? 'n/d' : format(r.value)}`).join('; '));
    rows.forEach((r, i) => {
      let g = svg.children[i];
      if (!g) {
        g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'row');
        g.innerHTML = `<rect x="${left}" y="${i * rowH + 10}" height="22" rx="6" fill="rgba(255,255,255,.04)" width="${W - left - right}"></rect>
          <rect class="bar" x="${left}" y="${i * rowH + 10}" height="22" rx="6" width="0"></rect>
          <line class="ci" stroke="#dbe5e8" stroke-width="1.5" opacity="0"></line>
          <text class="lbl" x="${left - 14}" y="${i * rowH + 26}" text-anchor="end" font-size="14"></text>
          <text class="val" y="${i * rowH + 26}" font-size="14"></text>`;
        svg.append(g);
      }
      const bar = g.querySelector('.bar'), val = g.querySelector('.val'), ci = g.querySelector('.ci');
      const has = r.value != null;
      const width = has ? Math.max(2, scale(r.value)) : 0;
      bar.setAttribute('fill', r.id === highlight ? '#58dcff' : 'rgba(165,185,255,.55)');
      g.querySelector('.lbl').textContent = r.label;
      g.querySelector('.lbl').setAttribute('fill', r.id === highlight ? '#ffffff' : '#c9d4d8');
      val.textContent = has ? format(r.value) : 'n/d';
      val.setAttribute('class', has ? 'val' : 'val muted');
      const place = () => {
        bar.setAttribute('width', width);
        val.setAttribute('x', left + width + 10);
        if (r.ci) {
          const y = i * rowH + 21;
          ci.setAttribute('x1', left + scale(r.ci[0])); ci.setAttribute('x2', left + scale(r.ci[1]));
          ci.setAttribute('y1', y); ci.setAttribute('y2', y); ci.setAttribute('opacity', '.7');
          val.setAttribute('x', left + Math.max(width, scale(r.ci[1])) + 10);
        } else ci.setAttribute('opacity', '0');
      };
      first && !reduce ? requestAnimationFrame(() => requestAnimationFrame(place)) : place();
    });
  }

  function nextLab() {
    const anchor = document.querySelector('.next-dashboard');
    if (!anchor || !DATA) return;
    const c = DATA.cvm;
    const box = document.createElement('div');
    box.className = 'lab';
    box.id = 'lab-next';
    anchor.after(box);
    const metrics = [
      { id: 'auc', label: () => 'AUC', max: 1, f: v => fmt(v, 3), ci: true,
        note: () => t('AUC: chance de o modelo dar nota maior a um caso real do que a um caso comum (0,5 = sorteio). Traço = intervalo de 95%.', 'AUC: chance that the model scores a real case above an ordinary one (0.5 = coin flip). Line = 95% interval.') },
      { id: 'precisao_media', label: () => t('Precisão média', 'Average precision'), max: 0.07, f: v => fmt(v * 100, 1) + '%',
        note: () => t(`Precisão média: métrica certa para casos raros. Referência do acaso = taxa base de ${fmt(c.baseRate * 100, 2)}%.`, `Average precision: the right metric for rare cases. Chance baseline = base rate of ${fmt(c.baseRate * 100, 2)}%.`) },
      { id: 'recall_top10', label: () => t('Recall no top 10%', 'Recall in top 10%'), max: 0.4, f: v => fmt(v * 100, 1) + '%',
        note: () => t('Recall no top 10%: dos casos reais, quantos ficaram entre os 10% com nota mais alta. Regras de sim/não não geram ranking (n/d).', 'Recall in top 10%: share of real cases ranked in the top 10% of scores. Yes/no rules produce no ranking (n/a).') },
    ];
    let current = 'precisao_media';
    function render() {
      box.innerHTML = `<div class="lab-head"><div><span class="label">${t('LABORATÓRIO · DADOS REAIS DO PROJETO', 'LAB · REAL PROJECT DATA')}</span>
        <h4>${t('O modelo de risco contra as regras simples', 'The risk model against simple rules')}</h4></div></div>
        <div class="chart" aria-live="polite"></div>
        <p class="lab-insight"></p>
        <p class="lab-note"></p>`;
      const head = box.querySelector('.lab-head');
      head.append(seg(metrics.map(x => ({ id: x.id, label: x.label })), current, id => { current = id; update(); }));
      update();
    }
    function update() {
      const m = metrics.find(x => x.id === current);
      const rows = c.models.map(x => ({ id: x.id, label: isEn() ? x.en : x.pt, value: x[current], ci: m.ci ? x.ci : null }));
      barChart(box.querySelector('.chart'), rows, { max: m.max, format: m.f, highlight: c.chosen });
      const gb = c.models.find(x => x.id === c.chosen), z = c.models.find(x => x.id === 'z_altman');
      box.querySelector('.lab-insight').innerHTML = t(
        `O <b>gradient boosting</b> teve precisão média de <b>${fmt(gb.precisao_media * 100, 1)}%</b>, cerca de <b>${fmt(gb.precisao_media / z.precisao_media, 1)}×</b> o Z'' de Altman e <b>${fmt(gb.precisao_media / c.baseRate, 1)}×</b> o acaso.`,
        `<b>Gradient boosting</b> reached <b>${fmt(gb.precisao_media * 100, 1)}%</b> average precision, about <b>${fmt(gb.precisao_media / z.precisao_media, 1)}×</b> Altman's Z'' and <b>${fmt(gb.precisao_media / c.baseRate, 1)}×</b> chance.`);
      box.querySelector('.lab-note').textContent = `${m.note()} ${t(
        `Validação walk-forward ${c.years[0]}–${c.years[1]}: ${fmt(c.cases)} casos reais em ${fmt(c.rows)} balanços. Estudo exploratório: não é probabilidade calibrada nem recomendação de investimento.`,
        `Walk-forward validation ${c.years[0]}–${c.years[1]}: ${fmt(c.cases)} real cases in ${fmt(c.rows)} filings. Exploratory study: not a calibrated probability nor investment advice.`)}`;
    }
    render();
    document.getElementById('lang')?.addEventListener('click', () => setTimeout(render, 0));
  }

  function foodsLab() {
    const host = document.querySelector('.foods-chart');
    if (!host || !DATA) return;
    const f = DATA.foods;
    const img = host.querySelector('img');
    document.documentElement.classList.add('js-charts');
    const box = document.createElement('div');
    box.className = 'lab';
    box.id = 'lab-foods';
    if (img) (img.closest('a') || img).before(box);
    else host.prepend(box);
    let current = 'distance';
    const metrics = {
      distance: { label: () => t('Distância média', 'Average distance'), max: 4.2, f: v => fmt(v, 2) + ' km' },
      costKm: { label: () => t('Custo por km', 'Cost per km'), max: 2.9, f: v => 'R$ ' + fmt(v, 2) },
    };
    function render() {
      box.innerHTML = `<div class="lab-head"><div><span class="label">${t('INTERATIVO · ENTREGAS DE MOTO, JAN–ABR 2021', 'INTERACTIVE · MOTORBIKE DELIVERIES, JAN–APR 2021')}</span>
        <h4>${t('Mais distância, menor custo por km?', 'Longer distance, lower cost per km?')}</h4></div></div>
        <div class="chart" aria-live="polite"></div><p class="lab-insight"></p>
        <p class="lab-note">${t('Estado do hub de origem. Leitura descritiva: custo registrado não comprova pagamento ao entregador, e as amostras diferem. Fonte: Delivery Center / Kaggle.', 'State of the origin hub. Descriptive reading: recorded cost does not prove courier pay, and samples differ. Source: Delivery Center / Kaggle.')}</p>`;
      box.querySelector('.lab-head').append(seg(Object.keys(metrics).map(id => ({ id, label: metrics[id].label })), current, id => { current = id; update(); }));
      update();
    }
    function update() {
      const m = metrics[current];
      const values = f[current];
      const top = values.indexOf(Math.max(...values));
      barChart(box.querySelector('.chart'), f.states.map((s, i) => ({ id: s, label: s, value: values[i] })), { max: m.max, format: m.f, highlight: f.states[top] });
      box.querySelector('.lab-insight').innerHTML = current === 'distance'
        ? t('O <b>RS</b> tem a maior distância média (3,77 km)…', '<b>RS</b> has the longest average distance (3.77 km)…') + ' ' + t('troque para <b>custo por km</b> e veja a ordem se inverter.', 'switch to <b>cost per km</b> and watch the order flip.')
        : t('…e o <b>menor</b> custo por km (R$ 2,13). No <b>RJ</b>, o padrão é o oposto: 3,13 km e R$ 2,60/km.', '…and the <b>lowest</b> cost per km (R$ 2.13). In <b>RJ</b> the pattern is reversed: 3.13 km and R$ 2.60/km.');
    }
    render();
    document.getElementById('lang')?.addEventListener('click', () => setTimeout(render, 0));
  }

  nextLab();
  foodsLab();
})();
