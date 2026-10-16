# Chapter: Agentic engineering

Sources: https://github.com/lotape6/FindingMemo, https://github.com/lotape6/cv (agents/hhrr-reviewer), https://github.com/lotape6/alikindoi (.opencode/), https://github.com/lotape6/AIgen, CV 2025 (AI Champion at ASML).

## One-line thesis
Treating AI coding agents like any other engineering tool: give them a harness (instructions, permissions, reviewers, skills), measure the result, and teach the team.

## Timeline
- **Sep–Nov 2024, AIgen**: local LLM agent with RAG on llama.cpp (CUDA), LlamaIndex and PostgreSQL pgvector. First contact with agent loops.
- **Feb 2025–now, AI Champion at ASML (via Alten)**: evaluated AI tools for a large C/C++ codebase, set up practical workflows so developers could adopt AI-assisted engineering; the Bazel migration work was itself done with agent assistance.
- **Mar–May 2026, Finding Memo**: an interactive guide and 5-minute talk that explains agents through Finding Nemo (Marlin = agent, currents = harness, Crush = human, Dory = subagent). Built by an agent, with a reconstruction of its own build you can step through.
- **2026, harnesses in every repo**: `.opencode/` in alikindoi (OpenCode), `.claude/`-style agents and skills in FindingMemo (Claude Code), an HR-reviewer agent in the CV repo.

## What a "harness" means here (show the real files)
1. **Instructions**: `AGENTS.md` describes stack, layout, commands and hard rules (anti-ban, audit trail). `opencode.json` loads it plus `TODOs.md`.
2. **Permissions**: bash allowed, but `git reset*` and `rm -rf*` ask first.
3. **Reviewer subagent** (`.opencode/agents/reviewer.md`): read-only (`edit: deny`), checks anti-ban floors, audit-trail rule, config safety, tests and docs; verdict APPROVE / REQUEST CHANGES with `file:line` findings.
4. **Commands**: `/test` (pytest + frontend build, fix until green) and `/ship` (verify, reviewer, commit, push).
5. **Skills**: `scraping-safety/SKILL.md` auto-triggers when adapters, runner, scheduler or rate limits are edited; it overrides feature requests.
6. **Specialised agents in Finding Memo**: `content-architect` (multi-level content, cross-tool knowledge of Claude Code, Copilot, Cursor, OpenCode), `frontend-builder` (vanilla HTML/CSS/JS + GSAP ScrollTrigger, accessibility rules), `visual-qa` (screenshots at 1280/768/480, structured QA report). Skills `analyze-section`, `build-section`, `build-fauna`.
7. **CV reviewer agent**: prompt, checklist and output template for HR-style CV reviews.

## Tools used
Claude Code (CLI), OpenCode, Copilot and Cursor (in the Finding Memo knowledge base), llama.cpp, LlamaIndex, pgvector, MARP for talks.

## Suggested interactive element
A "harness explorer": a file tree of a real harness (`AGENTS.md`, `opencode.json`, `agents/reviewer.md`, `commands/ship.md`, `skills/scraping-safety`). Clicking a file shows the real snippet and a one-line note on what it buys you. A second tab shows the agent loop from Finding Memo (prompt → tool call → result → context) as a stepper.

## Needs user confirmation
- Whether to name ASML explicitly in the AI Champion paragraph (it is on the public CV, so default yes).
- Whether to list Copilot/Cursor as tools used, or only as tools covered in the guide (default: covered in the guide).
