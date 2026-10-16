/* core.js: shared behaviour for every chapter.
   - Atmosphere stack: fixed canvases behind the page, one per chapter,
     cross-faded by how much of the chapter is on screen.
   - Dive-in panels: <dialog class="dive"> opened by [data-dive], hash deep links.
   - Click-to-load YouTube posters, nav state, HUD, progress bar, copy buttons.

   Chapter scripts register an atmosphere with:
     window.ATMO.register("aero", { init(canvas, ctx, size), draw(ctx, size, t, dt), resize(size) })
   where size = { w, h, dpr }. draw() is called only while the layer is visible.
*/
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------- atmosphere stack ---------------- */
  const stack = $("#atmo");
  const layers = new Map(); // id -> { el, canvas, ctx, api, size, opacity, inited }
  /* Theme and palette helpers for chapter atmospheres:
       ATMO.isDark()            -> boolean
       ATMO.rgba("--acc", .5)   -> "rgba(r,g,b,a)" from a CSS token, alpha scaled by --atmo-alpha
       ATMO.rgb("--cy")         -> [r,g,b]
     Atmospheres may also implement api.theme(isDark) to rebuild cached colours. */
  const root = document.documentElement;
  const cssCache = new Map();
  function tokenRGB(name) {
    const key = name + "|" + (root.dataset.theme || "light");
    if (cssCache.has(key)) return cssCache.get(key);
    let v = getComputedStyle(root).getPropertyValue(name).trim();
    let rgb = [127, 127, 127];
    if (/^#/.test(v)) {
      const h = v.slice(1); const n = h.length >= 6 ? h : h.split("").map((c) => c + c).join("");
      rgb = [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
    } else { const m = v.match(/[\d.]+/g); if (m && m.length >= 3) rgb = m.slice(0, 3).map(Number); }
    cssCache.set(key, rgb); return rgb;
  }
  const ATMO = {
    isDark() { return root.dataset.theme === "dark"; },
    rgb: tokenRGB,
    rgba(name, a = 1) { const [r, g, b] = tokenRGB(name); const k = parseFloat(getComputedStyle(root).getPropertyValue("--atmo-alpha")) || 1; return `rgba(${r},${g},${b},${Math.min(1, a * k).toFixed(3)})`; },
    register(id, api) {
      const el = document.createElement("div");
      el.className = "layer";
      el.dataset.atmo = id;
      const canvas = document.createElement("canvas");
      el.append(canvas);
      stack.append(el);
      const L = { el, canvas, ctx: canvas.getContext("2d"), api, size: { w: 0, h: 0, dpr: 1 }, opacity: 0, inited: false, last: 0 };
      layers.set(id, L);
      sizeLayer(L);
      if (L.opacity > 0 || reduced) ensureInit(L);
    },
    reduced,
  };
  window.ATMO = ATMO;

  function sizeLayer(L) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    L.size = { w, h, dpr };
    L.canvas.width = Math.round(w * dpr);
    L.canvas.height = Math.round(h * dpr);
    L.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (L.inited) { L.api.resize?.(L.size); if (reduced) safeDraw(L, 0, 0); }
  }
  function ensureInit(L) {
    if (L.inited) return;
    L.inited = true;
    try { L.api.init?.(L.canvas, L.ctx, L.size); } catch (e) { console.error("atmo init", e); }
    if (reduced) safeDraw(L, 0, 0);
  }
  function safeDraw(L, t, dt) { try { L.api.draw?.(L.ctx, L.size, t, dt); } catch (e) { console.error("atmo draw", e); L.api.draw = null; } }

  let raf = 0, t0 = 0;
  function loop(now) {
    raf = 0;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    let anyVisible = false;
    layers.forEach((L) => {
      if (L.opacity <= 0.01) return;
      anyVisible = true;
      ensureInit(L);
      const dt = L.last ? Math.min((now - L.last) / 1000, 0.1) : 0;
      L.last = now;
      safeDraw(L, t, dt);
    });
    if (anyVisible && !reduced && !document.hidden) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && !reduced) raf = requestAnimationFrame(loop); }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });

  // Visibility of each chapter -> layer opacity. Chapters carry data-atmo="id".
  const chapters = $$(".chapter[data-atmo]");
  const hudChapter = $("#hud-chapter"), hudAlt = $("#hud-alt");
  function updateAtmo() {
    const vh = innerHeight;
    let best = null, bestRatio = 0;
    chapters.forEach((c) => {
      const r = c.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      const ratio = Math.min(1, visible / Math.min(vh, r.height));
      const L = layers.get(c.dataset.atmo);
      if (L) { L.opacity = ratio; L.el.style.opacity = ratio.toFixed(3); if (ratio > 0.01) { ensureInit(L); } else { L.last = 0; } }
      if (ratio > bestRatio) { bestRatio = ratio; best = c; }
    });
    // Hero (no data-atmo) still gets its own layer via id "hero".
    const hero = $(".chapter-hero");
    if (hero) {
      const r = hero.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      const ratio = Math.min(1, visible / Math.min(vh, r.height));
      const L = layers.get("hero");
      if (L) { L.opacity = ratio; L.el.style.opacity = ratio.toFixed(3); if (ratio > 0.01) ensureInit(L); }
      if (ratio > bestRatio) { bestRatio = ratio; best = hero; }
    }
    if (best) {
      const acc = best.dataset.acc; if (acc) document.documentElement.dataset.acc = acc; else delete document.documentElement.dataset.acc;
      const label = best.dataset.hud || best.querySelector("h2, h1")?.textContent?.trim().slice(0, 22) || "";
      if (hudChapter) hudChapter.textContent = label;
      $$(".nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + best.id));
    }
    const doc = document.documentElement;
    const p = doc.scrollHeight > vh ? scrollY / (doc.scrollHeight - vh) : 0;
    const bar = $("#progress-bar"); if (bar) bar.style.width = (p * 100).toFixed(1) + "%";
    if (hudAlt) hudAlt.textContent = "ALT " + Math.round(scrollY / 10).toString().padStart(4, "0");
    kick();
  }
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; updateAtmo(); }); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { layers.forEach(sizeLayer); updateAtmo(); });
  addEventListener("load", updateAtmo);
  // Layers may register after DOMContentLoaded (deferred chapter scripts), so run once more on next tick.
  setTimeout(updateAtmo, 0);
  setTimeout(updateAtmo, 300);

  /* ---------------- dive-in panels ---------------- */
  function openDive(id, push = true) {
    const d = document.getElementById(id);
    if (!d || d.tagName !== "DIALOG") return;
    $$("dialog.dive[open]").forEach((o) => { if (o !== d) o.close(); });
    if (!d.open) d.showModal();
    loadVideos(d);
    if (push) history.replaceState(null, "", "#" + id);
  }
  function closeDive(d) { if (d.open) d.close(); }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-dive]");
    if (t) { e.preventDefault(); openDive(t.dataset.dive); return; }
    const c = e.target.closest(".dive-close");
    if (c) { closeDive(c.closest("dialog")); return; }
    const d = e.target.closest("dialog.dive");
    if (d && e.target === d) closeDive(d); // backdrop click
  });
  $$("dialog.dive").forEach((d) => d.addEventListener("close", () => {
    d.querySelectorAll("iframe").forEach((f) => { const box = f.closest(".video"); if (box) { box.replaceChildren(); box.dataset.loaded = ""; buildPoster(box); } });
    if (location.hash === "#" + d.id) history.replaceState(null, "", location.pathname + location.search);
  }));
  function fromHash() {
    const id = location.hash.slice(1);
    if (id && document.getElementById(id)?.classList.contains("dive")) openDive(id, false);
  }
  addEventListener("hashchange", fromHash);
  addEventListener("DOMContentLoaded", fromHash);

  /* ---------------- videos ---------------- */
  const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l15 8-15 8z"/></svg>';
  const linkOnly = document.body.hasAttribute("data-video-links");
  function buildPoster(el) {
    if (el.dataset.built === "1") return;
    el.dataset.built = "1";
    const id = el.dataset.yt, title = el.dataset.title || "Project video";
    const img = document.createElement("img");
    img.className = "thumb"; img.alt = ""; img.loading = "lazy";
    img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    img.onerror = () => img.remove();
    const b = document.createElement(linkOnly ? "a" : "button");
    if (linkOnly) { b.href = `https://www.youtube.com/watch?v=${id}`; b.target = "_blank"; b.rel = "noopener"; b.className = "poster"; }
    else b.type = "button";
    b.setAttribute("aria-label", `Play video: ${title}`);
    b.innerHTML = `<span class="play">${playIcon}</span><span class="vt"></span>`;
    b.querySelector(".vt").textContent = title;
    if (!linkOnly) b.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      f.title = title;
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      el.replaceChildren(f);
      el.dataset.built = "";
    });
    el.append(img, b);
  }
  function loadVideos(root = document) { $$(".video[data-yt]", root).forEach(buildPoster); }
  loadVideos();

  /* ---------------- theme toggle (light by default) ---------------- */
  const themeBtn = $("#theme-btn");
  function applyTheme(dark, persist) {
    if (dark) root.dataset.theme = "dark"; else delete root.dataset.theme;
    cssCache.clear();
    themeBtn?.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#070b14" : "#f1f4f7");
    layers.forEach((L) => { if (L.inited) { try { L.api.theme?.(dark); } catch (e) { console.error("atmo theme", e); } if (reduced) safeDraw(L, 0, 0); } });
    if (persist) { try { localStorage.setItem("fgl-theme", dark ? "dark" : "light"); } catch {} }
    document.dispatchEvent(new CustomEvent("fgl:theme", { detail: { dark } }));
    kick();
  }
  themeBtn?.addEventListener("click", () => applyTheme(!ATMO.isDark(), true));
  applyTheme(ATMO.isDark(), false);

  /* ---------------- nav, copy, misc ---------------- */
  const toggle = $("#nav-toggle"), mnav = $("#mobile-nav");
  toggle?.addEventListener("click", () => { const open = mnav.hidden; mnav.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); });
  mnav?.addEventListener("click", (e) => { if (e.target.closest("a")) { mnav.hidden = true; toggle.setAttribute("aria-expanded", "false"); } });

  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Copied"; }
    catch { const v = b.parentElement.querySelector(".v"); if (v) { const r = document.createRange(); r.selectNodeContents(v); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } b.textContent = "Selected"; }
    setTimeout(() => (b.textContent = "Copy"), 1600);
  }));
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  // Reveal-on-scroll for elements marked [data-reveal]; visible by default, animated in when supported.
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$("[data-reveal]").forEach((el) => { el.classList.add("reveal"); io.observe(el); });
  }
})();
