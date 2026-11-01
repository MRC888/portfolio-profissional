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

  /* ---------- Projetos resumidos: o detalhe fica em "ver mais" ---------- */
  document.querySelectorAll('.pj-more').forEach(more => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'more-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', more.id);
    btn.innerHTML = `<span class="more-text"><span data-pt="Ver mais sobre o projeto" data-en="See more about the project"></span><small data-pt="${more.dataset.morePt}" data-en="${more.dataset.moreEn}"></small></span><span class="pm" aria-hidden="true">+</span>`;
    btn.querySelectorAll('[data-pt]').forEach(s => { s.textContent = s.dataset[isEn() ? 'en' : 'pt']; });
    const body = document.createElement('div');
    body.className = 'more-body';
    more.before(btn, body);
    body.append(more);
    more.inert = true;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('[data-pt]').dataset.pt = open ? 'Ver menos' : 'Ver mais sobre o projeto';
      btn.querySelector('[data-pt]').dataset.en = open ? 'See less' : 'See more about the project';
      btn.querySelector('[data-pt]').textContent = btn.querySelector('[data-pt]').dataset[isEn() ? 'en' : 'pt'];
      body.classList.toggle('open', open);
      more.inert = !open;
      if (open) more.querySelectorAll('.motion-item,.kinetic-heading,.assemble-child').forEach(el => el.classList.add('is-visible', 'is-assembled'));
      else btn.closest('.pj').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
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
    const host = document.getElementById('next-more');
    if (!host || !DATA) return;
    const c = DATA.cvm;
    const box = document.createElement('div');
    box.className = 'lab';
    box.id = 'lab-next';
    host.prepend(box);
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

  function barcaLab() {
    const host = document.getElementById('lab-barca-slot');
    if (!host || !DATA || !DATA.barca) return;
    const b = DATA.barca;
    const box = document.createElement('div');
    box.className = 'lab';
    box.id = 'lab-barca';
    host.append(box);
    let current = 'possession';
    const metrics = {
      possession: { label: () => t('Posse de bola', 'Possession'), own: b.possession, ref: b.spainPossession, lo: 40, hi: 72, ticks: [45, 55, 65], f: v => fmt(v, 1) + '%', gap: v => fmt(v, 1) + ' p.p.' },
      passes: { label: () => t('Passes por jogo', 'Passes per game'), own: b.passes, ref: b.spainPasses, lo: 300, hi: 720, ticks: [400, 500, 600, 700], f: v => fmt(v), gap: v => fmt(v) },
    };
    const L = 44, R = 16, T = 18, B = 34;
    let W = 680, H = 280;
    const x = i => L + (i / (b.seasons.length - 1)) * (W - L - R);
    function render() {
      box.innerHTML = `<div class="lab-head"><div><span class="label">${t('INTERATIVO · 16 TEMPORADAS', 'INTERACTIVE · 16 SEASONS')}</span>
        <h4>${t('O Barcelona fora da curva da própria liga', 'Barcelona off the curve of its own league')}</h4></div></div>
        <div class="chart line-chart"></div>
        <div class="legend"><span><i class="k-own"></i>Barcelona</span><span><i class="k-ref"></i>${t('Média da liga espanhola', 'Spanish league average')}</span><span><i class="k-era"></i>${t('Era Guardiola', 'Guardiola era')}</span></div>
        <p class="lab-insight"></p>
        <p class="lab-note">${t('Passe o mouse ou toque nas temporadas. Posse e passes são aproximações exploratórias construídas no projeto para comparação histórica, não estatísticas oficiais (ver metodologia no GitHub).', 'Hover or tap the seasons. Possession and passes are exploratory approximations built in the project for historical comparison, not official statistics (see methodology on GitHub).')}</p>`;
      box.querySelector('.lab-head').append(seg(Object.keys(metrics).map(id => ({ id, label: metrics[id].label })), current, id => { current = id; draw(); }));
      draw();
    }
    function draw() {
      const m = metrics[current];
      const y = v => T + (1 - (v - m.lo) / (m.hi - m.lo)) * (H - T - B);
      const path = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
      const [g0, g1] = b.guardiola;
      const el = box.querySelector('.line-chart');
      [W, H] = el.clientWidth < 520 ? [400, 300] : [680, 280]; // no celular, menos largura = rótulos legíveis
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${b.seasons.map((s, i) => `${s}: Barcelona ${m.f(m.own[i])}, ${t('liga', 'league')} ${m.f(m.ref[i])}`).join('; ')}">
        <rect x="${x(g0) - 10}" y="${T}" width="${x(g1) - x(g0) + 20}" height="${H - T - B}" rx="8" fill="rgba(88,220,255,.07)"></rect>
        ${m.ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.06)"></line><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" class="muted">${fmt(v)}</text>`).join('')}
        ${b.seasons.map((s, i) => (i % (W < 500 ? 5 : 3) === 0 || i === b.seasons.length - 1) ? `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" font-size="11" class="muted">${s}</text>` : '').join('')}
        <path d="${path(m.ref)}" fill="none" stroke="rgba(165,185,255,.7)" stroke-width="2" stroke-dasharray="5 5"></path>
        <path class="draw" d="${path(m.own)}" fill="none" stroke="#58dcff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></path>
        <g class="hover" opacity="0"><line y1="${T}" y2="${H - B}" stroke="rgba(255,255,255,.25)"></line><circle r="5" fill="#58dcff"></circle><circle r="4" fill="#a5b9ff"></circle>
          <g class="tip"><rect rx="8" width="170" height="54" fill="#0b1114" stroke="rgba(88,220,255,.35)"></rect><text class="t1" x="10" y="21" font-size="12" font-weight="700"></text><text class="t2" x="10" y="41" font-size="12"></text></g></g></svg>`;
      const svg = el.querySelector('svg'), hover = svg.querySelector('.hover'), line = svg.querySelector('.draw');
      if (!reduce) {
        const len = line.getTotalLength();
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        line.getBoundingClientRect();
        line.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)';
        line.style.strokeDashoffset = 0;
      }
      const show = clientX => {
        const r = svg.getBoundingClientRect();
        const sx = (clientX - r.left) * (W / r.width);
        const i = Math.max(0, Math.min(b.seasons.length - 1, Math.round(((sx - L) / (W - L - R)) * (b.seasons.length - 1))));
        const cx = x(i), [c1, c2] = hover.querySelectorAll('circle'), guide = hover.querySelector('line'), tip = hover.querySelector('.tip');
        hover.setAttribute('opacity', '1');
        guide.setAttribute('x1', cx); guide.setAttribute('x2', cx);
        c1.setAttribute('cx', cx); c1.setAttribute('cy', y(m.own[i]));
        c2.setAttribute('cx', cx); c2.setAttribute('cy', y(m.ref[i]));
        tip.setAttribute('transform', `translate(${Math.min(cx + 12, W - R - 170)},${T + 6})`);
        tip.querySelector('.t1').textContent = `20${b.seasons[i]} · Barcelona ${m.f(m.own[i])}`;
        tip.querySelector('.t2').textContent = `${t('Liga', 'League')} ${m.f(m.ref[i])} · +${m.gap(m.own[i] - m.ref[i])}`;
      };
      svg.addEventListener('pointermove', e => show(e.clientX));
      svg.addEventListener('pointerdown', e => show(e.clientX));
      svg.addEventListener('pointerleave', () => hover.setAttribute('opacity', '0'));
      const peak = m.own.indexOf(Math.max(...m.own));
      box.querySelector('.lab-insight').innerHTML = t(
        `Pico em <b>20${b.seasons[peak]}</b>: ${m.f(m.own[peak])}, <b>${m.gap(m.own[peak] - m.ref[peak])}</b> acima da média da liga. A faixa destacada é a era Guardiola.`,
        `Peak in <b>20${b.seasons[peak]}</b>: ${m.f(m.own[peak])}, <b>${m.gap(m.own[peak] - m.ref[peak])}</b> above the league average. The highlighted band is the Guardiola era.`);
    }
    render();
    // A linha se desenha quando o gráfico entra na tela, não no carregamento.
    const seen = new IntersectionObserver(([e]) => { if (e.isIntersecting) { draw(); seen.disconnect(); } }, { threshold: 0.4 });
    seen.observe(box);
    document.getElementById('lang')?.addEventListener('click', () => setTimeout(render, 0));
  }

  nextLab();
  foodsLab();
  barcaLab();
})();
