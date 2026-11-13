/* Shared behaviour: theme toggle, mobile menu, KaTeX rendering, per-topic progress badges. */
(function () {
  const root = document.documentElement;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  window.ERA = window.ERA || {};
  window.ERA.store = store;

  document.addEventListener('DOMContentLoaded', () => {
    const tb = document.querySelector('.theme-btn');
    if (tb) tb.addEventListener('click', () => {
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('era-theme', root.dataset.theme); } catch (e) {}
      document.dispatchEvent(new Event('era-theme'));
    });
    const mb = document.querySelector('.menu-btn'), nav = document.getElementById('sidenav');
    if (mb && nav) {
      mb.addEventListener('click', () => { const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });
      document.addEventListener('click', e => { if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== mb) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', false); } });
    }
    ERA.renderMath(document.body);
    ERA.updateBadges();
  });

  ERA.renderMath = function (el) {
    if (!window.renderMathInElement) { setTimeout(() => ERA.renderMath(el), 60); return; }
    renderMathInElement(el, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true },
                   { left: '\\(', right: '\\)', display: false }, { left: '$', right: '$', display: false }],
      throwOnError: false, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
    });
    ERA.fitDisplays(el);
  };

  /* Phones: a display equation wider than its box is re-rendered with its top-level \qquad / ",\quad"
     separators as line breaks; if it still overflows it is scaled down (not below 72 %). Wide screens keep
     the original one-line form. */
  function splitTop(src) {
    const parts = []; let depth = 0, env = 0, last = 0;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (c === '\\' && src.startsWith('\\begin{', i)) env++;
      else if (c === '\\' && src.startsWith('\\end{', i)) env--;
      else if (c === '\\' && (src[i + 1] === '{' || src[i + 1] === '}')) { i++; continue; }
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '\\' && depth === 0 && env === 0) {
        const m = /^\\(qquad|quad)(?![a-zA-Z])/.exec(src.slice(i));
        if (m && (m[1] === 'qquad' || /,\s*$/.test(src.slice(last, i)))) {
          parts.push(src.slice(last, i).trim()); i += m[0].length - 1; last = i + 1;
        }
        else if (/^\\(Rightarrow|Longrightarrow)(?![a-zA-Z])/.test(src.slice(i)) && i > last) { parts.push(src.slice(last, i).trim()); last = i; }   // break before an implication
      }
    }
    parts.push(src.slice(last).trim());
    // drop spacing commands left at the cut ("\\ ", "\\,", "\\quad"), or a lone "\\" would eat the next line's command
    const clean = t => t.replace(/(?:\\[ ,;:!]|\\q?quad(?![a-zA-Z])|\s|\\$)+$/, '').replace(/^(?:\\[ ,;:!]|\\q?quad(?![a-zA-Z])|\s)+/, '');
    return parts.map(clean).filter(Boolean);
  }
  ERA.fitDisplays = function (el) {
    if (!window.katex) return;
    (el || document).querySelectorAll('.katex-display').forEach(d => {
      const ann = d.querySelector('annotation');
      if (!d.dataset.src && ann) d.dataset.src = ann.textContent;
      const src = d.dataset.src; if (!src) return;
      const fits = () => d.scrollWidth <= d.clientWidth + 1;
      const render = tex => { try { const t = document.createElement('div'); t.innerHTML = katex.renderToString(tex, { displayMode: true, throwOnError: false }); d.innerHTML = t.firstElementChild.innerHTML; } catch (e) { /* keep */ } };
      d.style.fontSize = '';
      if (d.dataset.fit) { render(src); delete d.dataset.fit; }
      if (fits()) return;
      const parts = splitTop(src);
      if (parts.length > 1) { render('\\begin{gathered}' + parts.join('\\\\[0.4em]') + '\\end{gathered}'); d.dataset.fit = '1'; }
      for (let k = 0, f = 1; k < 4 && !fits() && f > 0.72; k++) { f = Math.max(0.72, f * d.clientWidth / d.scrollWidth * 0.98); d.style.fontSize = f + 'em'; }
    });
  };
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => ERA.fitDisplays(document), 200); });
  // widths are only right once the KaTeX fonts have loaded
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ERA.fitDisplays(document));
  window.addEventListener('load', () => ERA.fitDisplays(document));
  ERA.tex = function (s, display) {
    if (!window.katex) return s;
    try { return katex.renderToString(s, { displayMode: !!display, throwOnError: false }); } catch (e) { return s; }
  };

  /* progress: {qid: 0|1|2} ; topic mastery = sum(status)/ (2 * questions in topic) */
  ERA.progress = () => store.get('era-progress', {});
  ERA.setProgress = (qid, s) => { const p = ERA.progress(); p[qid] = s; store.set('era-progress', p); ERA.updateBadges(); };
  ERA.topicCounts = () => store.get('era-topic-counts', null);
  ERA.updateBadges = function () {
    const counts = ERA.topicCounts(); if (!counts) return;
    const p = ERA.progress();
    document.querySelectorAll('[data-topic]').forEach(a => {
      if (a.tagName !== 'A' && !a.classList.contains('tile')) return;
      const t = a.dataset.topic, c = counts[t]; if (!c) return;
      let sum = 0; c.ids.forEach(id => { sum += (p[id] || 0); });
      const pct = Math.round(100 * sum / (2 * c.ids.length));
      let b = a.querySelector('.badge');
      if (a.tagName === 'A' && !a.classList.contains('tile')) {
        if (!b) { b = document.createElement('span'); b.className = 'badge'; a.appendChild(b); }
        b.textContent = pct ? pct + '%' : '';
      }
      const bar = a.querySelector('.prog > span'); if (bar) bar.style.width = pct + '%';
    });
  };
})();
