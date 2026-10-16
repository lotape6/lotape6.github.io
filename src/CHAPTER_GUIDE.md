# Chapter authoring guide (Mission control)

The site is assembled by `python3 build.py` from `src/shell/page.html` plus
`src/chapters/*.html` in filename order. Each chapter is one HTML partial plus,
optionally, one CSS file in `assets/css/chapters/` and one JS file in
`assets/js/chapters/`. Shared tokens, layout, dive-in panels, video posters and
the atmosphere stack live in `assets/css/core.css` and `assets/js/core.js`;
read both before writing a chapter.

## Partial skeleton
```html
<!-- css: chapters/aero.css  js: chapters/aero.js -->
<section class="chapter" id="aero" data-atmo="aero" data-acc="cy" data-hud="CH 02 · AEROSPACE">
  <div class="wrap">
    <div class="chapter-head">
      <p class="eyebrow"><span class="idx">02</span> Aerospace · FADA-CATEC · 2019–2022</p>
      <h2>Teaching drones to see</h2>
      <p class="lede">One or two sentences.</p>
      <div class="meta"><span><b>Role</b> Robotics engineer</span><span><b>Stack</b> C++ · ROS · OpenCV</span></div>
    </div>
    ... chapter content: at least one interactive element and one or more
        [data-dive] buttons that open the dialogs below ...
  </div>
</section>
<dialog class="dive" id="dive-mbzirc" aria-labelledby="dive-mbzirc-t">
  <div class="dive-frame">
    <div class="dive-head"><b>Mission 01</b><span>MBZIRC 2020</span><button class="dive-close" type="button" aria-label="Close">✕</button></div>
    <div class="dive-body">
      <h3 id="dive-mbzirc-t">...</h3>
      <div class="dive-grid">
        <div class="video" data-yt="zAnWRs0QPc4" data-title="MBZIRC 2020 competition · FADA-CATEC"></div>
        <div><dl class="kv">...</dl><div class="links">...</div></div>
      </div>
      <div class="prose"><p>...</p></div>
    </div>
  </div>
</dialog>
```
Rules:
- `data-atmo` names the atmosphere layer the chapter JS registers; `data-acc` is one of `cy am mg lv gn` (sets `--acc` for the whole page while the chapter is on screen). `data-hud` is the short label shown in the top bar.
- Dialogs go *after* the section, at top level of the partial, ids prefixed `dive-`.
- Videos: `<div class="video" data-yt="ID" data-title="..."></div>` only; core.js builds the poster and loads YouTube on click. Never write an iframe.
- Use the shared classes (`.panel`, `.panel-head`, `.panel-body`, `.corner`, `.chips`, `.chip`, `.btn`, `.kv`, `.links`, `.grid-2`, `.grid-3`, `.mono`, `.eyebrow`). Chapter CSS adds only what the chapter's own interactive element needs; prefix every new class with the chapter id (`.aero-radar`, `.auto-handle`).
- No colour literals in chapter CSS except inside the atmosphere canvas code; use `var(--acc)`, `var(--fg)`, `var(--fg-2)`, `var(--mute)`, `var(--line)`, `var(--bg)`, `var(--bg-2)` and `color-mix()`.
- Everything readable must be visible at rest (no content hidden until scroll). `[data-reveal]` on a block adds a short entrance only.
- Phone width (390px) must work with no horizontal scroll: grids collapse, `min-width: 0` on flex/grid children with text, canvases sized to the container.
- Keyboard: every interactive element is a `<button>` or `<a>`; dialogs are native `<dialog>` so Esc and focus work.
- Reduced motion: `window.ATMO.reduced` is true when the visitor prefers reduced motion; draw one still frame and skip loops. Any chapter animation checks `matchMedia("(prefers-reduced-motion: reduce)")`.

## Themes (light is the default, dark via the toggle)
`core.css` defines every token twice: light on `:root`, dark on `:root[data-theme="dark"]`. Chapter CSS must use tokens only, so it needs no theme-specific rules; if a chapter really needs one, scope it under `:root[data-theme="dark"] .chapter-x ...`. Illustrations (SVG) use `currentColor`, `var(--acc)`, `var(--fg)`, `var(--bg-2)`; never a literal.
Canvas code gets its colours from `window.ATMO.rgba("--cy", 0.4)` / `ATMO.rgb("--acc")` / `ATMO.isDark()` instead of literals. `ATMO.rgba` already scales alpha by `--atmo-alpha` (lighter in the light theme). An atmosphere may implement `theme(isDark)` to rebuild cached gradients; core calls it on every toggle and also dispatches `document` event `fgl:theme` (`detail.dark`) for in-section canvases/Three.js scenes. Dark backgrounds glow; light backgrounds work better with thin ink lines and soft tints, so check both.

## Atmosphere (chapter JS)
```js
window.ATMO.register("aero", {
  init(canvas, ctx, size) { /* allocate particles etc. */ },
  resize(size) {},
  draw(ctx, size, t, dt) { /* t seconds since start; draw the full frame; keep it cheap: < 2 ms */ },
});
```
The canvas is full-viewport, behind all content, faded in and out by core.js as the chapter scrolls. Draw on a transparent background (core paints `--bg`). Keep contrast in mind: content sits directly on top; keep large bright areas out of the centre column.

## Content sources
`content/<chapter>.md` has the verified facts, the role, links, video ids, licence notes and a "needs confirmation" list. Use only facts from there (or the user's CV); invent nothing. Quote BMW/ASML facts as theirs, not ours.

## Done checklist for a chapter
1. `python3 build.py` succeeds and `index.html` opens from `python3 -m http.server`.
2. `node --check assets/js/chapters/<id>.js` passes.
3. Playwright screenshot at 1280 and 390 wide shows the chapter and its dive-in open; no horizontal overflow (`document.documentElement.scrollWidth === innerWidth`).
4. Write 3 lines in your final report: what the interactive element does, what you left out, anything the user must confirm.
