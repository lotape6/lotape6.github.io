# Chapter: Semiconductors (Alten for ASML, Feb 2025 – now)

Sources: CV 2025; ASML pages fetched 2026-10-16; BazelCon 2024 schedule. The user: "I've worked on the infrastructure upgrade, not any specific subsystem."

## One-line thesis
Not a subsystem, the ground under all of them: moving the build of a lithography machine's software from Makefiles to Bazel, and clearing a decade of dependency debt on the way.

## Role (from CV)
- Led technical-debt assessments across a large C/C++ codebase and production libraries: circular dependencies, duplicated symbols, inconsistent dependency declarations.
- Migrated large lithography-machine components from Makefiles to Bazel: explicit dependencies, reproducible builds.
- AI Champion: evaluated tools and set up practical AI-assisted engineering workflows for developers.
- Automation and verification tooling that cut manual steps; improved code review and engineering practices.

## ASML facts to use (ASML's own words, HIGH)
- "around 100,000 parts" per machine; shipping one takes "40 freight containers, three cargo planes and 20 trucks" (https://www.asml.com/news/stories/2022/busting-asml-myths).
- "over 4,000 software engineers"; "Our embedded software steers and controls our machines and consists of millions of lines of code." (https://www.asml.com/en/news/stories/2024/byte-sized-software-engineering). ASML gives no exact line count; do not invent one.
- EUV: tin plasma at about 500,000 K, droplets at 70 m/s, 50,000 pulses per second, 13.5 nm light, mirrors instead of lenses; wafer stage positioned to a quarter of a nanometre, corrected 20,000 times a second (https://www.asml.com/en/discover/hot-machines).
- TWINSCAN NXE:3800E: high-volume manufacturing for 2 nm logic (https://asml.com/en/products/euv-lithography-systems/twinscan-nxe-3800e). Product render URL on that page (media.asml.com, editorial use, credit "©ASML").
- Public evidence of ASML's Bazel migration: BazelCon 2024 talk "rules_variant: developer-friendly multiplatform builds" by an ASML contractor "leading a migration to the Bazel build system" (https://bazelcon2024.sched.com/event/1h6Sn/). No recording ID found; link, do not embed.
- Third-party colour, unverified, use only as "reported": ~45 million lines of code and 1,500+ Make/Maven modules with overnight full builds (SemiWiki thread relaying a LaurieWired post).

## Visuals
- Media library images are editorial-only with "©ASML" credit (https://www.asml.com/en/news/media-library). Prefer an original illustration: a dependency graph untangling (Make spaghetti → Bazel DAG) drawn with Canvas.
- ASML YouTube channel exists; no verified video ID, so none embedded unless the user supplies one.

## Suggested interactive element
"Untangle the graph": a canvas with ~40 nodes and cyclic edges (the Make world); a toggle animates them into a layered DAG with explicit edges (the Bazel world), while counters show cycles found → 0, duplicated symbols → 0, build reproducible ✓. A second tab shows a toy `BUILD.bazel` vs `Makefile` side by side.

## Needs user confirmation
- May the page say "lithography machine software" and "Bazel" explicitly? (Both are on the public CV, default yes.)
- Any numbers you can share publicly (components migrated, build-time change)? Otherwise the chapter stays qualitative.
