# Portfolio: Fidel González Leiva

Static site (plain HTML, CSS and JS) ready for GitHub Pages. `index.html` is generated: edit the sources under `src/` and run `python3 build.py`.

- `src/shell/page.html`: the page frame (head, top bar, footer).
- `src/chapters/NN-name.html`: one partial per chapter, included in filename order; dive-in dialogs live after each section. See `src/CHAPTER_GUIDE.md`.
- `assets/css/core.css` and `assets/js/core.js`: tokens, scroll-driven atmosphere stack, dive-in panels, video posters.
- `assets/css/chapters/`, `assets/js/chapters/`: one file per chapter (its interactive element and its atmosphere).
- `content/`: verified facts per chapter, with the items that still need confirmation.
- `llms.txt`: plain-text profile for assistants and crawlers; the page head also carries schema.org Person JSON-LD. Keep both factual.
- `v1/`: the first, simpler version of the site.
- `screenshots/`: desktop and mobile previews in both themes (not needed on the live site).

## Chapters
01 Origins (symbolic Iberia map) · 02 Aerospace · 03 Automotive (Three.js door bench + signal-flow board) · 04 Holding pattern (study radar) · 05 Semiconductors · 06 Terminal · 07 Agents (harness explorer) · 08 Papers · 09 Contact.

## Theme
Light by default, dark via the sun/moon button in the top bar (remembered in `localStorage` under `fgl-theme`). Chapter canvases read their colours from the CSS tokens through `ATMO.rgba`, so new chapters need no theme-specific code; see the Themes section of `src/CHAPTER_GUIDE.md`.

The automotive chapter loads Three.js r128 from cdnjs; without it (or without WebGL) the bench falls back to a static drawing.

## Add a video
Anywhere in the page:
```html
<div class="video" data-yt="YOUTUBE_ID" data-title="Caption shown on the poster"></div>
```
Nothing loads from YouTube until the visitor presses play (privacy-friendly `youtube-nocookie.com`).

## Build and preview locally
```sh
python3 build.py
python3 -m http.server 8000   # then open http://localhost:8000
```

## Publish on GitHub Pages (later)
Create a repo named `lotape6.github.io` and push the contents of this folder,
or push it to any repo and enable Pages on the branch root.
