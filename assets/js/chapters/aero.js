/* Aerospace chapter: radar atmosphere (night sky, sweep from the lower right,
   range rings, drifting contacts) and the in-section radar scope with six
   mission blips placed by start date. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- atmosphere ---------------- */
  let stars = [], contacts = [];
  // Palette from CSS tokens, rebuilt on every theme toggle (core calls theme()).
  const col = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, a).toFixed(3)})`;
  const pal = { star: [232, 238, 247], ink: [79, 227, 193], k: 1, dark: true };
  function loadPalette(isDark) {
    const A = window.ATMO;
    pal.dark = !!isDark;
    pal.k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--atmo-alpha")) || 1;
    pal.ink = A.rgb("--cy");
    pal.star = isDark ? A.rgb("--fg") : A.rgb("--cy"); // light: faint teal specks instead of white stars
    if (!isDark) pal.k *= .75;
  }
  window.ATMO.register("aero", {
    init(canvas, ctx, s) { loadPalette(window.ATMO.isDark()); this.resize(s); },
    theme(isDark) { loadPalette(isDark); },
    resize(s) {
      const n = Math.round((s.w * s.h) / 14000);
      stars = Array.from({ length: n }, () => ({ x: Math.random() * s.w, y: Math.random() * s.h, r: Math.random() * 1.2 + .2, p: Math.random() * 6.28, v: .15 + Math.random() * .5 }));
      contacts = Array.from({ length: 6 }, (_, i) => ({ a: Math.random() * 6.28, d: .25 + Math.random() * .7, va: (Math.random() - .5) * .01, vd: (Math.random() - .5) * .004, seen: -10, i }));
    },
    draw(ctx, s, t, dt) {
      ctx.clearRect(0, 0, s.w, s.h);
      const cx = s.w * .94, cy = s.h * 1.04, R = Math.hypot(s.w, s.h) * 1.05;
      // stars
      for (const st of stars) {
        const a = (.22 + .25 * Math.sin(t * st.v + st.p)) * pal.k * (pal.dark ? 1 : .6);
        ctx.fillStyle = col(pal.star, a);
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.2832); ctx.fill();
      }
      // range rings and bearing lines
      ctx.lineWidth = 1; ctx.strokeStyle = col(pal.ink, .07 * pal.k);
      for (let r = 130; r < R; r += 130) { ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI * 1.5); ctx.stroke(); }
      for (let i = 0; i <= 6; i++) { const a = Math.PI + (Math.PI / 2) * (i / 6); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
      // sweep: one quarter turn (left to up) every ~14 s, with a trailing wedge
      const period = 14, ph = reduced ? .55 : ((t / period) % 1);
      const ang = Math.PI + (Math.PI / 2) * ph; // from pointing left (PI) to pointing up (1.5 PI)
      const trail = .42, steps = 28;
      for (let k = 0; k < steps; k++) {
        const a0 = ang - trail * (k + 1) / steps, a1 = ang - trail * k / steps;
        if (a1 < Math.PI) break;
        const al = .085 * (1 - k / steps);
        ctx.fillStyle = col(pal.ink, al * pal.k);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, Math.max(a0, Math.PI), a1); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = col(pal.ink, .28 * pal.k); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.stroke();
      // drifting contacts, lit when the sweep passes, fading afterwards
      for (const c of contacts) {
        if (!reduced) { c.a += c.va * dt; c.d += c.vd * dt; }
        if (c.d < .2) { c.d = .2; c.vd = Math.abs(c.vd); } else if (c.d > .95) { c.d = .95; c.vd = -Math.abs(c.vd); }
        const ca = Math.PI + (Math.PI / 2) * (((c.a % 1) + 1) % 1);
        if (Math.abs(ca - ang) < .02 || (reduced && c.i % 2)) c.seen = t;
        const age = t - c.seen, al = reduced ? .5 : Math.max(0, .75 - age * .14);
        if (al <= 0) continue;
        const x = cx + Math.cos(ca) * R * c.d, y = cy + Math.sin(ca) * R * c.d;
        if (x < s.w * .18 || x > s.w * .82 || y < 0) { // keep bright marks out of the centre column
          ctx.fillStyle = col(pal.ink, al * .9 * pal.k);
          ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.2832); ctx.fill();
          ctx.strokeStyle = col(pal.ink, al * .35 * pal.k); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.stroke();
        }
      }
    },
  });

  /* ---------------- radar scope ---------------- */
  const scope = document.getElementById("aero-scope");
  if (!scope) return;
  const blips = [...scope.querySelectorAll(".aero-blip")];
  const sweep = document.getElementById("aero-sweep");
  const ro = { cs: document.getElementById("aero-ro-cs"), role: document.getElementById("aero-ro-role"), when: document.getElementById("aero-ro-when") };
  const DEFAULT = { cs: "— hover or focus a blip —", role: "six missions, one blip per project start", when: "Jun 2019 – Jul 2022" };
  const T0 = 2019 * 12 + 5, SPAN = 37; // Jun 2019 .. Jul 2022

  // place blips: angle by start month (clockwise from the top), radius from data-r
  blips.forEach((b) => {
    const [y, m] = b.dataset.m.split("-").map(Number);
    const months = y * 12 + (m - 1) - T0;
    const th = (months / SPAN) * Math.PI * 2, r = parseFloat(b.dataset.r) * 47.5; // 190/400 = 47.5% of the box
    b.style.left = (50 + Math.sin(th) * r).toFixed(2) + "%";
    b.style.top = (50 - Math.cos(th) * r).toFixed(2) + "%";
    b.dataset.deg = ((th * 180) / Math.PI).toFixed(1);
  });

  const logButtons = [...document.querySelectorAll(".aero-log-list [data-blip]")];
  function byId(id) { return blips.find((b) => b.dataset.dive === id); }
  function show(b) {
    ro.cs.textContent = b ? b.dataset.cs : DEFAULT.cs;
    ro.role.textContent = b ? b.dataset.role : DEFAULT.role;
    ro.when.textContent = b ? b.dataset.when : DEFAULT.when;
    blips.forEach((x) => x.classList.toggle("is-hot", x === b));
    logButtons.forEach((x) => x.classList.toggle("is-hot", !!b && x.dataset.blip === b.dataset.dive));
  }
  blips.forEach((b) => {
    b.addEventListener("mouseenter", () => show(b));
    b.addEventListener("focus", () => show(b));
    b.addEventListener("mouseleave", () => show(null));
    b.addEventListener("blur", () => show(null));
  });
  logButtons.forEach((l) => {
    const b = byId(l.dataset.blip);
    l.addEventListener("mouseenter", () => show(b));
    l.addEventListener("focus", () => show(b));
    l.addEventListener("mouseleave", () => show(null));
    l.addEventListener("blur", () => show(null));
  });

  // sweep: rotates while the scope is on screen; pings blips as it passes
  let deg = 0, raf = 0, last = 0, visible = false;
  function setSweep(d) { sweep.setAttribute("transform", `rotate(${d.toFixed(2)} 200 200)`); }
  function tick(now) {
    raf = 0;
    if (!visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, .1) : 0;
    last = now;
    const prev = deg;
    deg = (deg + dt * 40) % 360; // one turn every 9 s
    blips.forEach((b) => {
      const d = parseFloat(b.dataset.deg);
      const crossed = prev <= deg ? (d > prev && d <= deg) : (d > prev || d <= deg);
      if (crossed) { b.classList.add("is-ping"); setTimeout(() => b.classList.remove("is-ping"), 900); }
    });
    setSweep(deg);
    raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf && visible && !reduced) raf = requestAnimationFrame(tick); }
  if (reduced) { setSweep(200); }
  else if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; kick(); }, { threshold: .05 }).observe(scope);
    document.addEventListener("visibilitychange", kick);
  } else { visible = true; kick(); }
})();
