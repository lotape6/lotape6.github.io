/* Origins atmosphere: a faint topographic contour field drifting very slowly. */
(() => {
  window.ATMO.register("origins", {
    draw(ctx, s, t) {
      ctx.clearRect(0, 0, s.w, s.h);
      ctx.lineWidth = 1;
      const rows = 9;
      for (let i = 0; i < rows; i++) {
        const y0 = (s.h / (rows + 1)) * (i + 1);
        ctx.strokeStyle = window.ATMO.rgba("--cy", 0.07 + 0.04 * (i % 3));
        ctx.beginPath();
        for (let x = -20; x <= s.w + 20; x += 14) {
          const y = y0 + Math.sin(x * 0.006 + i * 1.3 + t * 0.08) * 22 + Math.sin(x * 0.021 - t * 0.05 + i) * 9;
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  });
})();
