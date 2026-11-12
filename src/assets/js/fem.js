/* Small FE / section-property library used by the widgets. SI units throughout. */
(function () {
  const FEM = {};

  /* Dense solve with partial pivoting. Returns null if singular. */
  FEM.solve = function (A, b) {
    const n = b.length, M = A.map((r, i) => r.slice().concat([b[i]]));
    let scale = 0; for (const r of A) for (const v of r) scale = Math.max(scale, Math.abs(v));
    for (let k = 0; k < n; k++) {
      let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) < 1e-11 * scale) return null;
      [M[k], M[p]] = [M[p], M[k]];
      for (let i = k + 1; i < n; i++) { const f = M[i][k] / M[k][k]; if (f) for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j]; }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  };
  const zeros = (n, m) => Array.from({ length: n }, () => new Array(m).fill(0));
  FEM.zeros = zeros;

  /* 2D truss (course algorithm ALG_2DBAR): K^e = EA/l [nn^T -nn^T; -nn^T nn^T], sigma0 = -E alpha dT.
     nodes: [[x,y]], bars: [{a,b,E,A,alpha,I}], fix: [{n,d,v}] (d=0 x, 1 y), loads: [{n,d,F}] */
  FEM.truss2d = function (nodes, bars, fix, loads, dT) {
    const nd = 2 * nodes.length, K = zeros(nd, nd), F = new Array(nd).fill(0);
    const info = bars.map(br => {
      const [x1, y1] = nodes[br.a], [x2, y2] = nodes[br.b];
      const l = Math.hypot(x2 - x1, y2 - y1), c = (x2 - x1) / l, s = (y2 - y1) / l;
      const k = br.E * br.A / l, n = [c, s, -c, -s], dofs = [2 * br.a, 2 * br.a + 1, 2 * br.b, 2 * br.b + 1];
      const B = [-c, -s, c, s];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[dofs[i]][dofs[j]] += k * B[i] * B[j];
      const s0 = -br.E * (br.alpha || 0) * (dT || 0);
      for (let i = 0; i < 4; i++) F[dofs[i]] += s0 * br.A * n[i];          // f = sigma0 A [c s -c -s]
      return { l, c, s, k, dofs, B, s0 };
    });
    for (const ld of loads) F[2 * ld.n + ld.d] += ld.F;
    const R = fix.map(f => 2 * f.n + f.d), uR = fix.map(f => f.v || 0);
    const L = []; for (let i = 0; i < nd; i++) if (!R.includes(i)) L.push(i);
    const KLL = L.map(i => L.map(j => K[i][j]));
    const rhs = L.map((i, a) => F[i] - R.reduce((acc, r, b) => acc + K[i][r] * uR[b], 0));
    const uL = FEM.solve(KLL, rhs);
    if (!uL) return { singular: true };
    const u = new Array(nd).fill(0); L.forEach((i, a) => { u[i] = uL[a]; }); R.forEach((r, b) => { u[r] = uR[b]; });
    const reac = {}; R.forEach(r => { let s = -F[r]; for (let j = 0; j < nd; j++) s += K[r][j] * u[j]; reac[r] = s; });
    const res = info.map((e, i) => {
      const br = bars[i]; let du = 0; for (let k = 0; k < 4; k++) du += e.B[k] * u[e.dofs[k]];
      const eps = du / e.l, sig = e.s0 + br.E * eps, N = sig * br.A;
      const scr = br.I ? Math.PI ** 2 * br.E * br.I / (e.l ** 2 * br.A) : Infinity;
      return { eps, sig, N, l: e.l, scr };
    });
    return { singular: false, u, reac, bars: res, K };
  };

  /* Euler-Bernoulli beam FE on [0, L] following ALG_1DBEAM.
     opts: {L, EI, ne, q(x) (N/m, + along +y), P: [{x, F}], bc: 'cantilever' | 'simply'}
     Distributed load: element average q_bar with F^e = q_bar l/2 [1, l/6, 1, -l/6] (as in the course guide). */
  FEM.beam1d = function (o) {
    const ne = o.ne, l = o.L / ne, nn = ne + 1, nd = 2 * nn, K = zeros(nd, nd), F = new Array(nd).fill(0);
    const k = o.EI / l ** 3, Ke = [[12, 6 * l, -12, 6 * l], [6 * l, 4 * l * l, -6 * l, 2 * l * l], [-12, -6 * l, 12, -6 * l], [6 * l, 2 * l * l, -6 * l, 4 * l * l]];
    for (let e = 0; e < ne; e++) {
      const d = [2 * e, 2 * e + 1, 2 * e + 2, 2 * e + 3];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[d[i]][d[j]] += k * Ke[i][j];
      if (o.q) {
        // element average of q by Simpson's rule
        const x0 = e * l, qb = (o.q(x0) + 4 * o.q(x0 + l / 2) + o.q(x0 + l)) / 6;
        const fe = [qb * l / 2, qb * l * l / 12, qb * l / 2, -qb * l * l / 12];
        for (let i = 0; i < 4; i++) F[d[i]] += fe[i];
      }
    }
    for (const p of (o.P || [])) { const i = Math.round(p.x / l); F[2 * i] += p.F; }
    const R = o.bc === 'simply' ? [0, 2 * ne] : [0, 1];
    const L = []; for (let i = 0; i < nd; i++) if (!R.includes(i)) L.push(i);
    const uL = FEM.solve(L.map(i => L.map(j => K[i][j])), L.map(i => F[i]));
    const u = new Array(nd).fill(0); L.forEach((i, a) => { u[i] = uL[a]; });
    const els = [];
    for (let e = 0; e < ne; e++) {
      const d = [2 * e, 2 * e + 1, 2 * e + 2, 2 * e + 3], ue = d.map(i => u[i]);
      const fint = Ke.map(r => k * (r[0] * ue[0] + r[1] * ue[1] + r[2] * ue[2] + r[3] * ue[3]));
      // cubic coefficients (ALG_1DBEAM sec. 6d)
      const a = (2 * ue[0] + l * ue[1] - 2 * ue[2] + l * ue[3]) / l ** 3;
      const b = (-3 * l * ue[0] - 2 * l * l * ue[1] + 3 * l * ue[2] - l * l * ue[3]) / l ** 3;
      els.push({ x0: e * l, l, a, b, c: ue[1], d: ue[0], Fy: [-fint[0], fint[2]], Mz: [-fint[1], fint[3]] });
    }
    return { u, els, l };
  };

  /* Thin-walled section made of straight segments [{p:[x,y], q:[x,y], t}] (and optional booms [{p,B}]).
     Exact rectangle properties of each segment (t^3 terms included). Returns centroid and second moments about it. */
  FEM.section = function (segs, booms) {
    let A = 0, Sx = 0, Sy = 0;
    const parts = segs.map(s => { const L = Math.hypot(s.q[0] - s.p[0], s.q[1] - s.p[1]); const a = L * s.t;
      const cx = (s.p[0] + s.q[0]) / 2, cy = (s.p[1] + s.q[1]) / 2; A += a; Sx += a * cx; Sy += a * cy; return { L, a, cx, cy, s }; });
    (booms || []).forEach(b => { A += b.B; Sx += b.B * b.p[0]; Sy += b.B * b.p[1]; });
    const xc = Sx / A, yc = Sy / A; let Ixx = 0, Iyy = 0, Ixy = 0;
    parts.forEach(({ L, a, cx, cy, s }) => {
      const c = (s.q[0] - s.p[0]) / L, sn = (s.q[1] - s.p[1]) / L;
      const I1 = s.t * L ** 3 / 12, I2 = L * s.t ** 3 / 12;            // about own axes (along, across)
      Ixx += I1 * sn * sn + I2 * c * c + a * (cy - yc) ** 2;
      Iyy += I1 * c * c + I2 * sn * sn + a * (cx - xc) ** 2;
      Ixy += (I1 - I2) * c * sn + a * (cx - xc) * (cy - yc);
    });
    (booms || []).forEach(b => { Ixx += b.B * (b.p[1] - yc) ** 2; Iyy += b.B * (b.p[0] - xc) ** 2; Ixy += b.B * (b.p[0] - xc) * (b.p[1] - yc); });
    return { A, xc, yc, Ixx, Iyy, Ixy };
  };

  /* Course bending formula (right-hand vector moments, z along the beam):
     sigma_z = -(My Ixx + Mx Ixy)/D x + (Mx Iyy + My Ixy)/D y, D = Ixx Iyy - Ixy^2 (x, y from the centroid) */
  FEM.sigmaBending = (sp, Mx, My, x, y) => {
    const D = sp.Ixx * sp.Iyy - sp.Ixy ** 2;
    return -(My * sp.Ixx + Mx * sp.Ixy) / D * x + (Mx * sp.Iyy + My * sp.Ixy) / D * y;
  };

  /* Open-section shear flow along a single polyline (s = 0 at the free edge p of the first segment), course formula
     q(s) = -(Sx Ixx - Sy Ixy)/D int t x ds - (Sy Iyy - Sx Ixy)/D int t y ds  (x, y from the centroid).
     Returns samples [{seg, s, x, y, q}] and the moment of q about point P (positive anticlockwise). */
  FEM.shearOpen = function (segs, Sx, Sy, nsub) {
    const sp = FEM.section(segs.map(s => ({ ...s, t: s.t })));
    const D = sp.Ixx * sp.Iyy - sp.Ixy ** 2, ax = -(Sx * sp.Ixx - Sy * sp.Ixy) / D, ay = -(Sy * sp.Iyy - Sx * sp.Ixy) / D;
    let q = 0; const out = []; nsub = nsub || 40;
    segs.forEach((s, k) => {
      const L = Math.hypot(s.q[0] - s.p[0], s.q[1] - s.p[1]), ds = L / nsub;
      for (let i = 0; i <= nsub; i++) {
        const f = i / nsub, x = s.p[0] + f * (s.q[0] - s.p[0]) - sp.xc, y = s.p[1] + f * (s.q[1] - s.p[1]) - sp.yc;
        if (i > 0) { // trapezoid on the linear integrand
          const fp = (i - 1) / nsub, xp = s.p[0] + fp * (s.q[0] - s.p[0]) - sp.xc, yp = s.p[1] + fp * (s.q[1] - s.p[1]) - sp.yc;
          q += s.t * ds * (ax * (x + xp) / 2 + ay * (y + yp) / 2);
        }
        out.push({ seg: k, f, s: f * L, x: x + sp.xc, y: y + sp.yc, q });
      }
    });
    return { sp, samples: out };
  };
  /* Moment about P of the shear flow q(s) (force per length along the wall direction p->q), anticlockwise positive. */
  FEM.shearMoment = function (segs, samples, P) {
    let M = 0;
    segs.forEach((s, k) => {
      const pts = samples.filter(o => o.seg === k), L = Math.hypot(s.q[0] - s.p[0], s.q[1] - s.p[1]);
      const tx = (s.q[0] - s.p[0]) / L, ty = (s.q[1] - s.p[1]) / L;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], qm = (a.q + b.q) / 2, xm = (a.x + b.x) / 2 - P[0], ym = (a.y + b.y) / 2 - P[1];
        M += (xm * ty - ym * tx) * qm * (b.s - a.s);
      }
    });
    return M;
  };

  window.FEM = FEM;
})();
