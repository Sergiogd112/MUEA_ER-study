/* Interactive widgets. Each <div class="widget" data-widget="name"> is initialised by WIDGETS[name](div). */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const C = () => ({ ink: css('--ink'), ink2: css('--ink2'), muted: css('--muted'), line: css('--line'), grid: css('--grid'),
    accent: css('--accent'), ten: css('--tension'), comp: css('--compression'), neu: css('--neutral'), surface: css('--surface'),
    ok: css('--ok'), bad: css('--bad'), warn: css('--warn') });

  function h(tag, attrs, parent, text) {
    const e = tag.startsWith('svg:') ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
    for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  const s = (tag, attrs, parent, text) => h('svg:' + tag, attrs, parent, text);
  const fmt = (v, d = 2) => {
    if (!isFinite(v)) return '∞';
    const a = Math.abs(v);
    let str = (a !== 0 && (a < 1e-3 || a >= 1e6)) ? v.toExponential(d) : v.toFixed(d);
    return str.replace('-', '−');
  };
  const fmtEs = (v, d = 2) => fmt(v, d).replace('.', ',');

  /* controls: sliders and selects bound to a state object */
  function controls(parent, defs, state, onchange) {
    const box = h('div', { class: 'wctrl' }, parent);
    defs.forEach(d => {
      const lab = h('label', {}, box);
      const top = h('span', {}, lab, d.label + ' ');
      if (d.type === 'select') {
        const sel = h('select', {}, lab);
        d.options.forEach(([v, t]) => { const o = h('option', { value: v }, sel, t); if (String(state[d.key]) === String(v)) o.selected = true; });
        sel.addEventListener('change', () => { state[d.key] = d.num ? +sel.value : sel.value; onchange(d.key); });
      } else if (d.type === 'check') {
        lab.style.flexDirection = 'row'; lab.style.alignItems = 'center'; lab.style.gap = '8px';
        const cb = h('input', { type: 'checkbox' }); lab.insertBefore(cb, top); cb.checked = !!state[d.key];
        cb.addEventListener('change', () => { state[d.key] = cb.checked; onchange(d.key); });
      } else {
        const v = h('span', { class: 'v' }, top);
        const inp = h('input', { type: 'range', min: d.min, max: d.max, step: d.step, value: state[d.key], 'aria-label': d.label }, lab);
        const upd = () => { v.textContent = (d.fmt ? d.fmt(state[d.key]) : state[d.key]) + (d.unit ? ' ' + d.unit : ''); };
        upd();
        inp.addEventListener('input', () => { state[d.key] = +inp.value; upd(); onchange(d.key); });
      }
    });
    return box;
  }

  /* Plot frame: returns {svg, X, Y} mapping data to pixels, draws axes, ticks and labels. */
  function frame(parent, o) {
    const W = o.w || 640, H = o.h || 300, m = Object.assign({ l: 58, r: 14, t: 16, b: 40 }, o.m || {});
    const svg = o.svg || s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wplot', role: 'img', 'aria-label': o.title || 'gráfica' }, parent);
    const c = C();
    const [x0, x1] = o.xr, [y0, y1] = o.yr;
    const lx = o.logx, ly = o.logy;
    const tx = v => lx ? Math.log10(v) : v, ty = v => ly ? Math.log10(v) : v;
    const X = v => m.l + (tx(v) - tx(x0)) / (tx(x1) - tx(x0)) * (W - m.l - m.r);
    const Y = v => H - m.b - (ty(v) - ty(y0)) / (ty(y1) - ty(y0)) * (H - m.t - m.b);
    const g = s('g', {}, svg);
    const ticks = (a, b, log) => {
      if (log) { const out = []; for (let e = Math.ceil(Math.log10(a) - 1e-9); e <= Math.floor(Math.log10(b) + 1e-9); e++) out.push(10 ** e); return out; }
      const span = b - a, step0 = span / 5, p = 10 ** Math.floor(Math.log10(step0)), mm = step0 / p;
      const step = (mm >= 5 ? 5 : mm >= 2 ? 2 : 1) * p; const out = [];
      for (let v = Math.ceil(a / step) * step; v <= b + 1e-9 * span; v += step) out.push(Math.abs(v) < 1e-12 * span ? 0 : v);
      return out;
    };
    ticks(x0, x1, lx).forEach(v => { s('line', { x1: X(v), x2: X(v), y1: m.t, y2: H - m.b, stroke: c.grid }, g);
      s('text', { x: X(v), y: H - m.b + 16, 'text-anchor': 'middle', 'font-size': 12, fill: c.ink2 }, g, lx ? pow10(v) : (o.xfmt || fmt)(v, o.xd ?? 1)); });
    ticks(y0, y1, ly).forEach(v => { s('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: c.grid }, g);
      s('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 12, fill: c.ink2 }, g, ly ? pow10(v) : (o.yfmt || fmt)(v, o.yd ?? 1)); });
    s('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'none', stroke: c.line }, g);
    if (o.xlabel) s('text', { x: (m.l + W - m.r) / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 13, fill: c.ink2 }, g, o.xlabel);
    if (o.ylabel) s('text', { x: 14, y: (m.t + H - m.b) / 2, 'text-anchor': 'middle', 'font-size': 13, fill: c.ink2, transform: `rotate(-90 14 ${(m.t + H - m.b) / 2})` }, g, o.ylabel);
    return { svg, X, Y, W, H, m };
  }
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow10 = v => { const e = Math.round(Math.log10(v)); return e === 0 ? '1' : e === 1 ? '10' : '10' + String(e).split('').map(ch => SUP[ch]).join(''); };
  const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
  /* diverging colour for a stress value relative to smax */
  function stressColor(v, smax) {
    const c = C(); if (!smax || Math.abs(v) < 1e-9 * smax) return c.neu;
    const f = Math.min(1, Math.abs(v) / smax);
    return `color-mix(in srgb, ${v > 0 ? c.ten : c.comp} ${Math.round(25 + 75 * f)}%, ${c.neu})`;
  }

  const WIDGETS = {};
  const narrow = el => (el.clientWidth || 640) < 520;

  /* ---------------- 1D chain of bars ---------------- */
  WIDGETS.chain = function (root) {
    const st = { n: 3, k1: 2, k2: 1, k3: 1, k4: 1, F: 10, right: 'free', loadAt: 'last' };
    const ctl = h('div', {}, root);
    const draw = h('div', {}, root), out = h('div', { class: 'wout' }, root);
    const defs = [
      { key: 'n', label: 'Número de barras', min: 2, max: 4, step: 1 },
      { key: 'k1', label: 'k₁', min: 0.5, max: 5, step: 0.5, unit: 'k' },
      { key: 'k2', label: 'k₂', min: 0.5, max: 5, step: 0.5, unit: 'k' },
      { key: 'k3', label: 'k₃', min: 0.5, max: 5, step: 0.5, unit: 'k' },
      { key: 'k4', label: 'k₄', min: 0.5, max: 5, step: 0.5, unit: 'k' },
      { key: 'F', label: 'Fuerza', min: -20, max: 20, step: 1, unit: 'kN' },
      { type: 'select', key: 'loadAt', label: 'Carga en', options: [['last', 'último nodo'], ['mid', 'nodo intermedio']] },
      { type: 'select', key: 'right', label: 'Extremo derecho', options: [['free', 'libre'], ['fixed', 'empotrado (hiperestático)']] }];
    controls(ctl, defs, st, render);
    const cols = ['#2a78d6', '#eb6834', '#1baf7a', '#7b52c9'];
    function render() {
      const n = st.n, nn = n + 1, k = [st.k1, st.k2, st.k3, st.k4].slice(0, n);
      const K = FEM.zeros(nn, nn), who = Array.from({ length: nn }, () => Array.from({ length: nn }, () => []));
      k.forEach((ki, e) => { [[e, e, 1], [e, e + 1, -1], [e + 1, e, -1], [e + 1, e + 1, 1]].forEach(([i, j, sg]) => { K[i][j] += sg * ki; who[i][j].push(e); }); });
      const F = new Array(nn).fill(0); const ln = st.loadAt === 'last' ? n : Math.ceil(n / 2);   // selected node, kept as chosen
      F[ln] = st.F;
      const R = st.right === 'fixed' ? [0, n] : [0]; const L = []; for (let i = 0; i < nn; i++) if (!R.includes(i)) L.push(i);
      const uL = FEM.solve(L.map(i => L.map(j => K[i][j])), L.map(i => F[i]));
      const u = new Array(nn).fill(0); L.forEach((i, a) => u[i] = uL[a]);
      const reac = R.map(r => K[r].reduce((acc, v, j) => acc + v * u[j], 0) - F[r]);
      const N = k.map((ki, e) => ki * (u[e + 1] - u[e]));
      // drawing
      draw.innerHTML = ''; const c = C();
      const W = narrow(root) ? 440 : 640, H = 120, svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wplot' }, draw);
      const x0 = 40, dx = (W - 150) / n, y = 60;
      s('rect', { x: x0 - 14, y: 25, width: 12, height: 70, fill: c.line }, svg);
      if (st.right === 'fixed') s('rect', { x: x0 + n * dx + 4, y: 25, width: 12, height: 70, fill: c.line }, svg);
      for (let e = 0; e < n; e++) {
        const a = x0 + e * dx, b = a + dx, pts = [[a, y]]; const z = 8;
        for (let i = 1; i < 2 * z; i++) pts.push([a + 12 + (b - a - 24) * i / (2 * z), y + (i % 2 ? -9 : 9)]);
        pts.push([b, y]);
        s('path', { d: `M${a} ${y} L${a + 12} ${y}` + path(pts.slice(1, -1)).replace('M', 'L') + ` L${b} ${y}`, fill: 'none', stroke: cols[e], 'stroke-width': 2.5 }, svg);
        s('text', { x: (a + b) / 2, y: y - 18, 'text-anchor': 'middle', 'font-size': 13, fill: cols[e] }, svg, `(${e + 1}) k=${k[e]}k`);
        s('text', { x: (a + b) / 2, y: y + 30, 'text-anchor': 'middle', 'font-size': 12, fill: c.ink2 }, svg, `N=${fmt(N[e], 2)} kN`);
      }
      for (let i = 0; i < nn; i++) { const xx = x0 + i * dx; s('circle', { cx: xx, cy: y, r: 6, fill: c.surface, stroke: c.ink, 'stroke-width': 2 }, svg);
        s('text', { x: xx, y: y + 50, 'text-anchor': 'middle', 'font-size': 12, fill: c.ink }, svg, `${i + 1}`); }
      if (st.F) { const xx = x0 + ln * dx, dir = Math.sign(st.F); s('path', { d: `M${xx} ${y - 30} l${dir * 30} 0 l${-dir * 7} -5 m${dir * 7} 5 l${-dir * 7} 5`, stroke: c.bad, 'stroke-width': 2.5, fill: 'none' }, svg);
        s('text', { x: xx + dir * 34, y: y - 26, 'font-size': 12, fill: c.bad, 'text-anchor': dir > 0 ? 'start' : 'end' }, svg, `F=${st.F} kN`); }
      // matrix
      let html = '<p>Matriz global $\\mathbf K$ (en unidades de $k$); el color indica qué elementos aportan a cada término:</p><div class="tablewrap"><table class="data" style="width:auto;text-align:center">';
      for (let i = 0; i < nn; i++) {
        html += '<tr>';
        for (let j = 0; j < nn; j++) {
          const w = who[i][j]; let bg = 'transparent';
          if (w.length === 1) bg = `color-mix(in srgb, ${cols[w[0]]} 22%, transparent)`;
          if (w.length > 1) bg = `linear-gradient(135deg, color-mix(in srgb, ${cols[w[0]]} 28%, transparent) 50%, color-mix(in srgb, ${cols[w[1]]} 28%, transparent) 50%)`;
          html += `<td class="num" style="background:${bg};min-width:46px">${fmt(K[i][j], 1)}</td>`;
        }
        html += `</tr>`;
      }
      html += '</table></div>';
      html += `<p>Grados de libertad prescritos: ${R.map(r => 'u' + (r + 1)).join(', ')} = 0. Desplazamientos (en kN/k): ${u.map((v, i) => `u<sub>${i + 1}</sub> = <span class="num">${fmt(v, 3)}</span>`).join(', ')}.<br>
      Reacciones: ${R.map((r, a) => `R<sub>${r + 1}</sub> = <span class="num">${fmt(reac[a], 2)}</span> kN`).join(', ')}. Equilibrio: ΣR + F = <span class="num">${fmt(reac.reduce((a, b) => a + b, 0) + st.F, 6)}</span>.</p>`;
      out.innerHTML = html; ERA.renderMath(out);
    }
    render();
  };

  /* ---------------- rotation matrix ---------------- */
  WIDGETS.rotation = function (root) {
    const st = { th: 30 }; const ctl = h('div', {}, root), box = h('div', { class: 'grid2' }, root);
    const left = h('div', {}, box), right = h('div', { class: 'wout' }, box);
    controls(ctl, [{ key: 'th', label: 'Ángulo θ de la barra', min: 0, max: 180, step: 5, unit: '°' }], st, render);
    function render() {
      const c = C(), t = st.th * Math.PI / 180, cs = Math.cos(t), sn = Math.sin(t);
      left.innerHTML = ''; const svg = s('svg', { viewBox: '0 0 300 240', class: 'wplot' }, left);
      const ox = 150, oy = 150, L = 110;
      s('line', { x1: 20, y1: oy, x2: 290, y2: oy, stroke: c.grid }, svg); s('line', { x1: ox, y1: 230, x2: ox, y2: 10, stroke: c.grid }, svg);
      s('text', { x: 282, y: oy - 6, 'font-size': 13, fill: c.muted }, svg, 'x'); s('text', { x: ox + 6, y: 20, 'font-size': 13, fill: c.muted }, svg, 'y');
      const x2 = ox + L * cs, y2 = oy - L * sn, x1 = ox - L * cs * 0.4, y1 = oy + L * sn * 0.4;
      s('line', { x1, y1, x2, y2, stroke: c.accent, 'stroke-width': 7, 'stroke-linecap': 'round' }, svg);
      s('circle', { cx: x1, cy: y1, r: 6, fill: c.surface, stroke: c.ink, 'stroke-width': 2 }, svg); s('circle', { cx: x2, cy: y2, r: 6, fill: c.surface, stroke: c.ink, 'stroke-width': 2 }, svg);
      s('text', { x: x1 - 16, y: y1 + 18, 'font-size': 13, fill: c.ink }, svg, '1'); s('text', { x: x2 + 8, y: y2 - 8, 'font-size': 13, fill: c.ink }, svg, '2');
      const ax = (dx, dy, lab) => { s('line', { x1: ox, y1: oy, x2: ox + 50 * dx, y2: oy - 50 * dy, stroke: c.bad, 'stroke-width': 2 }, svg); s('text', { x: ox + 58 * dx - 4, y: oy - 58 * dy + 4, 'font-size': 13, fill: c.bad }, svg, lab); };
      ax(cs, sn, "x'"); ax(-sn, cs, "y'");
      s('path', { d: `M${ox + 30} ${oy} A30 30 0 ${st.th > 180 ? 1 : 0} 0 ${ox + 30 * cs} ${oy - 30 * sn}`, fill: 'none', stroke: c.ink2 }, svg);
      s('text', { x: ox + 36, y: oy - 8, 'font-size': 12, fill: c.ink2 }, svg, 'θ');
      const v = [cs * cs, cs * sn, sn * sn].map(x => Math.abs(x) < 1e-12 ? 0 : x);
      const M = [[v[0], v[1], -v[0], -v[1]], [v[1], v[2], -v[1], -v[2]], [-v[0], -v[1], v[0], v[1]], [-v[1], -v[2], v[1], v[2]]];
      right.innerHTML = `<p>$c = \\cos\\theta = ${fmt(cs, 3)}$, $s = \\sin\\theta = ${fmt(sn, 3)}$</p>
        <p>$\\dfrac{\\mathbf K^e}{EA/l} = \\begin{bmatrix}${M.map(r => r.map(x => fmt(x, 3)).join('&')).join('\\\\')}\\end{bmatrix}$</p>
        <p>Filas 1-2: fuerzas en el nodo 1; filas 3-4: en el nodo 2. Cada bloque 2×2 es $\\pm\\mathbf n\\mathbf n^T$ con $\\mathbf n = (c, s)$.</p>`;
      ERA.renderMath(right);
    }
    render();
  };

  /* ---------------- 2D truss lab ---------------- */
  const TRUSSES = {
    tri: { name: 'Triángulo', nodes: [[0, 0], [4, 0], [2, 2]], bars: [[0, 1], [0, 2], [1, 2]],
      fix: [[0, 0], [0, 1], [1, 1]], extra: [1, 0], load: 2 },
    warren: { name: 'Viga Warren', nodes: [[0, 0], [2, 0], [4, 0], [6, 0], [1, 1.6], [3, 1.6], [5, 1.6]],
      bars: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [0, 4], [4, 1], [1, 5], [5, 2], [2, 6], [6, 3]],
      fix: [[0, 0], [0, 1], [3, 1]], extra: [3, 0], load: 5 },
    mensula: { name: 'Ménsula', nodes: [[0, 0], [0, 1.5], [1.5, 0], [1.5, 1.5], [3, 0], [3, 1.5], [4.5, 0.75]],
      bars: [[0, 2], [1, 3], [2, 3], [1, 2], [2, 4], [3, 5], [4, 5], [3, 4], [4, 6], [5, 6]],
      fix: [[0, 0], [0, 1], [1, 0], [1, 1]], extra: [6, 1], load: 6 }
  };
  WIDGETS.truss = function (root) {
    const st = { model: 'warren', P: 20, ang: -90, dT: 0, mat2: false, extra: false, amp: 100 };
    const ctl = h('div', {}, root); const plot = h('div', {}, root); const leg = h('div', { class: 'legend' }, root);
    leg.innerHTML = `<span><i style="background:var(--tension)"></i>tracción</span><span><i style="background:var(--compression)"></i>compresión</span><span><i style="background:var(--neutral)"></i>σ≈0</span><span>⚠ σ &lt; −σ<sub>cr</sub> (pandea)</span><span style="opacity:.6">— geometría inicial</span>`;
    const out = h('div', { class: 'wout' }, root);
    controls(ctl, [
      { type: 'select', key: 'model', label: 'Modelo', options: Object.entries(TRUSSES).map(([k, v]) => [k, v.name]) },
      { key: 'P', label: 'Carga P', min: 0, max: 60, step: 1, unit: 'kN' },
      { key: 'ang', label: 'Dirección de P', min: -180, max: 180, step: 5, unit: '°' },
      { key: 'dT', label: 'ΔT uniforme', min: -80, max: 80, step: 5, unit: '°C' },
      { key: 'amp', label: 'Amplificación', min: 10, max: 500, step: 10, unit: '×' },
      { type: 'check', key: 'extra', label: 'Añadir un apoyo redundante (hiperestática)' },
      { type: 'check', key: 'mat2', label: 'Barras inferiores de acero (α distinto)' }], st, render);
    function render() {
      const T = TRUSSES[st.model];
      const tube = { E: 70e9, A: Math.PI / 4 * (0.05 ** 2 - 0.044 ** 2), I: Math.PI / 64 * (0.05 ** 4 - 0.044 ** 4), alpha: 23e-6 };
      const steel = { E: 200e9, A: tube.A, I: tube.I, alpha: 12e-6 };
      const bars = T.bars.map(([a, b]) => { const low = T.nodes[a][1] === 0 && T.nodes[b][1] === 0; const m = st.mat2 && low ? steel : tube; return { a, b, ...m }; });
      const fix = T.fix.map(([n, d]) => ({ n, d, v: 0 })); if (st.extra) fix.push({ n: T.extra[0], d: T.extra[1], v: 0 });
      const t = st.ang * Math.PI / 180, loads = [{ n: T.load, d: 0, F: st.P * 1e3 * Math.cos(t) }, { n: T.load, d: 1, F: st.P * 1e3 * Math.sin(t) }];
      const r = FEM.truss2d(T.nodes, bars, fix, loads, st.dT);
      plot.innerHTML = ''; const c = C();
      // drawing box: undeformed nodes plus the amplified deformed nodes (if the solution exists)
      const defPts = r.singular ? [] : T.nodes.map((p, i) => [p[0] + st.amp * r.u[2 * i], p[1] + st.amp * r.u[2 * i + 1]]);
      const xs = T.nodes.concat(defPts).map(p => p[0]), ys = T.nodes.concat(defPts).map(p => p[1]);
      const xmin = Math.min(...xs) - 0.8, xmax = Math.max(...xs) + 0.8, ymin = Math.min(...ys) - 0.8, ymax = Math.max(...ys) + 0.9;
      const W = narrow(root) ? 440 : 640, sc = (W - 20) / (xmax - xmin), H = Math.max(200, (ymax - ymin) * sc + 20);
      const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wplot' }, plot);
      const X = x => 10 + (x - xmin) * sc, Y = y => H - 10 - (y - ymin) * sc;
      T.bars.forEach(([a, b]) => s('line', { x1: X(T.nodes[a][0]), y1: Y(T.nodes[a][1]), x2: X(T.nodes[b][0]), y2: Y(T.nodes[b][1]), stroke: c.line, 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg));
      fix.forEach(f => { const [x, y] = T.nodes[f.n]; const px = X(x), py = Y(y);
        if (f.d === 1) s('path', { d: `M${px} ${py + 4} l-9 14 h18 z`, fill: 'none', stroke: c.ink2, 'stroke-width': 1.6 }, svg);
        else s('path', { d: `M${px - 4} ${py} l-14 -9 v18 z`, fill: 'none', stroke: c.ink2, 'stroke-width': 1.6 }, svg); });
      if (r.singular) {
        s('text', { x: W / 2, y: 30, 'text-anchor': 'middle', fill: c.bad, 'font-size': 15 }, svg, 'K_LL singular: mecanismo o modo de sólido rígido');
        out.innerHTML = '<p>La estructura no está bien apoyada.</p>'; return;
      }
      const amp = st.amp, u = r.u, def = T.nodes.map((p, i) => [p[0] + amp * u[2 * i], p[1] + amp * u[2 * i + 1]]);
      let smax = Math.max(...r.bars.map(b => Math.abs(b.sig)));
      if (smax < 1e3) smax = 0;   // below 1 kPa: round-off, draw as unstressed
      T.bars.forEach(([a, b], e) => { const br = r.bars[e];
        s('line', { x1: X(def[a][0]), y1: Y(def[a][1]), x2: X(def[b][0]), y2: Y(def[b][1]), stroke: stressColor(br.sig, smax), 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
        const mx = X((def[a][0] + def[b][0]) / 2), my = Y((def[a][1] + def[b][1]) / 2);
        const buck = br.sig < 0 && -br.sig > br.scr;
        s('text', { x: mx, y: my - 6, 'text-anchor': 'middle', 'font-size': 11.5, fill: buck ? c.bad : c.ink, 'paint-order': 'stroke', stroke: c.surface, 'stroke-width': 3 }, svg,
          (buck ? '⚠ ' : '') + fmt(br.N / 1e3, 1)); });
      def.forEach(([x, y], i) => s('circle', { cx: X(x), cy: Y(y), r: 4.5, fill: c.surface, stroke: c.ink, 'stroke-width': 1.6 }, svg));
      if (st.P) { const [x, y] = def[T.load], px = X(x), py = Y(y), L = 46; const ex = px + L * Math.cos(t), ey = py - L * Math.sin(t);
        s('line', { x1: px, y1: py, x2: ex, y2: ey, stroke: c.bad, 'stroke-width': 2.5 }, svg);
        const a1 = Math.atan2(ey - py, ex - px);
        s('path', { d: `M${ex} ${ey} l${-9 * Math.cos(a1 - 0.4)} ${-9 * Math.sin(a1 - 0.4)} M${ex} ${ey} l${-9 * Math.cos(a1 + 0.4)} ${-9 * Math.sin(a1 + 0.4)}`, stroke: c.bad, 'stroke-width': 2.5 }, svg); }
      const nb = T.bars.length, nr = fix.length, nn = T.nodes.length, hdeg = nb + nr - 2 * nn;
      const reacs = Object.entries(r.reac).map(([dof, v]) => `R<sub>${Math.floor(dof / 2) + 1}${dof % 2 ? 'y' : 'x'}</sub> = <span class="num">${fmt(Math.abs(v) < 1e-6 * (st.P * 1e3 + 1) ? 0 : v / 1e3, 2)}</span>`).join(', ');
      const nbuck = r.bars.filter(b => b.sig < 0 && -b.sig > b.scr).length;
      out.innerHTML = `<p>Números sobre las barras: axil $N$ en kN. Tubos de aluminio Ø50×3 mm (acero opcional en el cordón inferior).<br>
        $h = b + r - 2n = ${nb} + ${nr} - ${2 * nn} = ${hdeg}$ → <strong>${hdeg === 0 ? 'isostática' : hdeg > 0 ? 'hiperestática de grado ' + hdeg : 'mecanismo'}</strong>.
        Reacciones (kN): ${reacs}. $|\\sigma|_{\\max}$ = <span class="num">${fmt(smax / 1e6, 1)}</span> MPa. Barras que pandean: <strong>${nbuck}</strong>.</p>
        <p class="svg-muted">Prueba: pon $P = 0$ y $\\Delta T \\neq 0$. Isostática → todas las barras grises, también con el acero (una estructura isostática acomoda cualquier dilatación). Activa el apoyo redundante → aparecen tensiones térmicas, y con el acero cambia su reparto.</p>`;
      ERA.renderMath(out);
    }
    render();
  };

  /* ---------------- thermal bar ---------------- */
  WIDGETS.thermal = function (root) {
    const MATS = { al: { n: 'Aluminio', E: 70e9, a: 23e-6 }, st: { n: 'Acero', E: 200e9, a: 12e-6 }, ti: { n: 'Titanio', E: 110e9, a: 8.6e-6 } };
    const st = { dT: 50, m1: 'al', m2: 'st', l1: 1, l2: 1, A2: 1 };
    const ctl = h('div', {}, root), plot = h('div', {}, root), out = h('div', { class: 'wout' }, root);
    const opts = Object.entries(MATS).map(([k, v]) => [k, v.n]);
    controls(ctl, [{ key: 'dT', label: 'ΔT', min: -100, max: 100, step: 5, unit: '°C' },
      { type: 'select', key: 'm1', label: 'Material barra 1', options: opts }, { type: 'select', key: 'm2', label: 'Material barra 2', options: opts },
      { key: 'l1', label: 'l₁', min: 0.2, max: 2, step: 0.1, unit: 'm' }, { key: 'l2', label: 'l₂', min: 0.2, max: 2, step: 0.1, unit: 'm' },
      { key: 'A2', label: 'A₂ / A₁', min: 0.25, max: 4, step: 0.25 }], st, render);
    function render() {
      const m1 = MATS[st.m1], m2 = MATS[st.m2], A1 = 1e-4, A2 = st.A2 * A1, dT = st.dT;
      const sFix = -m1.E * m1.a * dT;
      const N = -dT * (m1.a * st.l1 + m2.a * st.l2) / (st.l1 / (m1.E * A1) + st.l2 / (m2.E * A2));
      const s1 = N / A1, s2 = N / A2, dl1 = N * st.l1 / (m1.E * A1) + m1.a * dT * st.l1;
      const c = C(); plot.innerHTML = '';
      const svg = s('svg', { viewBox: '0 0 380 215', class: 'wplot' }, plot);
      const x0 = 110, bw = 230;
      const row = (y, label) => s('text', { x: 4, y: y + 5, 'font-size': 15, fill: c.ink2 }, svg, label);
      // free bar (expansion drawn x40)
      row(38, 'Libre'); const fl = Math.max(120, Math.min(260, bw * (1 + m1.a * dT * 40)));
      s('rect', { x: x0, y: 28, width: bw, height: 20, fill: 'none', stroke: c.line, 'stroke-dasharray': '4 3' }, svg);
      s('rect', { x: x0, y: 28, width: fl, height: 20, fill: stressColor(0, 1), opacity: 0.8 }, svg);
      s('text', { x: x0, y: 18, 'font-size': 13, fill: c.muted }, svg, 'dilatación dibujada ×40');
      // bar between walls
      row(103, 'Empotrada'); s('rect', { x: x0 - 10, y: 83, width: 10, height: 40, fill: c.line }, svg); s('rect', { x: x0 + bw, y: 83, width: 10, height: 40, fill: c.line }, svg);
      s('rect', { x: x0, y: 93, width: bw, height: 20, fill: stressColor(sFix, Math.abs(sFix) || 1) }, svg);
      // compound bar
      row(173, 'Compuesta'); const L = st.l1 + st.l2, w1 = bw * st.l1 / L, w2 = bw * st.l2 / L, smax = Math.max(Math.abs(s1), Math.abs(s2)) || 1;
      s('rect', { x: x0 - 10, y: 148, width: 10, height: 50, fill: c.line }, svg); s('rect', { x: x0 + bw, y: 148, width: 10, height: 50, fill: c.line }, svg);
      const h1 = 20, h2 = Math.max(6, Math.min(40, 20 * Math.sqrt(st.A2)));
      s('rect', { x: x0, y: 173 - h1 / 2, width: w1, height: h1, fill: stressColor(s1, smax) }, svg);
      s('rect', { x: x0 + w1, y: 173 - h2 / 2, width: w2, height: h2, fill: stressColor(s2, smax) }, svg);
      s('text', { x: x0 + w1 / 2, y: 173 + 5, 'font-size': 14, fill: c.surface, 'text-anchor': 'middle' }, svg, '1');
      s('text', { x: x0 + w1 + w2 / 2, y: 173 + 5, 'font-size': 14, fill: c.surface, 'text-anchor': 'middle' }, svg, '2');
      out.innerHTML = `<table class="data"><tr><th>Caso</th><th>Tensión</th></tr>
        <tr><td>Libre</td><td class="num">σ = 0 (se alarga α ΔT l)</td></tr>
        <tr><td>Empotrada</td><td class="num">σ = −Eα ΔT = ${fmt(sFix / 1e6, 1)} MPa</td></tr>
        <tr><td>Compuesta, barra 1</td><td class="num">σ₁ = ${fmt(s1 / 1e6, 1)} MPa</td></tr>
        <tr><td>Compuesta, barra 2</td><td class="num">σ₂ = ${fmt(s2 / 1e6, 1)} MPa</td></tr></table>
        <p>Compuesta: $N = -\\dfrac{\\Delta T(\\alpha_1l_1+\\alpha_2l_2)}{l_1/E_1A_1 + l_2/E_2A_2} = ${fmt(N / 1e3, 2)}$ kN (con $A_1 = 1$ cm²).
        La unión se desplaza $\\Delta l_1 = \\frac{Nl_1}{E_1A_1}+\\alpha_1\\Delta T\\,l_1 = ${fmt(dl1 * 1e3, 3)}$ mm: su signo depende de las longitudes,
        de las rigideces axiales y de las dilataciones libres a la vez (compatibilidad y equilibrio), no solo de qué material dilata más.</p>`;
      ERA.renderMath(out);
    }
    render();
  };

  /* ---------------- Euler buckling ---------------- */
  WIDGETS.euler = function (root) {
    const st = { D: 30, t: 2, L: 1.5, bc: 1, E: 70, sy: 270 };
    const ctl = h('div', {}, root), box = h('div', { class: 'grid2' }, root), left = h('div', {}, box), right = h('div', {}, box), out = h('div', { class: 'wout' }, root);
    controls(ctl, [{ key: 'D', label: 'Diámetro exterior D', min: 10, max: 80, step: 1, unit: 'mm' }, { key: 't', label: 'Espesor de pared', min: 0.5, max: 10, step: 0.5, unit: 'mm' },
      { key: 'L', label: 'Longitud l', min: 0.2, max: 4, step: 0.1, unit: 'm' },
      { type: 'select', key: 'bc', label: 'Extremos', num: true, options: [[1, 'articulado-articulado (l_e = l)'], [2, 'empotrado-libre (l_e = 2l)'], [0.699, 'empotrado-articulado (l_e ≈ 0,7l)'], [0.5, 'empotrado-empotrado (l_e = l/2)']] },
      { key: 'E', label: 'E', min: 40, max: 210, step: 5, unit: 'GPa' }, { key: 'sy', label: 'Límite elástico σ_y', min: 100, max: 1000, step: 10, unit: 'MPa' }], st, render);
    function render() {
      const D = st.D / 1e3, d = Math.max(0, D - 2 * st.t / 1e3), A = Math.PI / 4 * (D * D - d * d), I = Math.PI / 64 * (D ** 4 - d ** 4), E = st.E * 1e9;
      const le = st.bc * st.L, r = Math.sqrt(I / A), lam = le / r, scr = Math.PI ** 2 * E / lam ** 2, Pcr = scr * A, lamT = Math.PI * Math.sqrt(E / (st.sy * 1e6));
      const c = C();
      // mode shape
      left.innerHTML = ''; const f = frame(left, { w: 300, h: 300, xr: [-1.2, 1.2], yr: [0, 1], xlabel: 'modo de pandeo v (escala libre)', ylabel: 'z / l', m: { l: 44, b: 38 }, xfmt: () => '' });
      const shape = z => st.bc === 1 ? Math.sin(Math.PI * z) : st.bc === 2 ? 1 - Math.cos(Math.PI * z / 2) : st.bc === 0.5 ? (1 - Math.cos(2 * Math.PI * z)) / 2 :
        (() => { const k = 4.4934; return Math.sin(k * z) + k * (1 - Math.cos(k * z)) - k * z; })();  // clamped z=0, pinned z=1: tan k = k
      let pts = []; let mx = 0; for (let i = 0; i <= 60; i++) { const z = i / 60, v = shape(z); mx = Math.max(mx, Math.abs(v)); pts.push([v, z]); }
      s('line', { x1: f.X(0), y1: f.Y(0), x2: f.X(0), y2: f.Y(1), stroke: c.line, 'stroke-dasharray': '4 3' }, f.svg);
      s('path', { d: path(pts.map(([v, z]) => [f.X(v / mx), f.Y(z)])), fill: 'none', stroke: c.accent, 'stroke-width': 3 }, f.svg);
      // sigma_cr vs lambda
      right.innerHTML = ''; const lmax = Math.max(250, lam * 1.2), smaxp = st.sy * 1.5;
      const g = frame(right, { w: 340, h: 300, xr: [0, lmax], yr: [0, smaxp], xlabel: 'esbeltez λ = l_e / r', ylabel: 'σ (MPa)', xd: 0, yd: 0, m: { l: 50, b: 38 } });
      pts = []; for (let i = 1; i <= 200; i++) { const L2 = lmax * i / 200, sc = Math.PI ** 2 * E / L2 ** 2 / 1e6; if (sc < smaxp) pts.push([g.X(L2), g.Y(sc)]); }
      s('path', { d: path(pts), fill: 'none', stroke: c.accent, 'stroke-width': 2.5 }, g.svg);
      s('line', { x1: g.X(0), x2: g.X(lmax), y1: g.Y(st.sy), y2: g.Y(st.sy), stroke: c.warn, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, g.svg);
      s('text', { x: g.X(lmax) - 4, y: g.Y(st.sy) - 6, 'text-anchor': 'end', 'font-size': 12, fill: c.warn }, g.svg, 'σ_y');
      if (lamT < lmax) s('line', { x1: g.X(lamT), x2: g.X(lamT), y1: g.Y(0), y2: g.Y(smaxp), stroke: c.muted, 'stroke-dasharray': '3 3' }, g.svg);
      const sp = Math.min(scr / 1e6, smaxp); s('circle', { cx: g.X(Math.min(lam, lmax)), cy: g.Y(sp), r: 6, fill: c.bad }, g.svg);
      out.innerHTML = `<p>$A = ${fmt(A * 1e6, 1)}$ mm², $I = ${fmt(I * 1e12, 0)}$ mm⁴, $r = ${fmt(r * 1e3, 2)}$ mm, $l_e = ${fmt(le, 2)}$ m, $\\lambda = ${fmt(lam, 0)}$.<br>
        $P_{cr} = \\pi^2EI/l_e^2 = ${fmt(Pcr / 1e3, 2)}$ kN, $\\sigma_{cr} = ${fmt(scr / 1e6, 1)}$ MPa. Esbeltez de transición $\\lambda_t = \\pi\\sqrt{E/\\sigma_y} = ${fmt(lamT, 0)}$:
        ${lam > lamT ? 'la barra es <strong>esbelta</strong>, manda el pandeo de Euler.' : 'la barra es <strong>corta</strong>: plastifica antes de pandear y Euler sobrestima la carga.'}</p>`;
      ERA.renderMath(out);
    }
    render();
  };

  /* ---------------- beam FE convergence ---------------- */
  WIDGETS.beam = function (root) {
    const st = { ne: 4, load: 'cos', q: -5, P: -10 };
    const ctl = h('div', {}, root), g1 = h('div', { class: 'grid2' }, root), a = h('div', {}, g1), b = h('div', {}, g1), cdiv = h('div', {}, root), out = h('div', { class: 'wout' }, root);
    controls(ctl, [{ key: 'ne', label: 'Elementos', min: 1, max: 32, step: 1 },
      { type: 'select', key: 'load', label: 'Carga repartida', options: [['unif', 'uniforme q'], ['lin', 'triangular q(1 − x/L)'], ['cos', 'coseno q cos(πx/2L)']] },
      { key: 'q', label: 'q', min: -20, max: 20, step: 1, unit: 'kN/m' }, { key: 'P', label: 'P en la punta', min: -50, max: 50, step: 5, unit: 'kN' }], st, render);
    const L = 10, EI = 5e8;
    function qf() { const q = st.q * 1e3; return st.load === 'unif' ? (x => q) : st.load === 'lin' ? (x => q * (1 - x / L)) : (x => q * Math.cos(Math.PI * x / (2 * L))); }
    function solve(ne) { return FEM.beam1d({ L, EI, ne, q: qf(), P: [{ x: L, F: st.P * 1e3 }] }); }
    function curve(res, nsub) { const pts = []; res.els.forEach(e => { for (let i = 0; i <= nsub; i++) { const xp = e.l * i / nsub; pts.push([e.x0 + xp, ((e.a * xp + e.b) * xp + e.c) * xp + e.d]); } }); return pts; }
    function render() {
      const c = C(), fe = solve(st.ne), ref = solve(512);
      const wref = curve(ref, 1), wfe = curve(fe, 16);
      const all = wref.map(p => p[1] * 1e3); const ymin = Math.min(0, ...all), ymax = Math.max(0, ...all), pad = (ymax - ymin) * 0.1 || 1;
      a.innerHTML = ''; const f = frame(a, { w: 320, h: 250, xr: [0, L], yr: [ymin - pad, ymax + pad], xlabel: 'x (m)', ylabel: 'u_y (mm)', xd: 0, m: { l: 52 } });
      s('path', { d: path(wref.map(p => [f.X(p[0]), f.Y(p[1] * 1e3)])), stroke: c.ink2, 'stroke-width': 1.5, fill: 'none', 'stroke-dasharray': '5 4' }, f.svg);
      s('path', { d: path(wfe.map(p => [f.X(p[0]), f.Y(p[1] * 1e3)])), stroke: c.accent, 'stroke-width': 2.5, fill: 'none' }, f.svg);
      for (let i = 0; i <= st.ne; i++) s('circle', { cx: f.X(i * fe.l), cy: f.Y(fe.u[2 * i] * 1e3), r: 3.5, fill: c.accent }, f.svg);
      // bending moment
      const Mref = []; ref.els.forEach(e => Mref.push([e.x0, e.Mz[0]], [e.x0 + e.l, e.Mz[1]]));
      const Mfe = []; fe.els.forEach(e => Mfe.push([e.x0, e.Mz[0]], [e.x0 + e.l, e.Mz[1]]));
      const mv = Mref.concat(Mfe).map(p => p[1] / 1e3), m0 = Math.min(0, ...mv), m1 = Math.max(0, ...mv), mp = (m1 - m0) * 0.1 || 1;
      b.innerHTML = ''; const g = frame(b, { w: 320, h: 250, xr: [0, L], yr: [m0 - mp, m1 + mp], xlabel: 'x (m)', ylabel: 'M_z (kN·m)', xd: 0, m: { l: 52 } });
      s('path', { d: path(Mref.map(p => [g.X(p[0]), g.Y(p[1] / 1e3)])), stroke: c.ink2, 'stroke-width': 1.5, fill: 'none', 'stroke-dasharray': '5 4' }, g.svg);
      fe.els.forEach(e => s('line', { x1: g.X(e.x0), x2: g.X(e.x0 + e.l), y1: g.Y(e.Mz[0] / 1e3), y2: g.Y(e.Mz[1] / 1e3), stroke: c.accent, 'stroke-width': 2.5 }, g.svg));
      // convergence
      // exact tip deflection: w(L) = (1/EI)[ int q(xi) (L xi^2/2 - xi^3/6) dxi + P L^3/3 ] (Simpson, 2000 panels)
      const qq = qf(); let Iq = 0; const N = 2000;
      for (let i = 0; i <= N; i++) { const xi = L * i / N, wgt = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2); Iq += wgt * qq(xi) * (L * xi * xi / 2 - xi ** 3 / 6); }
      const tipRef = (Iq * L / N / 3 + st.P * 1e3 * L ** 3 / 3) / EI;
      const ns = [1, 2, 4, 8, 16, 32, 64];
      if (st.q === 0 && st.P === 0) { cdiv.innerHTML = '<p class="svg-muted">Sin carga: la flecha es nula y no hay error que estudiar.</p>'; out.innerHTML = ''; return; }
      if (Math.abs(tipRef) < 1e-9) { cdiv.innerHTML = `<p class="svg-muted">Con estas cargas la flecha exacta de la punta es nula, aunque la viga se flecta: el error relativo no está definido. Error absoluto con ${st.ne} elemento(s): ${fmt(Math.abs(fe.u[2 * st.ne]) * 1e3, 5)} mm.</p>`; out.innerHTML = ''; return; }
      const errs = ns.map(n => { const r = solve(n); return [L / n, Math.max(1e-16, Math.abs((r.u[2 * n] - tipRef) / tipRef))]; });
      const emin = Math.max(1e-16, Math.min(...errs.map(e => e[1]))), emax = Math.max(...errs.map(e => e[1]));
      cdiv.innerHTML = '';
      const lo = Math.min(1e-8, emin) < 1e-12 ? 1e-16 : 10 ** Math.floor(Math.log10(emin)), hi = 10 ** Math.ceil(Math.log10(Math.max(emax, lo * 10)));
      const k = frame(cdiv, { w: narrow(root) ? 400 : 640, h: 260, xr: [L / 64, L], yr: [lo, hi], logx: true, logy: true, xlabel: 'tamaño de elemento h (m), escala log', ylabel: 'error relativo flecha punta' });
      s('path', { d: path(errs.map(([hh, e]) => [k.X(hh), k.Y(Math.max(e, lo))])), stroke: c.bad, 'stroke-width': 2, fill: 'none' }, k.svg);
      errs.forEach(([hh, e]) => s('circle', { cx: k.X(hh), cy: k.Y(Math.max(e, lo)), r: 4, fill: L / hh === st.ne ? c.accent : c.bad }, k.svg));
      const sl = Math.log(errs[4][1] / errs[5][1]) / Math.log(2), roundoff = Math.max(...errs.map(e => e[1])) < 1e-7;   // exact up to the conditioning of K (about n^4 eps)
      out.innerHTML = `<p>Azul: MEF con ${st.ne} elemento(s), con la flecha de cada elemento interpolada por su cúbica. Discontinua: referencia con 512 elementos (curvas); el error se mide frente a la flecha exacta de la punta.
        Flecha en la punta: MEF $${fmt(fe.u[2 * st.ne] * 1e3, 4)}$ mm, exacta $${fmt(tipRef * 1e3, 4)}$ mm.
        ${roundoff ? 'Con carga uniforme y cargas puntuales las fuerzas consistentes son exactas, y los valores nodales también, con cualquier malla: el error es de redondeo y no hay pendiente que medir.' :
        `Pendiente de convergencia (de h=${fmt(L / 16, 3)} a ${fmt(L / 32, 3)} m) ≈ ${fmt(sl, 2)}: el error viene de sustituir $q(x)$ por su media en cada elemento en lugar de integrar $\\int \\mathbf N^Tq\\,dx$.`}</p>`;
      ERA.renderMath(out);
    }
    render();
  };

  /* ---------------- thin-walled sections (shared geometry) ---------------- */
  function shapeSegs(kind, hh, b, t) {
    const H = hh / 2;
    switch (kind) {
      case 'U': return [{ p: [b, H], q: [0, H], t }, { p: [0, H], q: [0, -H], t }, { p: [0, -H], q: [b, -H], t }];
      case 'Z': return [{ p: [b, H], q: [0, H], t }, { p: [0, H], q: [0, -H], t }, { p: [0, -H], q: [-b, -H], t }];
      case 'L': return [{ p: [0, hh], q: [0, 0], t }, { p: [0, 0], q: [b, 0], t }];
      case 'I': return [{ p: [-b / 2, H], q: [b / 2, H], t }, { p: [0, H], q: [0, -H], t }, { p: [-b / 2, -H], q: [b / 2, -H], t }];
      case 'hat': return [{ p: [-b, -H], q: [-b / 2, -H], t }, { p: [-b / 2, -H], q: [-b / 2, H], t }, { p: [-b / 2, H], q: [b / 2, H], t }, { p: [b / 2, H], q: [b / 2, -H], t }, { p: [b / 2, -H], q: [b, -H], t }];
      case 'box': return [{ p: [b / 2, -H], q: [b / 2, H], t }, { p: [b / 2, H], q: [-b / 2, H], t }, { p: [-b / 2, H], q: [-b / 2, -H], t }, { p: [-b / 2, -H], q: [b / 2, -H], t }];
      case 'tube': { const n = 72, r = H, out = []; for (let i = 0; i < n; i++) { const a0 = -Math.PI / 2 + 2 * Math.PI * i / n, a1 = -Math.PI / 2 + 2 * Math.PI * (i + 1) / n;
        out.push({ p: [r * Math.cos(a0), r * Math.sin(a0)], q: [r * Math.cos(a1), r * Math.sin(a1)], t }); } return out; }
    }
  }
  function drawSection(svg, segs, X, Y, c, colorFn) {
    segs.forEach(sg => { const n = 24; for (let i = 0; i < n; i++) {
      const f0 = i / n, f1 = (i + 1) / n, p0 = [sg.p[0] + f0 * (sg.q[0] - sg.p[0]), sg.p[1] + f0 * (sg.q[1] - sg.p[1])], p1 = [sg.p[0] + f1 * (sg.q[0] - sg.p[0]), sg.p[1] + f1 * (sg.q[1] - sg.p[1])];
      s('line', { x1: X(p0[0]), y1: Y(p0[1]), x2: X(p1[0]), y2: Y(p1[1]), stroke: colorFn ? colorFn((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2) : c.ink2, 'stroke-width': 7, 'stroke-linecap': 'butt' }, svg); } });
  }

  /* ---------------- bending of a thin-walled section ---------------- */
  WIDGETS.section = function (root) {
    const st = { kind: 'Z', h: 200, b: 100, t: 8, Mx: 10, My: 0 };
    const ctl = h('div', {}, root), plot = h('div', {}, root), out = h('div', { class: 'wout' }, root);
    controls(ctl, [{ type: 'select', key: 'kind', label: 'Forma', options: [['Z', 'Z'], ['U', 'U (canal)'], ['L', 'L (ángulo)'], ['I', 'I (doble T)'], ['box', 'cajón'], ['hat', 'sombrero (omega)']] },
      { key: 'h', label: 'Canto h', min: 50, max: 300, step: 10, unit: 'mm' }, { key: 'b', label: 'Ala b', min: 20, max: 200, step: 5, unit: 'mm' },
      { key: 't', label: 'Espesor t', min: 1, max: 15, step: 0.5, unit: 'mm' },
      { key: 'Mx', label: 'Mₓ', min: -20, max: 20, step: 0.5, unit: 'kN·m' }, { key: 'My', label: 'M_y', min: -20, max: 20, step: 0.5, unit: 'kN·m' }], st, render);
    function render() {
      const segs = shapeSegs(st.kind, st.h, st.b, st.t), sp = FEM.section(segs), Mx = st.Mx * 1e6, My = st.My * 1e6, c = C();
      const sig = (x, y) => FEM.sigmaBending(sp, Mx, My, x - sp.xc, y - sp.yc);
      let smax = 0, at = null, smin = 0, atm = null;
      segs.forEach(sg => { for (let i = 0; i <= 20; i++) { const x = sg.p[0] + i / 20 * (sg.q[0] - sg.p[0]), y = sg.p[1] + i / 20 * (sg.q[1] - sg.p[1]), v = sig(x, y);
        if (v > smax) { smax = v; at = [x, y]; } if (v < smin) { smin = v; atm = [x, y]; } } });
      const sab = Math.max(smax, -smin) || 1;
      const xs = segs.flatMap(g => [g.p[0], g.q[0]]), ys = segs.flatMap(g => [g.p[1], g.q[1]]);
      const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.35;
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
      plot.innerHTML = ''; const W = narrow(root) ? 400 : 640, H = narrow(root) ? 420 : 380; const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wplot' }, plot);
      const sc = (H - 30) / span, X = x => W / 2 + (x - cx) * sc, Y = y => H / 2 - (y - cy) * sc;
      drawSection(svg, segs, X, Y, c, (x, y) => stressColor(sig(x, y), sab));
      // centroid, principal axes, neutral axis
      s('circle', { cx: X(sp.xc), cy: Y(sp.yc), r: 5, fill: c.ink }, svg); s('text', { x: X(sp.xc) + 8, y: Y(sp.yc) - 8, 'font-size': 13, fill: c.ink }, svg, 'C');
      const alpha = 0.5 * Math.atan2(-2 * sp.Ixy, sp.Ixx - sp.Iyy), R = span * 0.55;
      [alpha, alpha + Math.PI / 2].forEach((a, i) => s('line', { x1: X(sp.xc - R * Math.cos(a)), y1: Y(sp.yc - R * Math.sin(a)), x2: X(sp.xc + R * Math.cos(a)), y2: Y(sp.yc + R * Math.sin(a)), stroke: c.muted, 'stroke-dasharray': '2 4' }, svg));
      const D = sp.Ixx * sp.Iyy - sp.Ixy ** 2, ax = -(My * sp.Ixx + Mx * sp.Ixy) / D, ay = (Mx * sp.Iyy + My * sp.Ixy) / D;
      if (Mx || My) { const na = Math.atan2(-ax, ay); // direction of sigma=0 line: ax x + ay y = 0
        s('line', { x1: X(sp.xc - R * Math.cos(na)), y1: Y(sp.yc - R * Math.sin(na)), x2: X(sp.xc + R * Math.cos(na)), y2: Y(sp.yc + R * Math.sin(na)), stroke: c.warn, 'stroke-width': 2, 'stroke-dasharray': '8 5' }, svg);
        s('text', { x: X(sp.xc + R * Math.cos(na)) + 4, y: Y(sp.yc + R * Math.sin(na)), 'font-size': 12, fill: c.warn }, svg, 'eje neutro'); }
      if (at) s('text', { x: X(at[0]) + 6, y: Y(at[1]) - 6, 'font-size': 12, fill: c.ten }, svg, 'σmáx');
      if (atm) s('text', { x: X(atm[0]) + 6, y: Y(atm[1]) + 14, 'font-size': 12, fill: c.comp }, svg, 'σmín');
      const naDeg = (Mx || My) ? Math.atan2(-ax, ay) * 180 / Math.PI : NaN;
      out.innerHTML = `<p>Centroide $(\\bar x,\\bar y) = (${fmt(sp.xc, 1)}, ${fmt(sp.yc, 1)})$ mm. $I_{xx} = ${fmt(sp.Ixx / 1e6, 3)}$, $I_{yy} = ${fmt(sp.Iyy / 1e6, 3)}$, $I_{xy} = ${fmt(sp.Ixy / 1e6, 3)}\\times10^6$ mm⁴.
        Ejes principales a $\\alpha = ${fmt(alpha * 180 / Math.PI, 1)}°$ (punteado gris).<br>
        $\\sigma_z = ${fmt(ax, 4)}\\,x ${ay >= 0 ? '+' : ''}${fmt(ay, 4)}\\,y$ (MPa, mm desde el centroide). ${isFinite(naDeg) ? `Eje neutro a ${fmt(naDeg, 1)}° de $x$.` : ''}
        Máx. tracción $${fmt(smax, 1)}$ MPa; máx. compresión $${fmt(smin, 1)}$ MPa.
        ${Math.abs(sp.Ixy) > 1e-6 * sp.Ixx && Mx ? `Fórmula simétrica (incorrecta aquí): $M_xy_{\\max}/I_{xx} = ${fmt(Mx * (Math.max(...ys) - sp.yc) / sp.Ixx, 1)}$ MPa.` : ''}</p>`;
      ERA.renderMath(out);
    }
    render();
  };

  /* ---------------- thin-wall approximation error ---------------- */
  WIDGETS.thinwall = function (root) {
    const st = { tr: 0.05, th: 30 };
    const ctl = h('div', {}, root), box = h('div', { class: 'grid2' }, root), a = h('div', {}, box), b = h('div', {}, box), out = h('div', { class: 'wout' }, root);
    controls(ctl, [{ key: 'tr', label: 't / r del tubo', min: 0.01, max: 0.6, step: 0.01, fmt: v => v.toFixed(2) }, { key: 'th', label: 'θ de la pared inclinada', min: 0, max: 90, step: 1, unit: '°' }], st, render);
    function render() {
      const c = C();
      const err = tr => { const ro = 1 + tr / 2, ri = 1 - tr / 2, ex = Math.PI / 4 * (ro ** 4 - ri ** 4), ap = Math.PI * tr; return (ap - ex) / ex; };
      a.innerHTML = ''; const f = frame(a, { w: 320, h: 250, xr: [0, 0.6], yr: [-0.1, 0.01], xlabel: 't / r', ylabel: 'error de πr³t', yd: 2, xd: 1, m: { l: 56 } });
      const pts = []; for (let i = 1; i <= 60; i++) { const tr = i / 100; pts.push([f.X(tr), f.Y(err(tr))]); }
      s('path', { d: path(pts), stroke: c.accent, 'stroke-width': 2.5, fill: 'none' }, f.svg);
      s('circle', { cx: f.X(st.tr), cy: f.Y(err(st.tr)), r: 5, fill: c.bad }, f.svg);
      b.innerHTML = ''; const g = frame(b, { w: 320, h: 250, xr: [0, 90], yr: [-0.005, 0.09], xlabel: 'θ (°)', ylabel: 'I / (t a³)', xd: 0, yd: 2, m: { l: 56 } });
      const curves = [[th => Math.sin(th) ** 2 / 12, c.accent, 'Ixx'], [th => Math.cos(th) ** 2 / 12, c.ten, 'Iyy'], [th => Math.sin(2 * th) / 24, c.ok, 'Ixy']];
      curves.forEach(([fn, col, lab]) => { const p = []; for (let i = 0; i <= 90; i++) p.push([g.X(i), g.Y(fn(i * Math.PI / 180))]); s('path', { d: path(p), stroke: col, 'stroke-width': 2.2, fill: 'none' }, g.svg);
        s('circle', { cx: g.X(st.th), cy: g.Y(fn(st.th * Math.PI / 180)), r: 4.5, fill: col }, g.svg); });
      const th = st.th * Math.PI / 180;
      out.innerHTML = `<p>Tubo: la aproximación $\\pi r^3t$ (con $r$ medio) frente al anillo exacto $\\tfrac{\\pi}{4}(r_o^4-r_i^4)$ tiene un error de <span class="num">${fmt(100 * err(st.tr), 2)} %</span>
        (exactamente $-\\tfrac{(t/r)^2}{4+(t/r)^2}$: casi nulo para $t/r<0{,}1$).<br>Pared inclinada a ${st.th}°: $I_{xx} = ${fmt(Math.sin(th) ** 2 / 12, 4)}\\,ta^3$ (azul), $I_{yy} = ${fmt(Math.cos(th) ** 2 / 12, 4)}\\,ta^3$ (rojo), $I_{xy} = ${fmt(Math.sin(2 * th) / 24, 4)}\\,ta^3$ (verde).</p>`;
      ERA.renderMath(out);
    }
    render();
  };

  /* ---------------- shear flow ---------------- */
  WIDGETS.shear = function (root) {
    const st = { kind: 'U', h: 200, b: 100, t: 2, Sy: 10 };
    const ctl = h('div', {}, root), plot = h('div', {}, root), out = h('div', { class: 'wout' }, root);
    controls(ctl, [{ type: 'select', key: 'kind', label: 'Sección', options: [['U', 'U (canal), abierta'], ['Z', 'Z, abierta'], ['L', 'L (ángulo), abierta'], ['hat', 'sombrero, abierta'], ['I', 'I (doble T), abierta'], ['box', 'cajón, cerrada'], ['tube', 'tubo, cerrada']] },
      { key: 'h', label: 'Canto h (o diámetro)', min: 50, max: 300, step: 10, unit: 'mm' }, { key: 'b', label: 'Ala b', min: 20, max: 200, step: 5, unit: 'mm' },
      { key: 't', label: 'Espesor t', min: 0.5, max: 5, step: 0.5, unit: 'mm' }, { key: 'Sy', label: 'S_y', min: 1, max: 50, step: 1, unit: 'kN' }], st, render);
    function render() {
      const c = C(), Sy = st.Sy * 1e3; let segs = shapeSegs(st.kind, st.h, st.b, st.t), note = '';
      let samples, sp, closed = st.kind === 'box' || st.kind === 'tube';
      if (st.kind === 'I') {
        // branched: treat each flange half and the web with q from free edges (symmetric about y)
        const H = st.h / 2, b = st.b, t = st.t;
        segs = [{ p: [-b / 2, H], q: [0, H], t }, { p: [b / 2, H], q: [0, H], t }, { p: [0, H], q: [0, -H], t }, { p: [0, -H], q: [-b / 2, -H], t }, { p: [0, -H], q: [b / 2, -H], t }];
        sp = FEM.section(segs); const k = -Sy / sp.Ixx; samples = [];
        const run = (sg, q0, idx) => { const L = Math.hypot(sg.q[0] - sg.p[0], sg.q[1] - sg.p[1]); let q = q0; const n = 40;
          for (let i = 0; i <= n; i++) { const f = i / n, y = sg.p[1] + f * (sg.q[1] - sg.p[1]) - sp.yc; if (i) { const yp = sg.p[1] + (i - 1) / n * (sg.q[1] - sg.p[1]) - sp.yc; q += k * t * L / n * (y + yp) / 2; }
            samples.push({ seg: idx, f, s: f * L, x: sg.p[0] + f * (sg.q[0] - sg.p[0]), y: y + sp.yc, q }); } return q; };
        const q1 = run(segs[0], 0, 0), q2 = run(segs[1], 0, 1); const qw = run(segs[2], q1 + q2, 2);
        // bottom flanges: flow from the web junction outwards splits in two
        run(segs[3], qw / 2, 3); run(segs[4], qw / 2, 4);
      } else {
        const r = FEM.shearOpen(segs, 0, Sy, closed ? 6 : 40); samples = r.samples; sp = r.sp;
      }
      // resultant check and closed-section correction
      const Fy = (() => { let F = 0; segs.forEach((sg, k) => { const pts = samples.filter(o => o.seg === k), L = Math.hypot(sg.q[0] - sg.p[0], sg.q[1] - sg.p[1]), ty = (sg.q[1] - sg.p[1]) / L;
        for (let i = 1; i < pts.length; i++) F += (pts[i].q + pts[i - 1].q) / 2 * ty * (pts[i].s - pts[i - 1].s); }); return F; })();
      let xS = null;
      if (closed) {
        // cut at s = 0 (start of the first wall), q = q_open + q_s0; moment balance about the centroid (load line)
        let Ain = 0; segs.forEach(sg => { Ain += 0.5 * (sg.p[0] * sg.q[1] - sg.q[0] * sg.p[1]); });
        const Mo = FEM.shearMoment(segs, samples, [sp.xc, sp.yc]), qs0 = -Mo / (2 * Ain);
        samples.forEach(o => { o.q += qs0; });
        note = `Sección cerrada: corte en $s=0$ (abajo a la derecha), $q_{s,0} = ${fmt(qs0, 2)}$ N/mm de la ecuación de momentos respecto al centroide ($A_{in} = ${fmt(Ain, 0)}$ mm²). Por la doble simetría, el centro de cortante es el centroide.`;
      } else {
        const Mq = FEM.shearMoment(segs, samples, [sp.xc, sp.yc]); xS = sp.xc + Mq / Fy;
        note = `Resultante vertical de $q$: ${fmt(Math.abs(Fy) / 1e3, 3)} kN (= $S_y$ ✓). Línea de acción de $S_y$ que no produce torsión: $x_S = ${fmt(xS, 2)}$ mm (el centroide está en $\\bar x = ${fmt(sp.xc, 2)}$ mm).`;
        if (st.kind === 'U') note += ` Fórmula del canal: $3b^2/(h+6b) = ${fmt(3 * st.b ** 2 / (st.h + 6 * st.b), 2)}$ mm desde el alma.`;
        if (!['U', 'Z', 'I'].includes(st.kind)) note += ` Un cortante vertical solo fija la recta vertical $x = x_S$; la altura $y_S$ del centro de cortante requiere un segundo caso con $S_x$${st.kind === 'L' ? ' (en el ángulo, el centro de cortante es la esquina, donde se cortan las dos alas)' : ''}.`;
      }
      const qmax = Math.max(...samples.map(o => Math.abs(o.q))) || 1;
      // draw
      const xs = segs.flatMap(g => [g.p[0], g.q[0]]).concat(xS !== null ? [xS] : []), ys = segs.flatMap(g => [g.p[1], g.q[1]]);
      const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.7;
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
      plot.innerHTML = ''; const W = narrow(root) ? 400 : 640, H = 400; const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wplot' }, plot);
      const sc = (H - 30) / span, X = x => W / 2 + (x - cx) * sc, Y = y => H / 2 - (y - cy) * sc, qs = span * 0.18 / qmax;
      segs.forEach((sg, k) => { const pts = samples.filter(o => o.seg === k); const L = Math.hypot(sg.q[0] - sg.p[0], sg.q[1] - sg.p[1]);
        const nx = -(sg.q[1] - sg.p[1]) / L, ny = (sg.q[0] - sg.p[0]) / L;
        const poly = pts.map(o => [X(o.x + nx * o.q * qs), Y(o.y + ny * o.q * qs)]);
        const base = pts.slice().reverse().map(o => [X(o.x), Y(o.y)]);
        const mean = pts.reduce((a, o) => a + o.q, 0) / pts.length;
        s('path', { d: path(poly.concat(base)) + ' Z', fill: mean >= 0 ? c.ten : c.comp, 'fill-opacity': 0.22, stroke: mean >= 0 ? c.ten : c.comp, 'stroke-width': 1.4 }, svg); });
      drawSection(svg, segs, X, Y, c);
      s('circle', { cx: X(sp.xc), cy: Y(sp.yc), r: 4.5, fill: c.ink }, svg); s('text', { x: X(sp.xc) + 7, y: Y(sp.yc) - 7, 'font-size': 12, fill: c.ink }, svg, 'C');
      const sx = xS !== null ? xS : sp.xc;
      s('line', { x1: X(sx), x2: X(sx), y1: Y(cy + span * 0.42), y2: Y(cy + span * 0.2), stroke: c.bad, 'stroke-width': 2.5 }, svg);
      s('path', { d: `M${X(sx)} ${Y(cy + span * 0.2)} l-6 -10 h12 z`, fill: c.bad, transform: `rotate(180 ${X(sx)} ${Y(cy + span * 0.2)})` }, svg);
      s('text', { x: X(sx) + 8, y: Y(cy + span * 0.4), 'font-size': 13, fill: c.bad }, svg, 'S_y');
      const ySknown = ['U', 'Z', 'I'].includes(st.kind);   // y_S known by symmetry: U (x axis), Z (point symmetry), I (double)
      if (xS !== null && ySknown) { s('path', { d: `M${X(xS) - 7} ${Y(sp.yc)} h14 M${X(xS)} ${Y(sp.yc) - 7} v14`, stroke: c.bad, 'stroke-width': 2.5 }, svg);
        s('text', { x: X(xS) + 8, y: Y(sp.yc) + 16, 'font-size': 12, fill: c.bad }, svg, 'centro de cortante'); }
      out.innerHTML = `<p>$I_{xx} = ${fmt(sp.Ixx / 1e6, 3)}\\times10^6$ mm⁴, $|q|_{\\max} = ${fmt(qmax, 2)}$ N/mm, $\\tau_{\\max} = |q|_{\\max}/t = ${fmt(qmax / st.t, 1)}$ MPa. ${note}</p>
        <p class="svg-muted">El diagrama se dibuja perpendicular a cada pared; rojo y azul indican el sentido respecto al recorrido de $s$.</p>`;
      ERA.renderMath(out);
    }
    render();
  };

  /* boot */
  function boot() {
    document.querySelectorAll('.widget[data-widget]').forEach(div => {
      const fn = WIDGETS[div.dataset.widget];
      if (!fn) return;
      const body = h('div', { class: 'wbody' }, div);
      const run = () => { body.innerHTML = ''; try { fn(body); } catch (e) { body.textContent = 'Error en el widget: ' + e.message; console.error(e); } };
      run();
      document.addEventListener('era-theme', run);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else boot();
  window.ERA_WIDGETS = WIDGETS;
})();
