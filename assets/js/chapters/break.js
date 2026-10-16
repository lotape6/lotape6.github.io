/* Holding-pattern chapter.
   1. Atmosphere "break": a faint racetrack loop drawn large and off-centre with
      one slow blip circling it, plus sparse drifting hex glyphs. Colours come
      from ATMO.rgba("--lv") so the layer works in both themes.
   2. Study radar: the same racetrack shape in an SVG, months Sep 2024 → Jan 2025
      along the lap, eight topic nodes (HTML buttons) sized by the months their
      track ran on the CV; hover/focus writes a readout; the legend filters groups. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const A = window.ATMO;

  /* Racetrack geometry: two straights joined by semicircles, clockwise from the
     top-left corner of the top straight. point(u) for u in [0,1), plus the SVG path. */
  function racetrack(L, R, T, B) {
    const r = (B - T) / 2, S = R - L, arc = Math.PI * r, len = 2 * S + 2 * arc;
    const cy = (T + B) / 2;
    function point(u) {
      let d = ((u % 1) + 1) % 1 * len;
      if (d < S) return [L + d, T];
      d -= S;
      if (d < arc) { const a = -Math.PI / 2 + d / r; return [R + Math.cos(a) * r, cy + Math.sin(a) * r]; }
      d -= arc;
      if (d < S) return [R - d, B];
      d -= S;
      const a = Math.PI / 2 + d / r; return [L + Math.cos(a) * r, cy + Math.sin(a) * r];
    }
    const path = `M${L},${T} H${R} A${r},${r} 0 0 1 ${R},${B} H${L} A${r},${r} 0 0 1 ${L},${T} Z`;
    return { point, path, len, r, cy };
  }

  /* ---------------- atmosphere ---------------- */
  let glyphs = [], trk = null, col = null, portraitA = false;
  const HEX = "0123456789abcdef";
  const hexWord = () => Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => HEX[Math.random() * 16 | 0] + HEX[Math.random() * 16 | 0]).join(" ");
  function palette() {
    col = {
      loop: A.rgba("--lv", .16), inner: A.rgba("--lv", .08), tick: A.rgba("--lv", .22),
      blip: A.rgba("--lv", .85), tail: A.rgba("--lv", .35), glyph: A.rgba("--lv", .26),
    };
  }
  A.register("break", {
    init(canvas, ctx, s) { palette(); this.resize(s); },
    theme() { palette(); },
    resize(s) {
      portraitA = s.w < s.h;
      // large and off-centre: the loop reaches past the right (or bottom) edge of the viewport
      if (!portraitA) {
        const r = Math.min(s.h * .34, s.w * .2), cx = s.w * .7, cy = s.h * .56, half = s.w * .34;
        trk = racetrack(cx - half, cx + half, cy - r, cy + r);
      } else {
        const r = Math.min(s.w * .42, s.h * .2), cx = s.w * .62, cy = s.h * .6, half = s.h * .3;
        const t = racetrack(cy - half, cy + half, cx - r, cx + r); // built sideways, then swapped
        trk = { point: (u) => { const [x, y] = t.point(u); return [y, x]; }, len: t.len };
      }
      const n = Math.round((s.w * s.h) / 60000);
      glyphs = Array.from({ length: n }, () => ({ x: Math.random() * s.w, y: Math.random() * s.h, v: 3 + Math.random() * 5, a: .4 + Math.random() * .6, w: hexWord() }));
    },
    draw(ctx, s, t) {
      ctx.clearRect(0, 0, s.w, s.h);
      if (!trk) return;
      // the loop: one thin line plus a dashed inner line, like a chart's holding fix
      ctx.lineWidth = 1.5; ctx.strokeStyle = col.loop; ctx.beginPath();
      for (let i = 0; i <= 160; i++) { const [x, y] = trk.point(i / 160); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.stroke();
      // month ticks: five across the lap
      ctx.strokeStyle = col.tick; ctx.lineWidth = 1;
      for (let k = 0; k < 5; k++) {
        const u = k / 5, [x, y] = trk.point(u), [x2, y2] = trk.point(u + .002);
        const ang = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * 7, y - Math.sin(ang) * 7); ctx.lineTo(x + Math.cos(ang) * 7, y + Math.sin(ang) * 7); ctx.stroke();
      }
      // drifting hex glyphs, rising slowly
      ctx.font = "11px JetBrains Mono, monospace"; ctx.textAlign = "left";
      for (const g of glyphs) {
        const y = ((g.y - t * g.v) % (s.h + 40) + s.h + 40) % (s.h + 40) - 20;
        ctx.globalAlpha = g.a; ctx.fillStyle = col.glyph; ctx.fillText(g.w, g.x, y);
      }
      ctx.globalAlpha = 1;
      // the blip: a lap every 48 s, with a short fading tail
      const u = .3 + t / 48;
      ctx.lineCap = "round";
      for (let i = 1; i <= 18; i++) {
        const [x1, y1] = trk.point(u - (i - 1) * .004), [x2, y2] = trk.point(u - i * .004);
        ctx.globalAlpha = 1 - i / 18; ctx.strokeStyle = col.tail; ctx.lineWidth = 2.5 * (1 - i / 20);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const [bx, by] = trk.point(u);
      ctx.fillStyle = col.blip; ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col.tail; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, 9 + 3 * Math.sin(t * 2), 0, Math.PI * 2); ctx.stroke();
    },
  });

  /* ---------------- study radar ---------------- */
  const track = document.getElementById("break-track");
  if (!track) return;
  const svg = document.getElementById("break-svg");
  const nodesEl = document.getElementById("break-nodes");
  const rk = document.getElementById("break-readout-k"), rt = document.getElementById("break-readout-t");
  const legend = document.getElementById("break-legend");
  const NS = "http://www.w3.org/2000/svg";

  const GROUPS = { off: "Offensive", def: "Defensive", ai: "AI", tool: "Alongside" };
  const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan"];
  // u = place on the lap (0 = Sep 2024, 1 = Feb 2025). Nodes sit inside the months
  // their CV track covered (cyber Sep–Jan, AI Sep–Nov); months sizes the dot.
  const NODES = [
    { id: "rag", label: "LLM / RAG", group: "ai", u: .05, months: 3, span: "Sep – Nov 2024",
      text: "Built <b>AIgen</b>, a retrieval-augmented agent that runs entirely on one machine: LlamaIndex to read and chunk documents, a Hugging Face embedding model, a local LLM for the answer and a Gradio chat page in front." },
    { id: "blue", label: "Blue team", group: "def", u: .15, months: 5, span: "Sep 2024 – Jan 2025",
      text: "Finished Hack The Box's <b>Intro to Blue Team</b> track (nine labs: logs, persistence, lures, ransomware, exfiltration, memory forensics) and worked LetsDefend SOC alerts: triage, phishing analysis, IOC validation, endpoint investigation, incident response." },
    { id: "vec", label: "Vector DBs", group: "ai", u: .24, months: 3, span: "Sep – Nov 2024",
      text: "PostgreSQL with the <b>pgvector</b> extension as the index: a VECTOR column per chunk, an HNSW index with cosine distance, and a retriever that embeds the question and pulls the nearest nodes with their scores." },
    { id: "red", label: "Red team", group: "off", u: .32, months: 5, span: "Sep 2024 – Jan 2025",
      text: "Hack The Box <b>CREST CRT</b> track, still in progress: enumeration with nmap, gobuster and ffuf, web exploitation, Linux and Windows privilege escalation, Active Directory enumeration with impacket and BloodHound, hash cracking." },
    { id: "gpu", label: "GPU inference", group: "ai", u: .45, months: 3, span: "Sep – Nov 2024",
      text: "llama-cpp-python compiled with <b>CUDA</b> (GGML_CUDA) so a GGUF model runs with part of its layers on the GPU; context window and offloaded layers tuned to what the card's memory allowed." },
    { id: "mal", label: "Malware analysis", group: "def", u: .53, months: 5, span: "Sep 2024 – Jan 2025",
      text: "Two real samples from <b>bazaar.abuse.ch</b>, analysed statically: de-obfuscating a JavaScript dropper and a base64 PowerShell stager with small Python scripts until the download URL fell out; checked against VirusTotal." },
    { id: "ctf", label: "CTFs", group: "off", u: .71, months: 5, span: "Sep 2024 – Jan 2025",
      text: "Capture-the-flag style write-ups alongside the tracks: a <b>Ringzer0 CTF</b> breach investigation reconstructed from a web server log full of URL-encoded SQL-injection payloads." },
    { id: "shell", label: "Shell craft", group: "tool", u: .9, months: 0, span: "undated",
      text: "Not a dated track: the dotfiles and tmux tooling from the terminal chapter kept growing throughout, and the one-page <b>ShellCheatsheet</b> was published later, in 2025." },
  ];
  const DEFAULT_K = "Hover or focus a node", DEFAULT_T = "Each node is one thing I studied. Size follows how many months its track ran on the CV; a node sits inside the months its track covered, not on a date.";
  const dotSize = (m) => (m >= 5 ? 22 : m >= 3 ? 16 : 11);

  let geo = null, W = 800, H = 420, portrait = false, blip = null, tail = null, raf = 0, visible = false, t0 = 0;
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.append(n); return n; };

  // buttons are created once; only their positions change on resize
  NODES.forEach((n) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "break-node"; b.dataset.group = n.group; b.dataset.id = n.id;
    b.setAttribute("aria-pressed", "false");
    b.style.setProperty("--d", dotSize(n.months) + "px");
    b.setAttribute("aria-label", `${n.label}, ${GROUPS[n.group]}, ${n.span}`);
    b.innerHTML = "<i aria-hidden=\"true\"></i><span></span>";
    b.querySelector("span").textContent = n.label;
    nodesEl.append(b); n.el = b;
  });

  function build() {
    portrait = track.clientWidth < 520;
    track.classList.toggle("is-portrait", portrait);
    if (!portrait) { W = 800; H = 420; geo = racetrack(250, 550, 70, 350); }
    else { W = 420; H = 640; const t = racetrack(150, 490, 110, 310); geo = { point: (u) => { const [x, y] = t.point(u); return [y, x]; }, len: t.len, path: null }; }
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const pts = (off, n = 160) => Array.from({ length: n + 1 }, (_, i) => geo.point(i / n)).map(([x, y]) => x.toFixed(1) + "," + y.toFixed(1)).join(" ");
    el("polygon", { class: "break-loop", points: pts(0) }, svg);
    // inner dashed line a few px inside, drawn as a scaled copy around the loop centre
    const inner = el("polygon", { class: "break-loop-in", points: pts(0) }, svg);
    inner.setAttribute("transform", `translate(${W / 2} ${H / 2}) scale(${portrait ? .9 : .93} ${portrait ? .93 : .9}) translate(${-W / 2} ${-H / 2})`);
    // month ticks and labels
    MONTHS.forEach((m, k) => {
      const u = k / 5, [x, y] = geo.point(u), [x2, y2] = geo.point(u + .002);
      const ang = Math.atan2(y2 - y, x2 - x) + Math.PI / 2, ox = Math.cos(ang), oy = Math.sin(ang);
      el("line", { class: "break-tick", x1: x - ox * 6, y1: y - oy * 6, x2: x + ox * 6, y2: y + oy * 6 }, svg);
      // labels go outward (away from the loop centre)
      const cx = W / 2, cy = H / 2, dir = Math.sign((x - cx) * ox + (y - cy) * oy) || 1;
      const lx = x + ox * dir * 16, ly = y + oy * dir * 16;
      const tx = el("text", { class: "break-month", x: lx, y: ly + 3.5, "text-anchor": Math.abs(ox) > .5 ? (ox * dir > 0 ? "start" : "end") : "middle" }, svg);
      tx.textContent = m + (k === 0 ? " 24" : k === 4 ? " 25" : "");
    });
    // the exit: Feb 2025, where the pattern was left
    { const [x, y] = geo.point(0);
      const t = el("text", { class: "break-exit", x: portrait ? x + 10 : x - 6, y: portrait ? y - 14 : y - 30, "text-anchor": portrait ? "start" : "end" }, svg);
      t.textContent = "Feb 25 · cleared ↗"; }
    tail = el("polyline", { class: "break-blip-tail", points: "" }, svg);
    blip = el("circle", { class: "break-blip", r: 4, cx: 0, cy: 0 }, svg);
    NODES.forEach((n) => { const [x, y] = geo.point(n.u); n.el.style.left = (x / W * 100).toFixed(2) + "%"; n.el.style.top = (y / H * 100).toFixed(2) + "%"; });
    placeBlip(reduced ? .3 : (t0 ? (performance.now() - t0) / 1000 / 40 : 0));
  }
  function placeBlip(u) {
    if (!blip) return;
    const [x, y] = geo.point(u);
    blip.setAttribute("cx", x.toFixed(1)); blip.setAttribute("cy", y.toFixed(1));
    tail.setAttribute("points", Array.from({ length: 10 }, (_, i) => geo.point(u - i * .006)).map(([a, b]) => a.toFixed(1) + "," + b.toFixed(1)).join(" "));
  }
  function loop(now) {
    raf = 0;
    if (!t0) t0 = now;
    placeBlip(((now - t0) / 1000 / 40) % 1);
    if (visible && !document.hidden) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!reduced && visible && !raf) raf = requestAnimationFrame(loop); }
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); kick(); }, { threshold: 0 }).observe(track);
  else { visible = true; kick(); }
  document.addEventListener("visibilitychange", kick);

  // readout
  let pinned = null;
  function show(n) {
    if (!n) { rk.textContent = DEFAULT_K; rt.textContent = DEFAULT_T; return; }
    rk.textContent = `${n.label} · ${GROUPS[n.group]} · ${n.span}`;
    rt.innerHTML = n.text;
  }
  NODES.forEach((n) => {
    n.el.addEventListener("mouseenter", () => show(n));
    n.el.addEventListener("focus", () => show(n));
    n.el.addEventListener("mouseleave", () => show(pinned));
    n.el.addEventListener("blur", () => show(pinned));
    n.el.addEventListener("click", () => {
      pinned = pinned === n ? null : n;
      NODES.forEach((m) => m.el.setAttribute("aria-pressed", String(m === pinned)));
      show(pinned || n);
    });
  });

  // legend: one group at a time, click again to clear
  let filter = null;
  legend.addEventListener("click", (e) => {
    const b = e.target.closest(".break-leg"); if (!b) return;
    filter = filter === b.dataset.group ? null : b.dataset.group;
    legend.querySelectorAll(".break-leg").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.group === filter)));
    track.classList.toggle("has-filter", !!filter);
    NODES.forEach((n) => n.el.classList.toggle("is-on", !filter || n.group === filter));
  });

  build();
  if ("ResizeObserver" in window) { let last = 0; new ResizeObserver(() => { const w = track.clientWidth; if (Math.abs(w - last) > 1) { last = w; build(); } }).observe(track); }
  else addEventListener("resize", build);
})();
