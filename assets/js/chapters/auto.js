/* Automotive chapter.
   1. One state machine (Retracted → Key detected → Extended·lit → Grasped → Unlocked/open,
      branches: exit-warning hold, mechanical redundancy, crash-safe state) drives:
   2. a Three.js door bench (flush handle on a pivot, actuator, latch, ECU, harness; X-ray skin;
      key fob gliding in on a track; drag/keys to orbit; theme-aware lights; WebGL fallback),
   3. an SVG signal-flow board (generic nodes, CAN/LIN/discrete/mechanical links, packets),
   4. a "signals in play" list, and
   5. the atmosphere (headlight sweep: amber ink streaks in light, glow in dark).
   Everything is generic: no real signal names, timings, ids or thresholds. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const A = window.ATMO;
  const isDark = () => A.isDark();

  /* =============================== 1. state machine =============================== */
  const CRASH = ["crash", "Crash signal", "ghost"], CUT = ["cut", "Cut all electrics", "ghost"];
  const STATES = {
    retracted: { code: "S0", label: "RETRACTED", hint: "handle flush", bus: "LIN · sleep",
      note: "Handle flush with the door. The handle controller sleeps and waits for a wake-up from the vehicle access function.",
      acts: [["approach", "Walk up with the key"], CRASH, CUT],
      nodes: ["dhc", "pwr", "vaf"], edges: [["pwr-dhc", 1]],
      signals: [["pwr", "supply present", "discrete"], ["st", "position: flush", "local"], ["st", "controller asleep · wake-up armed", "LIN"]],
      scene: { ext: 0, lit: 0, open: 0, grasp: 0, power: 1, crash: 0 } },
    key: { code: "S1", label: "KEY DETECTED", hint: "key authenticated", bus: "CAN · vehicle access",
      note: "The access function has authenticated the digital key and asks the handle to extend. The request arrives over the vehicle bus (CAN).",
      acts: [["extend", "Extend"], ["leave", "Walk away", "ghost"], CRASH, CUT],
      nodes: ["fob", "vaf", "dhc", "pwr"], edges: [["fob-vaf", 1], ["vaf-dhc", 1], ["pwr-dhc", 1]],
      signals: [["in", "approach detected", "radio"], ["in", "key authenticated", "access fn"], ["out", "wake-up", "CAN"], ["out", "extend request", "CAN"]],
      scene: { ext: 0, lit: 0.25, open: 0, grasp: 0, power: 1, crash: 0 } },
    extended: { code: "S2", label: "EXTENDED · LIT", hint: "handle out · lit", bus: "LIN · motor + position",
      note: "The actuator drives the handle out while its position sensor is monitored; the light strip comes on in darkness. The handle reports “extended” back to the vehicle.",
      acts: [["grasp", "Grasp the handle"], ["leave", "Walk away", "ghost"], CRASH, CUT],
      nodes: ["vaf", "dhc", "act", "light", "pwr", "fob"], edges: [["dhc-act", 1], ["dhc-act", -1], ["vaf-dhc", -1], ["dhc-light", 1], ["pwr-dhc", 1]],
      signals: [["in", "extend request", "CAN"], ["out", "drive out", "LIN"], ["in", "position reached", "LIN"], ["out", "handle status: extended", "CAN"], ["out", "light on in darkness", "discrete"]],
      scene: { ext: 1, lit: 1, open: 0, grasp: 0, power: 1, crash: 0 } },
    grasped: { code: "S3", label: "GRASPED", hint: "touch sensed", bus: "LIN · touch → CAN · unlock request",
      note: "Capacitive sensing in the handle registers the grab. The handle raises an unlock request; the access function checks whether it is safe to release.",
      acts: [["pull", "Pull: open the door"], ["cyclist", "A cyclist is coming", "ghost"], ["release", "Let go", "ghost"], CRASH, CUT],
      nodes: ["touch", "dhc", "vaf", "exit", "pwr"], edges: [["touch-dhc", 1], ["vaf-dhc", -1], ["exit-vaf", 1], ["pwr-dhc", 1]],
      signals: [["in", "touch detected", "LIN"], ["out", "unlock request", "CAN"], ["in", "exit check: road clear", "CAN"], ["st", "position held", "LIN"]],
      scene: { ext: 1, lit: 1, open: 0, grasp: 1, power: 1, crash: 0 } },
    open: { code: "S4", label: "UNLOCKED · OPEN", hint: "door ajar", bus: "CAN · latch + door status",
      note: "The latch is released and the door reports ajar. The handle stays out until the door is closed and locked again.",
      acts: [["close", "Close and lock"], CRASH, CUT],
      nodes: ["vaf", "latch", "dhc", "pwr"], edges: [["vaf-latch", 1], ["vaf-latch", -1], ["vaf-dhc", 1], ["pwr-dhc", 1]],
      signals: [["out", "unlock request granted", "CAN"], ["out", "latch release", "CAN"], ["in", "door ajar", "CAN"], ["out", "hold extended", "CAN"]],
      scene: { ext: 1, lit: 0.6, open: 1, grasp: 0.3, power: 1, crash: 0 } },
    hold: { code: "B1", label: "EXIT-WARNING HOLD", hint: "latch held", bus: "CAN · exit warning → latch held",
      note: "The exit warning reports a road user approaching, so the unlock request is withheld. The handle moves, the door doesn’t.",
      acts: [["clear", "Road clear: open"], ["release", "Let go", "ghost"], CRASH, CUT],
      nodes: ["exit", "vaf", "dhc", "touch", "pwr"], edges: [["exit-vaf", 1], ["vaf-dhc", 1], ["touch-dhc", 1], ["vaf-latch", 0], ["pwr-dhc", 1]],
      signals: [["!", "hold: road user approaching", "CAN"], ["st", "unlock request withheld", "CAN"], ["out", "handle stays extended", "LIN"], ["out", "warning to occupant", "CAN"]],
      scene: { ext: 1, lit: 1, open: 0, grasp: 1, power: 1, crash: 0 } },
    mech: { code: "B2", label: "MECHANICAL REDUNDANCY", hint: "no power · cable path", bus: "no bus · all electrics off",
      note: "Nothing is powered: no key detection, no motor, no light. The handle can still be operated by hand and a mechanical path to the latch opens the door. BMW reports Euro NCAP confirmed this after every crash test.",
      acts: [["power", "Power back on"]],
      nodes: ["act", "latch"], off: ["fob", "vaf", "dhc", "pwr", "light", "touch", "exit", "crash"], edges: [["act-latch", 1]],
      signals: [["!", "power loss: mechanical path", "discrete"], ["st", "no bus traffic", "CAN · LIN"], ["st", "handle operable by hand", "mechanical"], ["out", "latch released by cable", "mechanical"]],
      scene: { ext: 0.6, lit: 0, open: 0.7, grasp: 1, power: 0, crash: 0 } },
    crash: { code: "B3", label: "CRASH-SAFE STATE", hint: "safe state", bus: "discrete · crash → CAN · safe state",
      note: "A crash signal puts the function in its safe state: doors unlocked, handles kept reachable, no automatic retraction until the vehicle is reset.",
      acts: [["reset", "Reset the vehicle"], CUT],
      nodes: ["crash", "vaf", "dhc", "latch", "act"], edges: [["crash-vaf", 1], ["vaf-latch", 1], ["vaf-dhc", 1], ["dhc-act", 1]],
      signals: [["!", "crash detected", "discrete"], ["out", "safe state: unlock all doors", "CAN"], ["out", "handles reachable · no retract", "LIN"], ["st", "key detection suspended", "CAN"]],
      scene: { ext: 1, lit: 1, open: 0.25, grasp: 0, power: 1, crash: 1 } },
  };
  const NEXT = {
    retracted: { approach: "key", cut: "mech", crash: "crash" },
    key: { extend: "extended", leave: "retracted", cut: "mech", crash: "crash" },
    extended: { grasp: "grasped", leave: "retracted", cut: "mech", crash: "crash" },
    grasped: { pull: "open", cyclist: "hold", release: "extended", cut: "mech", crash: "crash" },
    open: { close: "retracted", cut: "mech", crash: "crash" },
    hold: { clear: "open", release: "extended", cut: "mech", crash: "crash" },
    mech: { power: "retracted" },
    crash: { reset: "retracted", cut: "mech" },
  };

  const rail = $("#auto-rail"), actions = $("#auto-actions"), stateOut = $("#auto-stage-state");
  const busOut = $("#auto-note-bus"), textOut = $("#auto-note-text"), hintOut = $("#auto-3d-hint"), boardState = $("#auto-board-state");
  const range = $("#auto-dist"), distOut = $("#auto-dist-out");
  const sigList = $("#auto-signal-list"), sigCount = $("#auto-signals-count");
  if (!rail || !actions || !range) return;

  let state = "retracted", timer = 0, dist = 10;
  const DETECT = 2; // metres, demo value only
  const listeners = [];
  let visible = false, raf = 0, last = 0, t0 = 0, pending = false;
  const onState = (fn) => listeners.push(fn);

  function render() {
    const S = STATES[state];
    rail.querySelectorAll(".auto-node").forEach((n) => {
      const on = n.dataset.node === state;
      n.classList.toggle("is-on", on);
      if (on) n.setAttribute("aria-current", "step"); else n.removeAttribute("aria-current");
    });
    stateOut.textContent = S.label;
    busOut.textContent = S.bus;
    textOut.textContent = S.note;
    if (hintOut) hintOut.textContent = S.hint;
    if (boardState) boardState.textContent = S.code + " · " + S.label.toLowerCase();
    actions.replaceChildren(...S.acts.map(([act, label, ghost]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn" + (ghost ? " ghost" : ""); b.dataset.act = act; b.textContent = label;
      return b;
    }));
    if (sigList) {
      sigList.replaceChildren(...S.signals.map(([k, v, via], i) => {
        const li = document.createElement("li");
        li.className = "auto-signal" + (k === "!" ? " is-warn" : "");
        li.style.animationDelay = (i * 60) + "ms";
        const kk = document.createElement("span"); kk.className = "auto-signal-k"; kk.textContent = k === "!" ? "!" : k;
        const vv = document.createElement("span"); vv.className = "auto-signal-v"; vv.textContent = v;
        const ww = document.createElement("span"); ww.className = "auto-signal-via"; ww.textContent = via;
        li.append(kk, vv, ww);
        return li;
      }));
      if (sigCount) sigCount.textContent = String(S.signals.length);
    }
    const atCar = state === "grasped" || state === "open" || state === "hold";
    range.disabled = atCar || state === "mech" || state === "crash";
    if (atCar && dist > 0.5) setDist(0.5, false);
    listeners.forEach((fn) => fn(state, S));
  }
  function go(next) {
    if (!next || !STATES[next] || next === state) return;
    clearTimeout(timer); timer = 0;
    state = next;
    render();
    // key detected -> extend on its own after a beat (the real handle does not wait for a click)
    if (state === "key") timer = setTimeout(() => { if (state === "key") go("extended"); }, reduced ? 0 : 800);
  }
  function fire(evt) { go(NEXT[state]?.[evt]); }
  actions.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    if (act === "approach") { setDist(1.5, true); return; }
    if (act === "leave") { setDist(6, true); return; }
    fire(act);
  });

  /* walk towards the car */
  const distListeners = [];
  function setDist(d, drive) {
    d = Math.max(0, Math.min(10, Math.round(d * 2) / 2));
    dist = d;
    range.value = String(d);
    distOut.textContent = d.toFixed(1) + " m";
    distListeners.forEach((fn) => fn(d));
    if (drive !== false) {
      if (d <= DETECT && state === "retracted") fire("approach");
      else if (d > DETECT && (state === "key" || state === "extended")) fire("leave");
    }
  }
  range.addEventListener("input", () => setDist(+range.value, true));
  $("#auto-step-fwd")?.addEventListener("click", () => setDist(+range.value - 1, true));
  $("#auto-step-back")?.addEventListener("click", () => setDist(+range.value + 1, true));

  /* =============================== 2. signal-flow board (SVG) =============================== */
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
  const NODES = [
    ["fob", "Digital Key", "fob · phone"], ["crash", "Crash signal", "airbag controller"], ["exit", "Exit warning", "rear sensor"],
    ["vaf", "Vehicle access", "central · zonal"], ["dhc", "Handle controller", "door handle ECU"], ["pwr", "Power supply", "+ mech. backup"],
    ["latch", "Latch · lock", "actuator"], ["act", "Handle actuator", "motor · position"], ["touch", "Touch sensing", "capacitive"], ["light", "Exterior light", "handle strip"],
  ];
  const POS = {
    wide: { vb: "0 0 640 380", fob: [80, 60], crash: [80, 150], exit: [80, 240], vaf: [330, 110], dhc: [330, 240], pwr: [330, 340], latch: [560, 60], act: [560, 150], touch: [560, 240], light: [560, 330] },
    narrow: { vb: "0 0 360 570", latch: [95, 40], fob: [95, 120], crash: [95, 200], exit: [95, 280], pwr: [95, 360], act: [95, 440], touch: [95, 525], vaf: [272, 200], dhc: [272, 400], light: [272, 525] },
  };
  // [id, from, to, type, perpendicular offset, label, optional per-layout route + label pose]
  const EDGES = [
    ["fob-vaf", "fob", "vaf", "rf", -6, "radio"],
    ["crash-vaf", "crash", "vaf", "dsc", 4, "discrete"],
    ["exit-vaf", "exit", "vaf", "can", 14, "CAN"],
    ["vaf-latch", "vaf", "latch", "can", -16, "CAN"],
    ["vaf-dhc", "vaf", "dhc", "can", 0, "CAN"],
    ["dhc-act", "dhc", "act", "lin", -10, "LIN"],
    ["touch-dhc", "touch", "dhc", "lin", 10, "LIN"],
    ["dhc-light", "dhc", "light", "dsc", 0, "discrete", { wideOff: 10 }],
    ["pwr-dhc", "pwr", "dhc", "dsc", -10, "supply"],
    ["act-latch", "act", "latch", "mec", 0, "mechanical", { narrow: { d: "M36,440 H14 V40 H36", label: [14, 240, -90] } }],
  ];
  const NW = 118, NH = 44;
  const board = $("#auto-board-svg");
  const B = { nodes: {}, edges: {}, packets: [], mode: "" };
  if (board) {
    const gEdges = el("g", { class: "auto-edges" }, board), gLabels = el("g", {}, board), gNodes = el("g", {}, board), gPk = el("g", {}, board);
    for (const e of EDGES) {
      const path = el("path", { class: "auto-be auto-be-" + e[3], "data-edge": e[0] }, gEdges);
      const lab = el("g", { class: "auto-bl" }, gLabels);
      const r = el("rect", { rx: 2, height: 13 }, lab); const t = el("text", { "text-anchor": "middle", y: 9.5 }, lab); t.textContent = e[5];
      B.edges[e[0]] = { def: e, path, lab, r, t, len: 1 };
    }
    for (const [id, n, s] of NODES) {
      const g = el("g", { class: "auto-bn", "data-node": id }, gNodes);
      el("rect", { width: NW, height: NH, rx: 4 }, g);
      const t1 = el("text", { x: 12, y: 19 }, g); t1.textContent = n;
      const t2 = el("text", { x: 12, y: 33, class: "auto-bn-sub" }, g); t2.textContent = s;
      el("circle", { class: "auto-bn-dot", cx: NW - 10, cy: 11, r: 2.5 }, g);
      B.nodes[id] = g;
    }
    B.gPk = gPk;
  }
  function anchor(from, to, off) {
    // returns [x, y, horizontal?] on the side of `from` that faces `to`
    const dx = to[0] - from[0], dy = to[1] - from[1];
    if (Math.abs(dx) >= Math.abs(dy)) return [from[0] + Math.sign(dx) * NW / 2, from[1] + off, true];
    return [from[0] + off, from[1] + Math.sign(dy) * NH / 2, false];
  }
  function layoutBoard(mode) {
    if (!board || B.mode === mode) return;
    B.mode = mode;
    const P = POS[mode];
    board.setAttribute("viewBox", P.vb);
    for (const id in B.nodes) B.nodes[id].setAttribute("transform", `translate(${P[id][0] - NW / 2} ${P[id][1] - NH / 2})`);
    for (const id in B.edges) {
      const E = B.edges[id], [, a, b, , off0, , extra] = E.def;
      const off = (mode === "wide" && extra?.wideOff != null) ? extra.wideOff : off0;
      const custom = extra?.[mode];
      let d, lx, ly, rot = 0;
      if (custom) { d = custom.d; [lx, ly, rot] = custom.label; }
      else {
        const pa = anchor(P[a], P[b], off), pb = anchor(P[b], P[a], off);
        if (pa[2]) { const mx = (pa[0] + pb[0]) / 2; d = `M${pa[0]},${pa[1]} C${mx},${pa[1]} ${mx},${pb[1]} ${pb[0]},${pb[1]}`; }
        else { const my = (pa[1] + pb[1]) / 2; d = `M${pa[0]},${pa[1]} C${pa[0]},${my} ${pb[0]},${my} ${pb[0]},${pb[1]}`; }
        lx = (pa[0] + pb[0]) / 2; ly = (pa[1] + pb[1]) / 2;
      }
      E.path.setAttribute("d", d);
      E.len = E.path.getTotalLength() || 1;
      const w = E.t.getComputedTextLength ? Math.max(28, E.t.getComputedTextLength() + 10) : 40;
      E.r.setAttribute("width", w); E.r.setAttribute("x", -w / 2); E.r.setAttribute("y", 0);
      E.lab.setAttribute("transform", `translate(${lx} ${ly - 6.5})` + (rot ? ` rotate(${rot} 0 6.5)` : ""));
    }
    drawPackets(0, true);
  }
  let active = { edges: [], nodes: new Set(), off: new Set() };
  function applyBoard(S) {
    if (!board) return;
    active = { edges: S.edges, nodes: new Set(S.nodes), off: new Set(S.off || []) };
    for (const id in B.nodes) { B.nodes[id].classList.toggle("is-on", active.nodes.has(id)); B.nodes[id].classList.toggle("is-off", active.off.has(id)); }
    const live = new Map(S.edges.map(([id, dir]) => [id, dir]));
    for (const id in B.edges) {
      const on = live.has(id) && live.get(id) !== 0, hold = live.get(id) === 0;
      B.edges[id].path.classList.toggle("is-on", on);
      B.edges[id].path.classList.toggle("is-hold", hold);
      B.edges[id].lab.classList.toggle("is-on", on || hold);
    }
    // packets: two per moving edge
    const want = S.edges.filter(([, dir]) => dir !== 0);
    while (B.packets.length < want.length * 2) {
      const halo = el("circle", { class: "auto-bp-halo", r: 7 }, B.gPk), dot = el("circle", { class: "auto-bp", r: 3 }, B.gPk);
      B.packets.push({ halo, dot });
    }
    B.packets.forEach((p, i) => { const on = i < want.length * 2; p.halo.style.display = on ? "" : "none"; p.dot.style.display = on ? "" : "none"; });
    drawPackets(0, true);
  }
  function drawPackets(t, still) {
    if (!board) return;
    const want = active.edges.filter(([, dir]) => dir !== 0);
    want.forEach(([id, dir], i) => {
      const E = B.edges[id]; if (!E) return;
      for (let k = 0; k < 2; k++) {
        const p = B.packets[i * 2 + k]; if (!p) continue;
        let u = still ? (k ? 0.72 : 0.28) : ((t * 0.32 + k * 0.5 + i * 0.13) % 1);
        if (dir < 0) u = 1 - u;
        const pt = E.path.getPointAtLength(u * E.len);
        p.halo.setAttribute("cx", pt.x.toFixed(1)); p.halo.setAttribute("cy", pt.y.toFixed(1));
        p.dot.setAttribute("cx", pt.x.toFixed(1)); p.dot.setAttribute("cy", pt.y.toFixed(1));
      }
    });
  }
  const narrowMQ = matchMedia("(max-width: 640px)");
  const relayout = () => layoutBoard(narrowMQ.matches ? "narrow" : "wide");
  narrowMQ.addEventListener?.("change", relayout);
  relayout();
  onState((_, S) => applyBoard(S));

  /* =============================== 3. the door in 3D =============================== */
  const box = $("#auto-3d"), canvas = $("#auto-3d-canvas"), fallback = $("#auto-3d-fallback"), xrayBtn = $("#auto-xray");
  let three = null;
  function init3D() {
    const T = window.THREE;
    if (!T || !box || !canvas) return null;
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
      if (!renderer.getContext()) return null;
    } catch (e) { return null; }
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1.6, 0.1, 40);
    const target = new T.Vector3(0.25, -0.2, 0);
    const col = (name) => { const [r, g, b] = A.rgb(name); return new T.Color(r / 255, g / 255, b / 255); };

    /* lights */
    const hemi = new T.HemisphereLight(0xffffff, 0x303640, 0.8); scene.add(hemi);
    const key = new T.DirectionalLight(0xffffff, 1.1); key.position.set(3, 5, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 0.5, far: 20 }); key.shadow.bias = -0.0008;
    scene.add(key);
    const fill = new T.DirectionalLight(0xbfd4ff, 0.4); fill.position.set(-4, 2, 3); scene.add(fill);
    const rim = new T.DirectionalLight(0xffb454, 1.2); rim.position.set(-2, 2.5, -4); scene.add(rim);
    const warm = new T.PointLight(0xffb454, 0.6, 9, 2); warm.position.set(2.6, 0.4, 2.2); scene.add(warm);

    /* materials */
    const M = {
      paint: new T.MeshStandardMaterial({ color: 0x1c2129, metalness: 0.78, roughness: 0.32, side: T.DoubleSide }),
      inner: new T.MeshStandardMaterial({ color: 0x12161c, metalness: 0.2, roughness: 0.85, side: T.DoubleSide }),
      glass: new T.MeshStandardMaterial({ color: 0x4a5c70, metalness: 0.95, roughness: 0.06, transparent: true, opacity: 0.5, side: T.DoubleSide }),
      pocket: new T.MeshStandardMaterial({ color: 0x05070a, metalness: 0.3, roughness: 0.9 }),
      handle: new T.MeshStandardMaterial({ color: 0x2a313b, metalness: 0.85, roughness: 0.25, emissive: 0xffb454, emissiveIntensity: 0 }),
      strip: new T.MeshStandardMaterial({ color: 0x111111, emissive: 0xffb454, emissiveIntensity: 0, roughness: 0.4 }),
      metal: new T.MeshStandardMaterial({ color: 0x9aa1aa, metalness: 0.7, roughness: 0.45 }),
      dark: new T.MeshStandardMaterial({ color: 0x2b323c, metalness: 0.4, roughness: 0.7 }),
      ecu: new T.MeshStandardMaterial({ color: 0x1f2a36, metalness: 0.3, roughness: 0.6 }),
      wire: new T.MeshStandardMaterial({ color: 0x5b6672, metalness: 0.2, roughness: 0.8 }),
      cable: new T.MeshStandardMaterial({ color: 0x7c8690, metalness: 0.6, roughness: 0.5, emissive: 0xffb454, emissiveIntensity: 0 }),
      led: new T.MeshStandardMaterial({ color: 0x111111, emissive: 0xffb454, emissiveIntensity: 0 }),
      packet: new T.MeshBasicMaterial({ color: 0xffb454 }),
      fob: new T.MeshStandardMaterial({ color: 0x14181e, metalness: 0.5, roughness: 0.45 }),
      ring: new T.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false }),
      shadow: new T.ShadowMaterial({ opacity: 0.35 }),
      track: new T.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.5 }),
    };
    const accentMats = [M.handle, M.strip, M.cable, M.led, M.packet, M.ring, M.track];
    const envMats = [M.paint, M.glass, M.handle, M.metal, M.dark, M.ecu, M.fob, M.inner, M.cable];

    const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene, shadow = true) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = shadow; parent.add(m); return m; };
    const roundRect = (x, y, w, h, r) => { const s = new T.Shape(); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
    const poly = (pts) => { const s = new T.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };

    /* door: pivot on the hinge edge (x = -1.5) */
    const hinge = new T.Group(); hinge.position.set(-1.5, 0, 0); scene.add(hinge);
    const door = new T.Group(); door.position.set(1.5, 0, 0); hinge.add(door);
    const outline = poly([[-1.5, -1], [1.5, -1], [1.5, 0.35], [1.42, 0.5], [1.15, 0.92], [1.05, 1.0], [-1.3, 1.0], [-1.42, 0.95], [-1.5, 0.75]]);
    const winHole = poly([[-1.3, 0.44], [1.26, 0.44], [1.05, 0.84], [0.96, 0.9], [-1.18, 0.9], [-1.28, 0.84]]);
    const pocketHole = roundRect(0.5, -0.14, 0.64, 0.2, 0.05);
    outline.holes.push(winHole, pocketHole);
    const skinGeo = new T.ExtrudeGeometry(outline, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 6 });
    const skin = mesh(skinGeo, M.paint, 0, 0, 0, door);
    const glass = mesh(new T.ShapeGeometry(winHole), M.glass, 0, 0, 0.02, door, false);
    // character line + sill
    mesh(new T.BoxGeometry(2.7, 0.018, 0.012), M.paint, -0.05, -0.32, 0.07, door, false);
    mesh(new T.BoxGeometry(2.96, 0.05, 0.3), M.dark, 0, -1.0, -0.12, door);
    // inner panel (lower body only; the window stays open)
    const inner = mesh(new T.BoxGeometry(2.92, 1.36, 0.02), M.inner, 0, -0.3, -0.33, door);
    // handle pocket (tray behind the hole)
    const pk = new T.Group(); pk.position.set(0.82, -0.04, 0); door.add(pk);
    mesh(new T.BoxGeometry(0.64, 0.2, 0.012), M.pocket, 0, 0, -0.12, pk);
    mesh(new T.BoxGeometry(0.012, 0.2, 0.13), M.pocket, -0.32, 0, -0.06, pk);
    mesh(new T.BoxGeometry(0.012, 0.2, 0.13), M.pocket, 0.32, 0, -0.06, pk);
    mesh(new T.BoxGeometry(0.64, 0.012, 0.13), M.pocket, 0, 0.1, -0.06, pk);
    mesh(new T.BoxGeometry(0.64, 0.012, 0.13), M.pocket, 0, -0.1, -0.06, pk);
    // the flush handle: pivots at its forward (hinge-side) end, slides out on z
    const pivot = new T.Group(); pivot.position.set(0.53, -0.04, 0.012); door.add(pivot);
    const handleGeo = new T.ExtrudeGeometry(roundRect(0, -0.07, 0.56, 0.14, 0.045), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 6 });
    const handle = mesh(handleGeo, M.handle, 0, 0, 0, pivot);
    const strip = mesh(new T.BoxGeometry(0.46, 0.01, 0.01), M.strip, 0.28, -0.062, 0.046, pivot, false);
    mesh(new T.CylinderGeometry(0.014, 0.014, 0.3, 10), M.metal, 0.28, 0, -0.15, pivot).rotation.x = Math.PI / 2; // push rod into the actuator
    // actuator + position sensor behind the pocket, bracket plate, latch, ECU, hinge connector
    const act = new T.Group(); act.position.set(0.82, -0.04, -0.21); door.add(act);
    mesh(new T.BoxGeometry(0.3, 0.18, 0.16), M.dark, 0, 0, 0, act);
    mesh(new T.CylinderGeometry(0.05, 0.05, 0.18, 14), M.metal, 0.24, 0, 0, act).rotation.z = Math.PI / 2; // motor
    mesh(new T.CylinderGeometry(0.07, 0.07, 0.03, 16), M.metal, 0.0, 0, -0.095, act); // gear housing
    const sensor = mesh(new T.BoxGeometry(0.07, 0.05, 0.04), M.ecu, -0.1, 0.11, 0.02, act);
    const sensorLed = mesh(new T.SphereGeometry(0.012, 8, 8), M.led, -0.1, 0.14, 0.04, act, false);
    mesh(new T.BoxGeometry(0.84, 0.36, 0.014), M.metal, 0.82, -0.04, -0.3, door); // bracket
    mesh(new T.BoxGeometry(0.04, 0.3, 0.012), M.metal, 0.44, -0.04, -0.3, door);
    mesh(new T.BoxGeometry(0.04, 0.3, 0.012), M.metal, 1.2, -0.04, -0.3, door);
    const latch = new T.Group(); latch.position.set(1.37, -0.06, -0.17); door.add(latch);
    mesh(new T.BoxGeometry(0.16, 0.34, 0.2), M.dark, 0, 0, 0, latch);
    mesh(new T.BoxGeometry(0.05, 0.14, 0.07), M.pocket, 0.09, 0, 0, latch);
    const latchLed = mesh(new T.SphereGeometry(0.012, 8, 8), M.led, -0.05, 0.19, 0.06, latch, false);
    const ecu = new T.Group(); ecu.position.set(-0.55, -0.5, -0.26); door.add(ecu);
    mesh(new T.BoxGeometry(0.32, 0.22, 0.05), M.ecu, 0, 0, 0, ecu);
    mesh(new T.BoxGeometry(0.1, 0.06, 0.06), M.dark, 0.17, -0.06, 0.0, ecu);
    const ecuLed = mesh(new T.SphereGeometry(0.012, 8, 8), M.led, -0.1, 0.06, 0.035, ecu, false);
    const conn = mesh(new T.BoxGeometry(0.08, 0.16, 0.1), M.dark, -1.4, 0.1, -0.2, door); // hinge-side harness connector
    // window regulator rails and a speaker: the rest of the door's innards
    mesh(new T.BoxGeometry(0.03, 1.15, 0.03), M.metal, -0.55, -0.28, -0.2, door).rotation.z = 0.05;
    mesh(new T.BoxGeometry(0.03, 1.15, 0.03), M.metal, 0.2, -0.28, -0.2, door).rotation.z = 0.05;
    mesh(new T.CylinderGeometry(0.17, 0.17, 0.04, 20), M.dark, -1.0, -0.6, -0.12, door).rotation.x = Math.PI / 2;
    // harness (generic): bus in at the hinge -> ECU; ECU -> actuator; ECU -> latch; cable handle -> latch
    const V = (x, y, z) => new T.Vector3(x, y, z);
    const curve = (pts) => new T.CatmullRomCurve3(pts);
    const PATHS = {
      bus: curve([V(-1.4, 0.03, -0.2), V(-1.15, -0.25, -0.24), V(-0.8, -0.45, -0.26), V(-0.55, -0.5, -0.26)]),
      act: curve([V(-0.45, -0.52, -0.25), V(0.0, -0.56, -0.26), V(0.5, -0.4, -0.27), V(0.78, -0.16, -0.23)]),
      latch: curve([V(-0.45, -0.58, -0.25), V(0.3, -0.72, -0.24), V(1.0, -0.62, -0.22), V(1.34, -0.25, -0.18)]),
      cable: curve([V(0.62, -0.1, -0.12), V(0.95, -0.28, -0.15), V(1.2, -0.2, -0.16), V(1.33, -0.02, -0.16)]),
    };
    for (const k in PATHS) mesh(new T.TubeGeometry(PATHS[k], 40, k === "cable" ? 0.008 : 0.012, 6, false), k === "cable" ? M.cable : M.wire, 0, 0, 0, door, false);
    const packets = Array.from({ length: 8 }, () => mesh(new T.SphereGeometry(0.024, 8, 8), M.packet, 0, 0, 0, door, false));
    packets.forEach((p) => (p.visible = false));

    /* floor, grid, key track */
    const floor = mesh(new T.PlaneGeometry(30, 30), M.shadow, 0, -1.2, 0, scene); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
    const grid = new T.GridHelper(16, 32, 0x888888, 0x888888); grid.position.y = -1.199; grid.material.transparent = true; grid.material.opacity = 0.18; scene.add(grid);
    const FAR = V(3.1, -0.6, 2.0), NEAR = V(1.05, -0.6, 0.95);
    const trackLen = FAR.distanceTo(NEAR);
    const track = mesh(new T.BoxGeometry(trackLen, 0.006, 0.006), M.track, 0, 0, 0, scene, false);
    track.position.copy(FAR.clone().lerp(NEAR, 0.5)); track.position.y = -1.19; track.lookAt(NEAR.x, -1.19, NEAR.z); track.rotateY(Math.PI / 2);
    const mark = mesh(new T.BoxGeometry(0.006, 0.006, 0.16), M.track, 0, 0, 0, scene, false);
    mark.position.copy(FAR.clone().lerp(NEAR, 1 - DETECT / 10)); mark.position.y = -1.19; mark.lookAt(NEAR.x, -1.19, NEAR.z);
    /* key fob: a rounded slab with a lit dot, gliding in on the track */
    const fob = new T.Group(); scene.add(fob);
    const fobBody = mesh(new T.ExtrudeGeometry(roundRect(-0.07, -0.12, 0.14, 0.24, 0.04), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }), M.fob, 0, 0, 0, fob);
    mesh(new T.SphereGeometry(0.012, 8, 8), M.led, 0, 0.06, 0.04, fob, false);
    mesh(new T.BoxGeometry(0.08, 0.03, 0.004), M.dark, 0, -0.03, 0.038, fob, false);
    fob.rotation.y = 0.9; fob.rotation.x = -0.15;
    const ring = mesh(new T.RingGeometry(0.26, 0.3, 40), M.ring, 0, 0, 0, scene, false); ring.rotation.x = -Math.PI / 2; ring.position.y = -1.18;

    /* environment: a tiny studio of bright planes, prefiltered for reflections */
    let env = null;
    function buildEnv(dark) {
      if (env) env.dispose();
      const es = new T.Scene();
      es.background = new T.Color(dark ? 0x0a1020 : 0xd9e0e8);
      const panel = (w, h, c, x, y, z, rx, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); es.add(m); };
      const top = new T.Color(dark ? 1.6 : 1.3, dark ? 1.7 : 1.3, dark ? 1.9 : 1.35);
      panel(8, 3, top, 0, 6, 0, Math.PI / 2, 0);
      panel(3, 6, new T.Color(dark ? 0.6 : 0.7, dark ? 0.7 : 0.75, dark ? 0.9 : 0.85), -8, 1, 2, 0, Math.PI / 2);
      const ac = col("--am").multiplyScalar(dark ? 1.4 : 0.9);
      panel(4, 2, ac, 6, 0, -6, 0, -Math.PI / 4);
      panel(10, 1, new T.Color(dark ? 0.25 : 0.9, dark ? 0.25 : 0.9, dark ? 0.3 : 0.95), 0, -4, 0, -Math.PI / 2, 0);
      const pm = new T.PMREMGenerator(renderer);
      env = pm.fromScene(es, 0.03); pm.dispose();
      scene.environment = env.texture;
    }

    /* theme: backgrounds stay transparent; lights, fog and accent tints follow the tokens */
    function theme(dark) {
      const acc = col("--am"), bg = col("--bg-2");
      accentMats.forEach((m) => { if (m.emissive) m.emissive.copy(acc); else m.color.copy(acc); });
      rim.color.copy(acc); warm.color.copy(acc);
      scene.fog = new T.Fog(bg, 6, 14);
      hemi.color.copy(dark ? new T.Color(0x9fb3cc) : new T.Color(0xffffff)); hemi.groundColor.copy(dark ? new T.Color(0x11161e) : new T.Color(0x6b7784));
      hemi.intensity = dark ? 0.45 : 0.7; key.intensity = dark ? 0.9 : 1.0; fill.intensity = dark ? 0.3 : 0.4; rim.intensity = dark ? 1.5 : 0.8; warm.intensity = dark ? 0.9 : 0.5;
      M.shadow.opacity = dark ? 0.5 : 0.3;
      grid.material.color.copy(col("--fg")); grid.material.opacity = dark ? 0.12 : 0.1;
      renderer.toneMappingExposure = dark ? 0.95 : 1.0;
      buildEnv(dark);
      envMats.forEach((m) => { m.envMapIntensity = dark ? 0.9 : 0.65; m.needsUpdate = true; });
      M.paint.color.set(0x1c2129);
      setXray(xray);
    }

    /* x-ray: see-through skin so the actuator, latch and harness read */
    let xray = true;
    function setXray(on) {
      xray = on;
      M.paint.transparent = on; M.paint.opacity = on ? (isDark() ? 0.3 : 0.55) : 1; M.paint.depthWrite = !on; M.paint.needsUpdate = true;
      M.inner.transparent = on; M.inner.opacity = on ? 0.25 : 1; M.inner.depthWrite = !on; M.inner.needsUpdate = true;
      skin.castShadow = !on;
    }

    /* orbit: a tiny spherical-coordinate handler; drag or arrow keys; slow auto-orbit when idle */
    const O = { theta: 0.55, phi: 1.32, r: 6.0, base: 0.55, idle: 1e9, dragging: false, lx: 0, ly: 0 };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function placeCamera() {
      const s = Math.sin(O.phi);
      camera.position.set(target.x + O.r * s * Math.sin(O.theta), target.y + O.r * Math.cos(O.phi), target.z + O.r * s * Math.cos(O.theta));
      camera.lookAt(target);
    }
    box.addEventListener("pointerdown", (e) => { if (e.button !== 0 && e.pointerType === "mouse") return; O.dragging = true; O.lx = e.clientX; O.ly = e.clientY; O.idle = 0; box.setPointerCapture?.(e.pointerId); });
    box.addEventListener("pointermove", (e) => {
      if (!O.dragging) return;
      const dx = e.clientX - O.lx, dy = e.clientY - O.ly; O.lx = e.clientX; O.ly = e.clientY;
      if (e.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.5) return; // let vertical swipes scroll the page
      O.theta = clamp(O.theta - dx * 0.006, -2.4, 2.4); O.phi = clamp(O.phi - dy * 0.005, 0.95, 1.5); O.idle = 0; requestRender();
    });
    const stop = () => { O.dragging = false; };
    box.addEventListener("pointerup", stop); box.addEventListener("pointercancel", stop); box.addEventListener("lostpointercapture", stop);
    box.addEventListener("keydown", (e) => {
      const k = e.key; let used = true;
      if (k === "ArrowLeft") O.theta = clamp(O.theta - 0.12, -2.4, 2.4); else if (k === "ArrowRight") O.theta = clamp(O.theta + 0.12, -2.4, 2.4);
      else if (k === "ArrowUp") O.phi = clamp(O.phi - 0.08, 0.95, 1.5); else if (k === "ArrowDown") O.phi = clamp(O.phi + 0.08, 0.95, 1.5);
      else if (k === "Home") { O.theta = O.base; O.phi = 1.32; } else used = false;
      if (used) { e.preventDefault(); O.idle = 0; requestRender(); }
    });

    /* animation state */
    const cur = { ext: 0, lit: 0, open: 0, grasp: 0, power: 1, crash: 0, fob: 1 };
    let tgt = { ...STATES.retracted.scene }, fobT = 1, activePaths = [];
    const PATH_OF = { "vaf-dhc": "bus", "fob-vaf": "bus", "crash-vaf": "bus", "exit-vaf": "bus", "dhc-act": "act", "touch-dhc": "act", "dhc-light": "act", "vaf-latch": "latch" };
    function setState(S) {
      tgt = { ...S.scene };
      activePaths = [];
      for (const [id, dir] of S.edges) { const p = PATH_OF[id]; if (p && dir !== 0) activePaths.push([p, id === "touch-dhc" ? -1 : dir]); }
      if (reduced) { Object.assign(cur, tgt); cur.fob = fobT; }
      requestRender();
    }
    function setFob(d) { fobT = d / 10; if (reduced) cur.fob = fobT; requestRender(); }
    const ease = (a, b, dt, k) => a + (b - a) * (reduced ? 1 : Math.min(1, dt * k));
    function frame(dt, t) {
      cur.ext = ease(cur.ext, tgt.ext, dt, 4); cur.lit = ease(cur.lit, tgt.lit, dt, 5); cur.open = ease(cur.open, tgt.open, dt, 2.2);
      cur.grasp = ease(cur.grasp, tgt.grasp, dt, 4); cur.power = ease(cur.power, tgt.power, dt, 6); cur.crash = ease(cur.crash, tgt.crash, dt, 5); cur.fob = ease(cur.fob, fobT, dt, 3);
      // handle: slide out on z and pivot about its forward end; a grasp pulls it a little further
      const e = cur.ext + cur.grasp * 0.25;
      pivot.position.z = 0.012 + 0.11 * e; pivot.rotation.y = -0.22 * e;
      const lit = cur.lit * cur.power;
      M.handle.emissiveIntensity = 0.12 * lit; M.strip.emissiveIntensity = 2.2 * lit; M.led.emissiveIntensity = 1.6 * cur.power;
      M.cable.emissiveIntensity = (1 - cur.power) * 1.2;
      hinge.rotation.y = -0.55 * cur.open;
      // fob along its track, pulsing ring when the key is being read
      const fp = FAR.clone().lerp(NEAR, 1 - cur.fob);
      fob.position.copy(fp); fob.position.y = -0.6 + Math.sin(t * 1.3) * 0.02 * (reduced ? 0 : 1);
      ring.position.x = fp.x; ring.position.z = fp.z;
      const reading = (state === "key" || state === "extended") ? 1 : 0;
      const pulse = reduced ? 0.5 : (t * 0.9) % 1;
      ring.scale.setScalar(1 + pulse * 1.2); M.ring.opacity = reading * cur.power * (1 - pulse) * 0.6;
      fob.visible = true; M.fob.opacity = 1;
      // packets along the harness
      packets.forEach((p, i) => {
        const ap = activePaths[Math.floor(i / 2)];
        if (!ap) { p.visible = false; return; }
        let u = reduced ? (i % 2 ? 0.7 : 0.3) : ((t * 0.35 + (i % 2) * 0.5 + i * 0.07) % 1);
        if (ap[1] < 0) u = 1 - u;
        p.position.copy(PATHS[ap[0]].getPointAt(u)); p.visible = true;
      });
      sensorLed.visible = latchLed.visible = ecuLed.visible = cur.power > 0.5;
      // camera: auto-orbit when idle, no auto-orbit under reduced motion
      O.idle += dt;
      if (!reduced && !O.dragging && O.idle > 3) { const auto = O.base + 0.3 * Math.sin(t * 0.22); O.theta += (auto - O.theta) * Math.min(1, dt * 0.6); }
      placeCamera();
      renderer.render(scene, camera);
    }
    function resize() {
      const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      requestRender();
    }
    new ResizeObserver(resize).observe(box);
    theme(isDark());
    placeCamera();
    resize();
    return { setState, setFob, setXray, theme, frame, resize };
  }
  try { three = init3D(); } catch (e) { console.error("auto 3d", e); three = null; }
  if (!three) {
    if (fallback) fallback.hidden = false;
    if (canvas) canvas.remove();
    box?.querySelector(".auto-3d-hud")?.remove(); xrayBtn?.remove();
    box?.removeAttribute("tabindex");
  } else {
    onState((_, S) => three.setState(S));
    distListeners.push((d) => three.setFob(d));
    xrayBtn?.addEventListener("click", () => { const on = xrayBtn.getAttribute("aria-pressed") !== "true"; xrayBtn.setAttribute("aria-pressed", String(on)); three.setXray(on); requestRender(); });
    document.addEventListener("fgl:theme", (e) => { three.theme(!!e.detail?.dark); requestRender(); });
  }

  /* =============================== 4. one loop for both views =============================== */
  function tick(now) {
    raf = 0;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000, dt = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now;
    try { three?.frame(dt, t); drawPackets(t, false); } catch (e) { console.error("auto frame", e); return; }
    if (visible && !reduced && !document.hidden) raf = requestAnimationFrame(tick);
    else last = 0;
  }
  function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); }
  function requestRender() {
    if (!reduced) { kick(); return; }
    if (pending) return; pending = true;
    requestAnimationFrame((now) => { pending = false; try { three?.frame(0, 0.5); drawPackets(0, true); } catch (e) { console.error("auto still", e); } });
  }
  const lab = $(".auto-lab");

  /* ---- guided demo: plays once, the first time the bench scrolls into view (or is reached by a link).
     Walks the key up, lets the handle extend, grasps, pulls, holds the door open, then closes.
     Any interaction (buttons, slider, orbiting the model) cancels it; reduced motion skips it. ---- */
  let demoDone = false, demoTimers = [], demoOn = false;
  function demoStop() { if (!demoOn) return; demoOn = false; demoTimers.forEach(clearTimeout); demoTimers = []; lab.classList.remove("is-demo"); }
  function demoAt(ms, fn) { demoTimers.push(setTimeout(() => { if (demoOn) fn(); }, ms)); }
  function demoStart() {
    if (demoDone || reduced || state !== "retracted") { demoDone = true; return; }
    demoDone = true; demoOn = true; lab.classList.add("is-demo");
    // walk from 6 m to 1.5 m in half-metre steps
    setDist(6, false);
    let d = 6, i = 0;
    while (d > 1.5) { d -= 0.5; i++; const dd = d; demoAt(600 + i * 230, () => setDist(dd, true)); }
    const tArr = 600 + i * 230;          // key detected here, handle extends 800 ms later
    demoAt(tArr + 2600, () => fire("grasp"));
    demoAt(tArr + 4200, () => fire("pull"));
    demoAt(tArr + 8200, () => fire("close"));
    demoAt(tArr + 8700, () => { setDist(6, false); demoStop(); });
  }
  ["pointerdown", "keydown"].forEach((ev) => lab.addEventListener(ev, demoStop, true));
  $("#auto-actions")?.addEventListener("click", demoStop, true);

  if (lab && "IntersectionObserver" in window) {
    new IntersectionObserver((es) => {
      visible = es.some((x) => x.isIntersecting);
      if (visible) { if (reduced) requestRender(); else kick(); }
      if (visible && !demoDone && es.some((x) => x.intersectionRatio >= 0.45)) demoStart();
      if (!visible && demoOn) demoStop();
    }, { rootMargin: "80px", threshold: [0, 0.45] }).observe(lab);
  } else { visible = true; kick(); }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });

  setDist(10, false);
  render();
  requestRender();

  /* =============================== 5. atmosphere =============================== */
  // Graphite floor, one headlight sweep drifting left to right, thin streaks low on the
  // screen like a studio-floor reflection. Dark: glow. Light: amber ink lines and tints.
  let streaks = [], AM = [196, 106, 18], FG = [14, 26, 38], K = 0.9, DARK = false;
  function palette(dark) { DARK = !!dark; AM = A.rgb("--am"); FG = A.rgb("--fg"); K = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--atmo-alpha")) || 1; }
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a * K)).toFixed(3)})`;
  window.ATMO.register("auto", {
    init(canvas, ctx, s) { palette(isDark()); this.resize(s); },
    theme(dark) { palette(dark); },
    resize(s) {
      const n = 16;
      streaks = Array.from({ length: n }, (_, i) => ({
        y: s.h * (0.56 + 0.44 * (i / n)) + Math.random() * 10,
        len: s.w * (0.18 + Math.random() * 0.45),
        x: Math.random() * s.w,
        a: 0.05 + Math.random() * 0.1,
        v: (0.4 + Math.random()) * 12 * (Math.random() < 0.5 ? 1 : -1),
        w: 0.6 + Math.random() * 0.9,
      }));
    },
    draw(ctx, s, t) {
      ctx.clearRect(0, 0, s.w, s.h);
      const floor = ctx.createLinearGradient(0, 0, 0, s.h);
      floor.addColorStop(0, rgba(FG, 0)); floor.addColorStop(0.5, rgba(FG, DARK ? 0.02 : 0.015)); floor.addColorStop(1, rgba(FG, DARK ? 0.07 : 0.05));
      ctx.fillStyle = floor; ctx.fillRect(0, 0, s.w, s.h);
      const ph = reduced ? 0.32 : ((t / 16) % 1);
      const sx = -s.w * 0.2 + ph * s.w * 1.4, sy = s.h * 0.62;
      const R = Math.max(s.w, s.h) * 0.55;
      if (DARK) {
        // headlight glow sweeping the floor
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
        g.addColorStop(0, rgba(AM, 0.14)); g.addColorStop(0.35, rgba(AM, 0.05)); g.addColorStop(1, rgba(AM, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, s.w, s.h);
      } else {
        // daylight: a soft amber tint instead of a glow
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.9);
        g.addColorStop(0, rgba(AM, 0.07)); g.addColorStop(0.5, rgba(AM, 0.02)); g.addColorStop(1, rgba(AM, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, s.w, s.h);
      }
      // the beam's hot line on the floor
      const hg = ctx.createLinearGradient(sx - R * 0.6, 0, sx + R * 0.6, 0);
      hg.addColorStop(0, rgba(AM, 0)); hg.addColorStop(0.5, rgba(AM, DARK ? 0.35 : 0.5)); hg.addColorStop(1, rgba(AM, 0));
      ctx.fillStyle = hg; ctx.fillRect(sx - R * 0.6, sy - 0.5, R * 1.2, 1);
      // streaks: soft on dark, thin ink lines on light
      for (const st of streaks) {
        const x = reduced ? st.x : ((st.x + st.v * t) % (s.w + st.len) + s.w + st.len) % (s.w + st.len) - st.len;
        const lg = ctx.createLinearGradient(x, 0, x + st.len, 0);
        const near = Math.max(0, 1 - Math.abs((x + st.len / 2) - sx) / (R * 0.9));
        const a = DARK ? st.a + near * 0.12 : st.a * 1.6 + near * 0.25;
        lg.addColorStop(0, rgba(AM, 0)); lg.addColorStop(0.5, rgba(AM, a)); lg.addColorStop(1, rgba(AM, 0));
        ctx.fillStyle = lg; ctx.fillRect(x, st.y, st.len, DARK ? st.w : Math.min(st.w, 0.8));
      }
    },
  });
})();
