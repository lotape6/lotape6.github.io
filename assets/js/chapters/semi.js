/* Semiconductors chapter.
   1. Atmosphere "semi": deep violet field, one EUV point source pulsing at the
      upper right, faint interference rings, a sparse drifting wafer map of dies.
   2. "Untangle the graph": ~40 build targets drawn tangled with cycles (Make),
      animated into a layered DAG with explicit edges (Bazel) while counters settle. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
  // Palette from CSS tokens; rebuilt on every theme toggle (atmosphere via theme(), graph via fgl:theme).
  let MG = [212, 79, 209], VI = [140, 90, 230], FG = [232, 238, 247], FG2 = [183, 195, 211], BG = [7, 11, 20], CORE = [255, 255, 255], K = 1, DARK = true;
  function loadPalette(isDark) {
    const A = window.ATMO;
    DARK = !!isDark;
    K = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--atmo-alpha")) || 1;
    MG = A.rgb("--mg"); VI = A.rgb("--lv"); FG = A.rgb("--fg"); FG2 = A.rgb("--fg-2"); BG = A.rgb("--bg-2");
    CORE = isDark ? [255, 255, 255] : A.rgb("--mg"); // light: an ink dot instead of a white-hot core
  }
  loadPalette(window.ATMO.isDark());

  /* ---------------- atmosphere ---------------- */
  let dies = [], ringGap = 90;
  window.ATMO.register("semi", {
    init(canvas, ctx, s) { loadPalette(window.ATMO.isDark()); this.resize(s); },
    theme(isDark) { loadPalette(isDark); },
    resize(s) {
      const n = Math.round((s.w * s.h) / 14000);
      const cell = 26;
      dies = Array.from({ length: n }, () => ({
        x: Math.floor(Math.random() * (s.w / cell)) * cell + 3, y: Math.random() * s.h,
        v: 2 + Math.random() * 4, a: .12 + Math.random() * .25, bright: Math.random() < .12,
      }));
      ringGap = Math.max(70, Math.min(s.w, s.h) / 9);
    },
    draw(ctx, s, t) {
      ctx.clearRect(0, 0, s.w, s.h);
      const sx = s.w * .84, sy = s.h * .16;
      const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, a * K * (DARK ? 1 : .7)).toFixed(3)})`; // light: softer tints
      // violet field, darker towards the centre column so text stays readable
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(s.w, s.h) * .9);
      g.addColorStop(0, rgba(VI, .22)); g.addColorStop(.35, rgba(VI, .07)); g.addColorStop(1, rgba(VI, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, s.w, s.h);
      // wafer map: tiny dies drifting down very slowly
      const cell = 26;
      for (const d of dies) {
        const y = (d.y + t * d.v) % (s.h + cell) - cell / 2;
        ctx.fillStyle = d.bright ? rgba(MG, d.a * 1.2) : rgba(VI, d.a);
        ctx.fillRect(d.x, Math.round(y / cell) * cell, 5, 5);
      }
      // interference rings radiating from the source
      const pulse = .5 + .5 * Math.sin(t * .55);
      const maxR = Math.hypot(s.w, s.h);
      const phase = (t * 10) % ringGap;
      ctx.lineWidth = 1;
      for (let r = phase; r < maxR; r += ringGap) {
        const a = .11 * (1 - r / maxR) * (.6 + .4 * pulse);
        ctx.strokeStyle = rgba(MG, a);
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      }
      // the point source: a soft halo and a hard core
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, 140 + 40 * pulse);
      halo.addColorStop(0, rgba(MG, .55 + .25 * pulse)); halo.addColorStop(.2, rgba(MG, .18)); halo.addColorStop(1, rgba(MG, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, 180, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(CORE, .75 + .25 * pulse);
      ctx.beginPath(); ctx.arc(sx, sy, 2.4 + pulse, 0, Math.PI * 2); ctx.fill();
      ctx.font = "10px JetBrains Mono, monospace"; ctx.fillStyle = rgba(MG, .55); ctx.textAlign = "right";
      ctx.fillText("λ 13.5 nm", sx - 14, sy + 4);
    },
  });

  /* ---------------- untangle the graph ---------------- */
  const canvas = document.getElementById("semi-graph");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const toggle = document.getElementById("semi-toggle");
  const label = document.getElementById("semi-state-label");
  const cCycles = document.getElementById("semi-c-cycles"), cDups = document.getElementById("semi-c-dups"), cRepro = document.getElementById("semi-c-repro");
  const CYCLES = 7, DUPS = 12;

  // Deterministic layout: 5 layers of build targets, DAG edges down the layers,
  // plus "bad" edges (back edges = cycles, duplicate libraries) that only exist in the Make world.
  const LAYERS = [6, 9, 10, 9, 6];
  const nodes = [], good = [], bad = [];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  LAYERS.forEach((n, li) => { for (let i = 0; i < n; i++) nodes.push({ layer: li, idx: i, n, mx: rnd(), my: rnd(), bx: 0, by: 0, x: 0, y: 0, dup: false }); });
  const byLayer = (li) => nodes.filter((d) => d.layer === li);
  nodes.forEach((d, i) => {
    if (d.layer === 0) return;
    // prefer parents near the child's horizontal slot so the layered DAG reads cleanly
    const f = (d.idx + .5) / d.n;
    const parents = byLayer(d.layer - 1).concat(d.layer > 1 && rnd() < .3 ? byLayer(d.layer - 2) : [])
      .sort((a, b) => Math.abs((a.idx + .5) / a.n - f) - Math.abs((b.idx + .5) / b.n - f));
    const k = 1 + (rnd() < .5 ? 1 : 0);
    const picked = new Set();
    for (let j = 0; j < k; j++) { const q = nodes.indexOf(parents[Math.floor(rnd() * Math.min(3, parents.length))]); if (!picked.has(q)) { picked.add(q); good.push([q, i]); } }
  });
  // cycles: edges pointing back up the layers
  for (let c = 0; c < CYCLES; c++) {
    const from = byLayer(1 + Math.floor(rnd() * 3)); const a = from[Math.floor(rnd() * from.length)];
    const to = byLayer(a.layer + 1 + Math.floor(rnd() * (LAYERS.length - a.layer - 1))); const b = to[Math.floor(rnd() * to.length)];
    bad.push([nodes.indexOf(b), nodes.indexOf(a)]);
  }
  // duplicated symbols: nodes that exist twice, linked sideways
  const dupIdx = [];
  while (dupIdx.length < DUPS) { const i = Math.floor(rnd() * nodes.length); if (!dupIdx.includes(i)) dupIdx.push(i); }
  dupIdx.forEach((i, k) => { nodes[i].dup = true; if (k % 2) bad.push([dupIdx[k - 1], i]); });

  let W = 0, H = 0, dpr = 1;
  function layout() {
    const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = 24, lh = (H - pad * 2 - 18) / (LAYERS.length - 1);
    for (const d of nodes) {
      const gutter = W > 520 ? 84 : 0; // room for layer labels on wide canvases
      d.bx = pad + (W - pad * 2 - gutter) * ((d.idx + .5) / d.n); d.by = pad + d.layer * lh;
      d.mxp = pad + (W - pad * 2) * d.mx; d.myp = pad + (H - pad * 2 - 18) * d.my;
    }
  }

  let state = 0; // 0 = make, 1 = bazel; progress p eases between
  let p = 0, target = 0, raf = 0, last = 0;
  const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const e = ease(p);
    for (const d of nodes) { d.x = lerp(d.mxp, d.bx, e); d.y = lerp(d.myp, d.by, e); }
    ctx.lineWidth = 1;
    // bad edges fade out as the graph untangles
    if (e < 1) {
      ctx.strokeStyle = rgba(FG2, .45 * (1 - e));
      ctx.setLineDash([3, 4]);
      for (const [a, b] of bad) { const A = nodes[a], B = nodes[b]; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo((A.x + B.x) / 2 + (A.y - B.y) * .35, (A.y + B.y) / 2 + (B.x - A.x) * .35, B.x, B.y); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    // good edges: straight once layered, wobbly before
    ctx.strokeStyle = rgba(MG, .25 + .45 * e);
    for (const [a, b] of good) {
      const A = nodes[a], B = nodes[b];
      ctx.beginPath(); ctx.moveTo(A.x, A.y);
      const bend = (1 - e) * 40 * ((a * 7 + b * 3) % 5 - 2) / 2;
      ctx.quadraticCurveTo((A.x + B.x) / 2 + bend, (A.y + B.y) / 2 - bend, B.x, B.y);
      ctx.stroke();
      if (e > .5) { // arrowhead for explicit direction
        const ang = Math.atan2(B.y - A.y, B.x - A.x), ax = B.x - Math.cos(ang) * 7, ay = B.y - Math.sin(ang) * 7;
        ctx.fillStyle = rgba(MG, (e - .5) * 2 * .8);
        ctx.beginPath(); ctx.moveTo(ax + Math.cos(ang) * 4, ay + Math.sin(ang) * 4); ctx.lineTo(ax + Math.cos(ang + 2.4) * 4, ay + Math.sin(ang + 2.4) * 4); ctx.lineTo(ax + Math.cos(ang - 2.4) * 4, ay + Math.sin(ang - 2.4) * 4); ctx.fill();
      }
    }
    // nodes
    for (const d of nodes) {
      const s = 7;
      const dupAlpha = d.dup ? (1 - e) : 0;
      ctx.fillStyle = rgba(BG, 1); ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s);
      ctx.strokeStyle = dupAlpha > 0 ? rgba(FG, .4 + .5 * dupAlpha) : rgba(MG, .9);
      ctx.strokeRect(d.x - s / 2, d.y - s / 2, s, s);
      if (dupAlpha > 0) { ctx.strokeStyle = rgba(FG, .6 * dupAlpha); ctx.strokeRect(d.x - s / 2 + 3, d.y - s / 2 + 3, s, s); }
    }
    // layer labels appear in the Bazel world
    if (e > .6 && W > 520) {
      ctx.font = "9px JetBrains Mono, monospace"; ctx.textAlign = "right"; ctx.fillStyle = rgba(MG, (e - .6) / .4 * .7);
      const names = ["//app", "//control", "//drivers", "//platform", "//third_party"];
      const pad = 24, lh = (H - pad * 2 - 18) / (LAYERS.length - 1);
      names.forEach((n, i) => ctx.fillText(n, W - 4, pad + i * lh - 8));
    }
  }

  function counters(e) {
    cCycles.textContent = String(Math.round(lerp(CYCLES, 0, e)));
    cDups.textContent = String(Math.round(lerp(DUPS, 0, e)));
    const ok = e >= 1;
    cRepro.textContent = ok ? "✓" : "✗";
    cRepro.classList.toggle("semi-ok", ok); cRepro.classList.toggle("semi-no", !ok);
  }

  function tick(now) {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
    const dir = Math.sign(target - p);
    p = Math.max(0, Math.min(1, p + dir * dt / 1.6));
    draw(); counters(ease(p));
    if (p !== target) raf = requestAnimationFrame(tick); else last = 0;
  }
  function setState(s) {
    state = s; target = s;
    toggle.setAttribute("aria-pressed", String(!!s));
    toggle.firstChild.textContent = s ? "Back to Make " : "Migrate to Bazel ";
    label.textContent = s ? "Bazel world · explicit DAG" : "Make world · implicit dependencies";
    canvas.setAttribute("aria-label", s
      ? "Dependency graph of about forty build targets laid out as a layered directed acyclic graph with explicit, arrowed edges and no cycles."
      : "Dependency graph of about forty build targets, tangled, with dashed edges marking seven cycles and twelve duplicated symbols.");
    if (reduced) { p = target; draw(); counters(ease(p)); return; }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  toggle.addEventListener("click", () => setState(state ? 0 : 1));

  layout(); draw(); counters(0);
  document.addEventListener("fgl:theme", (ev) => { loadPalette(ev.detail?.dark ?? window.ATMO.isDark()); draw(); });
  if ("ResizeObserver" in window) new ResizeObserver(() => { layout(); draw(); }).observe(canvas.parentElement);
  else addEventListener("resize", () => { layout(); draw(); });
})();
