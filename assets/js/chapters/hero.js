/* Hero atmosphere: a slow star field with a faint orbital grid, plus a UTC clock. */
(() => {
  const ATMO = window.ATMO;
  let stars = [];
  window.ATMO.register("hero", {
    init(canvas, ctx, s) { this.resize(s); },
    resize(s) {
      const n = Math.round((s.w * s.h) / 9000);
      stars = Array.from({ length: n }, () => ({ x: Math.random() * s.w, y: Math.random() * s.h, r: Math.random() * 1.3 + .2, p: Math.random() * Math.PI * 2, v: .2 + Math.random() * .6 }));
    },
    draw(ctx, s, t) {
      ctx.clearRect(0, 0, s.w, s.h);
      // orbital grid
      ctx.strokeStyle = ATMO.rgba("--cy", 0.09); ctx.lineWidth = 1;
      const cx = s.w * .78, cy = s.h * .25;
      for (let r = 120; r < Math.max(s.w, s.h) * 1.2; r += 120) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * s.w * 1.5, cy + Math.sin(a) * s.w * 1.5); ctx.stroke(); }
      // stars
      for (const st of stars) {
        const a = .35 + .35 * Math.sin(t * st.v + st.p);
        ctx.fillStyle = ATMO.isDark() ? `rgba(232,238,247,${a.toFixed(3)})` : `rgba(14,26,38,${(a * 0.5).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
      }
      // a satellite tracing the outer ring
      const ang = t * .12, R = 360;
      ctx.fillStyle = ATMO.rgba("--cy", 0.9); ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, 2.2, 0, Math.PI * 2); ctx.fill();
    },
  });
  const clock = document.getElementById("hero-clock");
  if (clock) { const tick = () => { clock.textContent = "UTC " + new Date().toISOString().slice(11, 19); }; tick(); setInterval(tick, 1000); }
})();
