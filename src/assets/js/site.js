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
  };
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
