/* Chapter 06 · Terminal: fake kitty/tmux window with the five dotfiles themes,
   the Alt+q sessionizer and Alt+w projects pickers, plus a quiet log-stream atmosphere. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- palettes: themes/<name>/colors.sh (+ kitty.conf for gentle) ---------- */
  const THEMES = {
    lavender: { bg: "#1e1e2e", surface: "#313244", overlay: "#45475a", fg: "#cdd6f4", acc: "#cba6f7", sec: "#f5c2e7", blue: "#89b4fa", cyan: "#89dceb", green: "#a6e3a1", yellow: "#f9e2af", red: "#f38ba8", orange: "#fab387",
      prompt: "❯ ", sprompt: "session ✦ ", pointer: "✦", current: "✦", attached: "◈", age: "◷", tmux: { session: "✦ ", host: "⬡ ", time: "◈ ", cpu: "◆ ", net: "◉ " } },
    rose: { bg: "#191724", surface: "#26233a", overlay: "#403d52", fg: "#e0def4", acc: "#eb6f92", sec: "#f6c177", blue: "#9ccfd8", cyan: "#ebbcba", green: "#31748f", yellow: "#f6c177", red: "#eb6f92", orange: "#ea9a97",
      prompt: "❯ ", sprompt: "session ✿ ", pointer: "✿", current: "✿", attached: "♡", age: "◷", tmux: { session: "✿ ", host: "⬡ ", time: "◈ ", cpu: "♡ ", net: "◉ " } },
    mint: { bg: "#1e2326", surface: "#272e33", overlay: "#374145", fg: "#d3c6aa", acc: "#83c092", sec: "#a7c080", blue: "#7fbbb3", cyan: "#83c092", green: "#a7c080", yellow: "#dbbc7f", red: "#e67e80", orange: "#e69875",
      prompt: "❯ ", sprompt: "session ◈ ", pointer: "◈", current: "◈", attached: "✦", age: "◷", tmux: { session: "◈ ", host: "⬡ ", time: "✦ ", cpu: "◆ ", net: "◉ " } },
    peach: { bg: "#1f1f28", surface: "#2a2a37", overlay: "#363646", fg: "#dcd7ba", acc: "#ffa066", sec: "#ff9e64", blue: "#7e9cd8", cyan: "#6a9589", green: "#98bb6c", yellow: "#e6c384", red: "#e46876", orange: "#ffa066",
      prompt: "❯ ", sprompt: "session ◆ ", pointer: "◆", current: "◆", attached: "◈", age: "◷", tmux: { session: "◆ ", host: "⬡ ", time: "◈ ", cpu: "✦ ", net: "◉ " } },
    // gentle = "terminal defaults" (fzf fg:-1,bg:-1): bg/fg follow the page theme (the CSS token
    // fallbacks on .term-win); its muted ANSI accents come from colors.sh, darkened on the light page.
    gentle: { acc: "#5f87af", sec: "#af5fff", blue: "#5f87af", cyan: "#5fd7ff", green: "#5faf5f", yellow: "#afaf87", red: "#d7005f", orange: "#d7875f",
      light: { acc: "#3d6a94", sec: "#7a3fcc", blue: "#3d6a94", cyan: "#1f8aa6", green: "#3f8a3f", yellow: "#7f7a3a", red: "#b8004f", orange: "#b35a2f" },
      prompt: "∷ ", sprompt: "session ▷ ", pointer: "▶", current: "◆", attached: "·", age: "", tmux: { session: "", host: "", time: "", cpu: "", net: "" } },
  };

  /* ---------- fake sessions (illustrative pane contents) ---------- */
  // Starship line: directory (cyan) · git branch (purple) · status (red) · runtime · duration (yellow) · ❯
  const P = (dir, branch, status, extra, took) =>
    `<span class="d">${dir}</span>${branch ? ` on <span class="g">${branch}</span>` : ""}${status ? ` <span class="s">[${status}]</span>` : ""}${extra || ""}${took ? ` took <span class="y">${took}</span>` : ""}\n`;
  const C = (cmd) => `<span class="c">❯</span> <span class="k">${cmd}</span>\n`;
  const SESSIONS = [
    { name: "portfolio", cwd: "~/gt/portfolio/crew/main", windows: ["zsh", "nvim", "serve"], age: "2h", attached: true, cmd: "python3",
      panes: [
        P("~/gt/portfolio/crew/main", "main", "!3 ?1", "", "") + C("python3 build.py") + `index.html: 9 chapters, 9 chapter css, 9 chapter js\n` + P("~/gt/portfolio/crew/main", "main", "!3 ?1", "", "") + C("git diff --stat | delta") + ` src/chapters/50-terminal.html | 142 <span class="c">++++++++++</span>\n assets/css/chapters/term.css   |  96 <span class="c">+++++++</span>\n`,
        P("~/gt/portfolio/crew/main", "main", "!3 ?1", "", "") + C("nvim src/chapters/50-terminal.html") + `<span class="m">  1 </span>&lt;!-- css: chapters/term.css  js: chapters/term.js --&gt;\n<span class="m">  2 </span>&lt;section class="chapter" id="term" data-atmo="term"&gt;\n<span class="m">  3 </span>  &lt;div class="wrap"&gt;\n<span class="m">-- INSERT --                                   3,1</span>\n`,
        P("~/gt/portfolio/crew/main", "main", "", "", "") + C("python3 -m http.server 8765") + `Serving HTTP on 0.0.0.0 port 8765 (http://0.0.0.0:8765/) ...\n127.0.0.1 - - "GET /index.html HTTP/1.1" 200 -\n127.0.0.1 - - "GET /assets/css/core.css HTTP/1.1" 200 -\n127.0.0.1 - - "GET /assets/js/chapters/term.js HTTP/1.1" 200 -\n`,
      ] },
    { name: "asml-build", cwd: "~/gt/build-infra/crew/bazel", windows: ["ws", "test"], age: "1d", attached: false, cmd: "bazel",
      panes: [
        P("~/gt/build-infra/crew/bazel", "bazel", "+2", "", "3m12s") + C("bazel build //...") + `<span class="c">INFO:</span> Analyzed 412 targets (0 packages loaded, 0 targets configured).\n<span class="c">INFO:</span> Found 412 targets...\n<span class="c">INFO:</span> Build completed successfully, 1 total action\n`,
        P("~/gt/build-infra/crew/bazel", "bazel", "+2", "", "") + C("bazel test //... --test_output=errors") + `//tools:lint_test        <span class="c">PASSED</span> in 0.4s\n//tools:config_test      <span class="c">PASSED</span> in 1.1s\n\nExecuted 2 out of 2 tests: <span class="c">2 tests pass</span>.\n`,
      ] },
    { name: "drones", cwd: "~/gt/drones/crew/perception", windows: ["ros", "rviz"], age: "3d", attached: false, cmd: "roslaunch",
      panes: [
        P("~/gt/drones/crew/perception", "perception", "!1", " via <span class=\"y\">🐍 3.12</span>", "") + C("roslaunch perception detector.launch") + `<span class="m">[INFO]</span> started roslaunch server\n<span class="m">[INFO]</span> /detector: subscribed to /camera/image_raw\n<span class="m">[INFO]</span> /detector: 24.8 Hz, 3 tracks\n`,
        P("~/gt/drones/crew/perception", "perception", "!1", "", "") + C("rostopic hz /detector/tracks") + `average rate: 24.812\n\tmin: 0.039s max: 0.042s std dev: 0.00071s window: 50\n`,
      ] },
    { name: "dotfiles", cwd: "~/gt/dotfiles/crew/itguy", windows: ["zsh", "themes"], age: "5h", attached: false, cmd: "zsh",
      panes: [
        P("~/gt/dotfiles/crew/itguy", "itguy", "", "", "") + C("./install.sh") + `<span class="k">[info]</span>  Linking dotfiles with dotbot\n<span class="c">[ok]</span>    ~/.zshrc -> zsh/zshrc\n<span class="c">[ok]</span>    ~/.tmux.conf -> tmux/tmux.conf\n<span class="c">[ok]</span>    ~/.local/bin/tmux-sessionizer -> scripts/tmux-sessionizer\n<span class="c">[ok]</span>    tmux plugins installed\n` + P("~/gt/dotfiles/crew/itguy", "itguy", "", "", "") + C("test/validate.sh") + `<span class="c">all links resolve</span>\n`,
        P("~/gt/dotfiles/crew/itguy/themes", "itguy", "", "", "") + C("ls") + `current-kitty.conf  gentle  lavender  mint  peach  rose\n` + P("~/gt/dotfiles/crew/itguy/themes", "itguy", "", "", "") + C("grep THEME_ACCENT */colors.sh") + `lavender/colors.sh:export THEME_ACCENT="#cba6f7"\nmint/colors.sh:export THEME_ACCENT="#83c092"\npeach/colors.sh:export THEME_ACCENT="#ffa066"\nrose/colors.sh:export THEME_ACCENT="#eb6f92"\n`,
      ] },
    { name: "alikindoi", cwd: "~/gt/alikindoi/crew/main", windows: ["api", "scrape"], age: "8h", attached: false, cmd: "uvicorn",
      panes: [
        P("~/gt/alikindoi/crew/main/backend", "main", "", " via <span class=\"y\">🐍 3.12 (.venv)</span>", "") + C("python -m alikindoi serve") + `<span class="c">INFO:</span>     Uvicorn running on http://127.0.0.1:8000\n<span class="c">INFO:</span>     Application startup complete.\n`,
        P("~/gt/alikindoi/crew/main/backend", "main", "", " via <span class=\"y\">🐍 3.12 (.venv)</span>", "41s") + C("python -m alikindoi scrape") + `remotive      <span class="c">ok</span>   38 jobs, 4 new\nhimalayas     <span class="c">ok</span>   21 jobs, 1 new\n`,
      ] },
  ];
  // tmuxinator layouts from the repo (Town.yml, tslam.yml); "running" ones preview their pane
  const PROJECTS = [
    { name: "Town", running: false, yaml: `<span class="pk">name:</span> Town\n<span class="pk">root:</span> ~/\n\n<span class="pk">windows:</span>\n  - <span class="pc">gt:</span>\n      <span class="pk">layout:</span> main-vertical\n      <span class="pk">root:</span> ~/gt\n  - <span class="pc">symbol-manager:</span>\n      <span class="pk">root:</span> ~/gt/symbol_manager/crew/lowlevel\n  - <span class="pc">dotfiles:</span>\n      <span class="pk">root:</span> ~/gt/dotfiles/crew/itguy\n` },
    { name: "tslam", running: false, yaml: `<span class="pk">name:</span> tslam\n<span class="pk">root:</span> ~/gt/tslam/crew/cpp\n\n<span class="pk">windows:</span>\n  - <span class="pc">ws:</span>\n      <span class="pk">panes:</span>\n        -\n  - <span class="pc">test:</span>\n      <span class="pk">panes:</span>\n        -\n        -\n` },
    { name: "portfolio", running: true, session: 0 },
  ];

  const win = $("#term-win"); if (!win) return;
  const pane = $("#term-pane"), popup = $("#term-popup"), list = $("#term-fzf-list"), preview = $("#term-preview");
  const altq = $("#term-altq"), stWindows = $("#term-st-windows"), stSession = $("#term-st-session");
  const state = { theme: "lavender", session: 0, window: 0, mode: null, sel: 0, items: [], returnTo: null };

  /* ---------- theme ---------- */
  function applyTheme(name) {
    const T = THEMES[name]; if (!T) return;
    state.theme = name; win.dataset.theme = name;
    for (const k of ["bg", "surface", "overlay", "fg", "acc", "sec", "blue", "cyan", "green", "yellow", "red", "orange"]) win.style.removeProperty("--t-" + k);
    const C = Object.assign({}, T, !window.ATMO?.isDark() && T.light ? T.light : null);
    for (const [k, v] of Object.entries(C)) if (typeof v === "string" && /^#/.test(v)) win.style.setProperty("--t-" + k, v);
    $$(".term-theme").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.theme === name)));
    render();
  }
  $$(".term-theme").forEach((b) => {
    const T = THEMES[b.dataset.theme];
    b.style.setProperty("--sw", T.acc); if (T.bg) b.style.setProperty("--sw-bg", T.bg);
    b.addEventListener("click", () => applyTheme(b.dataset.theme));
  });

  /* ---------- render pane + status ---------- */
  function render() {
    const T = THEMES[state.theme], S = SESSIONS[state.session];
    const html = (S.panes[state.window] || S.panes[0]).replaceAll("❯", T.prompt.trim());
    pane.innerHTML = html + P(S.cwd, "", "", "", "") + `<span class="c">${T.prompt.trim()}</span> <span class="cur"></span>`;
    stSession.textContent = `${T.tmux.session}${S.name}`;
    stWindows.replaceChildren(...S.windows.map((w, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "term-st-win"; b.textContent = `${i + 1}:${w}`;
      b.setAttribute("aria-current", String(i === state.window)); b.setAttribute("aria-label", `Window ${i + 1}: ${w}`);
      b.addEventListener("click", () => selectWindow(i)); return b;
    }));
    $("#term-st-host").textContent = `${T.tmux.host}jerez`;
    $("#term-st-time").textContent = `${T.tmux.time}${new Date().toLocaleString("en", { month: "short", day: "2-digit" })}  ${new Date().toTimeString().slice(0, 5)}`;
    $("#term-st-cpu").textContent = `${T.tmux.cpu}cpu:0.42 mem:31%`;
    $("#term-st-net").textContent = `${T.tmux.net}↓12K ↑3K`;
    $(".term-title").textContent = `kitty · tmux · ${S.name}`;
  }
  function selectWindow(i) { const S = SESSIONS[state.session]; if (i < S.windows.length) { state.window = i; render(); } }

  /* ---------- fzf popup ---------- */
  function openPopup(mode) {
    const T = THEMES[state.theme];
    state.mode = mode; state.sel = 0;
    state.returnTo = document.activeElement && win.contains(document.activeElement) ? document.activeElement : altq;
    if (mode === "sessions") {
      state.items = SESSIONS.map((s, i) => ({ s, i }));
      $("#term-popup-label").textContent = `${T.current} tmux sessions`;
      $(".term-fzf-glyph").textContent = T.sprompt;
      $("#term-fzf-header").innerHTML = `current: ${SESSIONS[state.session].name}<br>Enter:go Esc:quit ?:preview<br>PgUp/Dn:scroll Home/End:jump<br>Alt+p:toggle Alt+w:cycle`;
      popup.setAttribute("aria-label", "tmux sessions");
    } else {
      state.items = PROJECTS.map((p, i) => ({ p, i }));
      $("#term-popup-label").textContent = `${T.current} tmuxinator projects`;
      $(".term-fzf-glyph").textContent = T.sprompt.replace("session", "project");
      $("#term-fzf-header").innerHTML = `Enter:start/switch Esc:quit<br>Alt+o:config/session Alt+e:edit<br>Alt+p:toggle Alt+w:cycle`;
      popup.setAttribute("aria-label", "tmuxinator projects");
    }
    $("#term-fzf-info").textContent = `${state.items.length}/${state.items.length}`;
    $("#term-fzf-query").textContent = "";
    list.replaceChildren(...state.items.map((it, i) => {
      const o = document.createElement("div"); o.className = "term-fzf-opt"; o.id = `term-opt-${i}`; o.setAttribute("role", "option"); o.dataset.i = i;
      if (mode === "sessions") {
        const s = it.s, cur = i === state.session;
        o.innerHTML = `<span class="ptr">${T.pointer}</span><span><span class="nm">${s.name}</span><span class="meta">: ${s.windows.length}w${s.attached ? " " + T.attached : ""} ${T.age ? T.age + " " : ""}${s.age} ago  </span><span class="cwd">${s.cwd}</span>${cur ? ` <span class="mark">${T.current}</span>` : ""}</span>`;
      } else {
        o.innerHTML = `<span class="ptr">${T.pointer}</span><span><span class="nm">${it.p.name}</span>${it.p.running ? `  <span class="mark">${T.attached === "·" ? "active" : T.attached}</span>` : ""}</span>`;
      }
      o.addEventListener("mouseenter", () => setSel(i)); o.addEventListener("click", () => { setSel(i); choose(); });
      return o;
    }));
    popup.hidden = false; altq.setAttribute("aria-expanded", "true");
    setSel(0); list.focus();
  }
  function setSel(i) {
    state.sel = Math.max(0, Math.min(state.items.length - 1, i));
    $$(".term-fzf-opt", list).forEach((o, k) => o.setAttribute("aria-selected", String(k === state.sel)));
    list.setAttribute("aria-activedescendant", `term-opt-${state.sel}`);
    const T = THEMES[state.theme], it = state.items[state.sel];
    if (state.mode === "sessions") {
      const s = it.s;
      preview.innerHTML = `<span class="ph">${T.pointer} ${s.name}</span>  <span class="pc">${s.cwd}</span>  <span class="pk">(${s.cmd})</span>\n<span class="pr">────────────────────────────────────────────</span>\n` + s.panes[0].replaceAll("❯", T.prompt.trim());
    } else if (it.p.running) {
      const s = SESSIONS[it.p.session];
      preview.innerHTML = `<span class="ph">${T.pointer} ${it.p.name}</span>  <span class="pk">(running session)</span>\n<span class="pr">────────────────────────────────────────────</span>\n` + s.panes[0].replaceAll("❯", T.prompt.trim());
    } else {
      preview.innerHTML = `<span class="ph">${T.pointer} ${it.p.name}.yml</span>  <span class="pk">(bat --language yaml)</span>\n<span class="pr">────────────────────────────────────────────</span>\n` + it.p.yaml;
    }
    preview.scrollTop = state.mode === "sessions" ? preview.scrollHeight : 0;
  }
  function choose() {
    const it = state.items[state.sel];
    if (state.mode === "sessions") { state.session = it.i; state.window = 0; }
    else if (it.p.running) { state.session = it.p.session; state.window = 0; }
    else { // tmuxinator start: register a new session built from the layout
      let idx = SESSIONS.findIndex((s) => s.name === it.p.name);
      if (idx < 0) {
        const T = THEMES[state.theme];
        const wins = [...it.p.yaml.matchAll(/class="pc">([\w-]+):/g)].map((m) => m[1]);
        const root = (it.p.yaml.match(/root:<\/span> (\S+)/) || [])[1] || "~";
        SESSIONS.push({ name: it.p.name, cwd: root, windows: wins, age: "0s", attached: false, cmd: "zsh", panes: wins.map((w) => P(root, "", "", "", "") + C(`mux start ${it.p.name}`) + `<span class="m">tmuxinator: starting ${it.p.name} · window ${w}</span>\n`) });
        it.p.running = true; it.p.session = SESSIONS.length - 1; void T;
      } else it.p.running = true, it.p.session = idx;
      state.session = it.p.session; state.window = 0;
    }
    closePopup(); render();
  }
  function closePopup() {
    popup.hidden = true; altq.setAttribute("aria-expanded", "false"); state.mode = null;
    (state.returnTo || altq).focus();
  }
  list.addEventListener("keydown", (e) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey) return; // let the window handler see Alt combos
    const k = e.key;
    if (k === "ArrowDown" || (k === "n" && e.ctrlKey) || k === "j" && e.ctrlKey) { e.preventDefault(); setSel((state.sel + 1) % state.items.length); }
    else if (k === "ArrowUp" || (k === "p" && e.ctrlKey) || k === "k" && e.ctrlKey) { e.preventDefault(); setSel((state.sel - 1 + state.items.length) % state.items.length); }
    else if (k === "Home") { e.preventDefault(); preview.scrollTop = 0; }
    else if (k === "End") { e.preventDefault(); preview.scrollTop = preview.scrollHeight; }
    else if (k === "PageUp") { e.preventDefault(); preview.scrollTop -= preview.clientHeight / 2; }
    else if (k === "PageDown") { e.preventDefault(); preview.scrollTop += preview.clientHeight / 2; }
    else if (k === "Enter") { e.preventDefault(); choose(); }
    else if (k === "Escape") { e.preventDefault(); e.stopPropagation(); closePopup(); }
    else if (k === "?") { e.preventDefault(); preview.hidden = !preview.hidden; }
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey) { // fuzzy query: filter the visible items
      e.preventDefault(); typeQuery($("#term-fzf-query").textContent + k);
    } else if (k === "Backspace") { e.preventDefault(); typeQuery($("#term-fzf-query").textContent.slice(0, -1)); }
  });
  function typeQuery(q) {
    $("#term-fzf-query").textContent = q;
    const ql = q.toLowerCase(); let shown = 0, first = -1;
    $$(".term-fzf-opt", list).forEach((o, i) => {
      const name = (state.mode === "sessions" ? state.items[i].s.name : state.items[i].p.name).toLowerCase();
      let j = 0; for (const ch of name) if (ch === ql[j]) j++;
      const ok = j >= ql.length; o.hidden = !ok; if (ok) { shown++; if (first < 0) first = i; }
    });
    $("#term-fzf-info").textContent = `${shown}/${state.items.length}`;
    if (first >= 0 && list.querySelector(".term-fzf-opt[aria-selected=true]")?.hidden) setSel(first);
  }

  /* ---------- key bindings on the fake window (and on the whole section when focused) ---------- */
  const section = $("#term");
  section.addEventListener("keydown", (e) => {
    if (!e.altKey || e.ctrlKey || e.metaKey) {
      if (e.key === "Escape" && state.mode) { closePopup(); }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === "q") { e.preventDefault(); state.mode === "sessions" ? closePopup() : openPopup("sessions"); }
    else if (k === "w") { e.preventDefault(); state.mode === "projects" ? closePopup() : openPopup("projects"); }
    else if (/^[1-9]$/.test(k) && !state.mode) { e.preventDefault(); selectWindow(+k - 1); }
    else if (k === "p" && state.mode) { e.preventDefault(); preview.hidden = !preview.hidden; }
  });
  altq.addEventListener("click", () => (state.mode === "sessions" ? closePopup() : openPopup("sessions")));
  $$(".term-key").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.key;
    if (k === "q") openPopup("sessions"); else if (k === "w") openPopup("projects"); else selectWindow(+k - 1);
    if (k !== "q" && k !== "w") win.focus();
  }));
  // clicking the backdrop of the popup closes it, like Esc
  popup.addEventListener("click", (e) => { if (e.target === popup) closePopup(); });

  applyTheme("lavender");
  document.addEventListener("fgl:theme", () => applyTheme(state.theme)); // gentle re-reads the page theme
  const clock = setInterval(() => { if (document.hidden) return; const T = THEMES[state.theme]; $("#term-st-time").textContent = `${T.tmux.time}${new Date().toLocaleString("en", { month: "short", day: "2-digit" })}  ${new Date().toTimeString().slice(0, 5)}`; }, 30000);
  void clock;

  /* ---------- atmosphere: a faint mauve log stream (glow on dark, thin ink glyph columns on light) ---------- */
  const GLYPHS = "❯✦◈◆◉⬡│─┃┆·:;.,<>[]{}()=+-*/\\|~^#$%&@!?0123456789abcdefghijklmnopqrstuvwxyz";
  let cols = [], strip = null, cellH = 18, cellW = 36, lastSize = null;
  const ink = (a) => window.ATMO.rgba("--lv", a);
  function buildStrip(s) {
    // one tall offscreen strip of random glyphs per column, scrolled with drawImage (cheap)
    lastSize = s;
    const dark = window.ATMO.isDark();
    const rows = Math.ceil(s.h / cellH) + 2;
    cols = [];
    const n = Math.ceil(s.w / cellW);
    strip = document.createElement("canvas");
    strip.width = Math.round(n * cellW * s.dpr); strip.height = Math.round(rows * cellH * 2 * s.dpr);
    const c = strip.getContext("2d"); c.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    c.font = (dark ? "12px " : "300 11px ") + getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
    c.textBaseline = "top";
    for (let i = 0; i < n; i++) {
      const x = i * cellW + 8, cx = (i + .5) * cellW / s.w;          // 0..1 across the viewport
      const centre = Math.abs(cx - .5) < .28;                          // quieter behind the content column
      const base = dark ? (centre ? .035 : .07) : (centre ? .05 : .11);
      const alpha = base + Math.random() * (dark ? (centre ? .02 : .05) : (centre ? .03 : .07));
      cols.push({ x, speed: 6 + Math.random() * 18, off: Math.random() * rows * cellH, alpha, dir: Math.random() < .85 ? 1 : -1 });
      c.fillStyle = ink(alpha);
      for (let r = 0; r < rows * 2; r++) {
        if (Math.random() < .55) continue;                             // gaps, like a sparse log
        const g = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        c.fillText(g, x, r * cellH);
      }
      // the occasional brighter trace head
      if (Math.random() < .3) { c.fillStyle = ink(alpha * 2.2); c.fillText("❯", x, ((Math.random() * rows * 2) | 0) * cellH); c.fillStyle = ink(alpha); }
    }
  }
  window.ATMO.register("term", {
    init(canvas, ctx, s) { buildStrip(s); },
    resize(s) { buildStrip(s); },
    theme() { if (lastSize) buildStrip(lastSize); },
    draw(ctx, s, t) {
      ctx.clearRect(0, 0, s.w, s.h);
      const dark = window.ATMO.isDark();
      ctx.fillStyle = ink(dark ? .07 : .025); ctx.fillRect(0, 0, s.w, s.h);     // soft mauve wash
      if (!strip) return;
      const H = strip.height / s.dpr, half = H / 2;
      // draw each column as a vertical slice of the strip, wrapped
      for (const col of cols) {
        const y = ((col.off + t * col.speed * col.dir) % half + half) % half;
        const srcX = col.x - 8;
        ctx.drawImage(strip, srcX * s.dpr, 0, cellW * s.dpr, H * s.dpr, srcX, -y, cellW, H);
        if (y > half - s.h) ctx.drawImage(strip, srcX * s.dpr, 0, cellW * s.dpr, H * s.dpr, srcX, half - y, cellW, H);
      }
      // a soft blinking block cursor, off the centre column
      const on = reduced || Math.floor(t * 1.4) % 2 === 0;
      if (on) {
        ctx.fillStyle = ink(dark ? .28 : .2);
        ctx.fillRect(Math.round(s.w * .82), Math.round(s.h * .34), 9, 16);
        ctx.fillStyle = ink(dark ? .12 : .07);
        ctx.fillRect(Math.round(s.w * .82) - 3, Math.round(s.h * .34) - 3, 15, 22);
      }
    },
  });
})();
