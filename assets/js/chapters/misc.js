/* Quiet atmospheres for the papers and contact chapters: a faint reading-grid
   and a few drifting beacon dots, so the stack never goes empty. */
(() => {
  const quiet = (seed) => ({
    draw(ctx, s, t) {
      ctx.clearRect(0, 0, s.w, s.h);
      ctx.strokeStyle = window.ATMO.rgba("--cy", 0.07); ctx.lineWidth = 1;
      for (let x = 0; x < s.w; x += 96) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s.h); ctx.stroke(); }
      for (let y = 0; y < s.h; y += 96) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.w, y); ctx.stroke(); }
      for (let i = 0; i < 6; i++) {
        const x = ((i * 977 + seed * 131) % s.w), y = ((i * 613 + seed * 71) % s.h);
        const a = 0.25 + 0.25 * Math.sin(t * 0.8 + i);
        ctx.fillStyle = window.ATMO.rgba("--cy", a);
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      }
    },
  });
  window.ATMO.register("papers", quiet(3));
  window.ATMO.register("contact", quiet(7));
})();
