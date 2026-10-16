/* Chapter 07 · Agents: layered harness explorer (public snippets verbatim,
   private pieces redacted), runtime topology, the loop stepper, and an
   atmosphere of nodes and edges lighting up along an agent loop. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------- the harness, layer by layer ----------------
     vis "public": snippet is verbatim from lotape6/alikindoi, lotape6/FindingMemo
     or lotape6/cv. vis "private": the piece exists in the work harnesses
     (ASML / Alten); it is company property, so only its role is described. */
  const PRIVATE_NOTE = "This piece lives in the work harnesses and is company property. Its role is described; its contents stay where they belong.";
  const GROUPS = [
    { id: "instr", name: "Instructions", open: true, nodes: [
      { id: "global", label: "~/…/CLAUDE.md · global rules", kind: "instructions · user scope", vis: "private", where: ["cc", "oc"],
        role: "House rules that load in every session on every repo: language, commit style, what never to do without asking.",
        note: "Preferences stop being repeated in prompts; every session on every project starts from the same baseline." },
      { id: "profile", label: "user profile", kind: "instructions · who is asking", vis: "private", where: ["cc", "oc"],
        role: "Who the engineer is, what they own, how they like answers and reviews shaped.",
        note: "The agent calibrates depth and tone once instead of guessing per conversation." },
      { id: "agents-md", label: "AGENTS.md", kind: "instructions · project", vis: "public", where: ["cc", "oc", "ci"],
        note: "Every session starts knowing the stack, the commands and the hard rules, so the agent does not rediscover (or break) them.",
        code: [
          "# AGENTS.md — Alikindoi (Job Opportunity Tracker)", "",
          "## Commands (run from `backend/`)",
          "- Setup: `uv venv && uv pip install -e \".[dev]\"`",
          "- Tests: `.venv/bin/pytest`", "",
          "## Conventions & rules",
          "- Never hard-delete jobs; tombstone via `is_active=False` + `job_events` entry.",
          "- Every mutation of a job (incl. user edits via PATCH) writes a `job_events`",
          "  row (audit trail). User edits use the `edited` event type.",
          "- Anti-ban is a hard requirement: per-source rate limits, jitter, backoff on",
          "  429/403, configurable cadence with enforced safe minimums. Do not bypass.",
          "- API keys only via `.env` (never committed; `.env.example` documents them).",
        ] },
      { id: "dirrules", label: "<subtree>/CLAUDE.md · per-directory rules", kind: "instructions · scoped", vis: "private", where: ["cc"],
        role: "Rules that apply only inside one subtree (a build system, a driver, a test harness) and load when files there are touched.",
        note: "Big codebases get local law without bloating the root file; the context stays small for everything else." },
      { id: "todos", label: "TODOs.md", kind: "instructions · user action items", vis: "public", where: ["oc"],
        note: "The agent knows which items only the human can do (keys, accounts) and stops asking for them.",
        code: [
          "# TODOs — action items for the user", "",
          "Things only you can do (credentials, accounts, personal preferences).",
          "Check items off as you complete them. Keep secrets in `.env` (never commit).", "",
          "## API keys (optional but recommended — better salaries & coverage)", "",
          "- [x] **Adzuna** — ✅ configured and verified (2026-07-29): ~148 Python",
          "      jobs in ES, salary data flowing. Enabled in config.",
          "", "…and in opencode.json:", "",
          "  \"instructions\": [\"AGENTS.md\", \"TODOs.md\"],",
        ] },
    ] },
    { id: "memory", name: "Context & memory", nodes: [
      { id: "mem", label: "memory/ · project memory files", kind: "memory · durable", vis: "private", where: ["cc", "oc"],
        role: "Notes the agent re-reads at session start: where things live, gotchas, conventions discovered the hard way.",
        note: "Lessons survive the context window; the second session does not repeat the first one's mistakes." },
      { id: "decisions", label: "DECISIONS.md · decision log", kind: "memory · why", vis: "private", where: ["cc", "oc"],
        role: "One line per decision with the reason and the date; the agent appends, humans prune.",
        note: "Nobody (human or agent) relitigates a settled choice because the reasoning is on record." },
      { id: "inputs", label: "inputs/ · notes on specs and data", kind: "memory · inputs", vis: "private", where: ["cc"],
        role: "Summaries of the specs, tickets and datasets a task depends on, kept next to the code.",
        note: "The agent reads a two-page digest instead of a 200-page spec on every turn." },
      { id: "analysis", label: "analysis/{section}.json (FindingMemo)", kind: "memory · agent output", vis: "public", where: ["cc"],
        note: "One agent writes its analysis to disk; the next agent reads it. Memory between agents is a file, not a conversation.",
        code: [
          "## Your process", "",
          "1. Read the current section HTML with /analyze-section",
          "2. Identify content gaps and inaccuracies",
          "3. Generate 3-level content for each concept",
          "4. Ensure cross-tool coverage where relevant",
          "5. Write the analysis to `analysis/{section-name}.json`", "",
          "## Quality rules",
          "- Level 1 must be understandable by someone who has never used AI tools",
          "- Level 2 must be useful for a developer starting to use AI assistants",
          "- Level 3 must satisfy someone who wants to configure and optimize their setup",
          "- Never sacrifice accuracy for simplicity — simplify the explanation, not the concept",
        ] },
    ] },
    { id: "perm", name: "Permissions & safety", nodes: [
      { id: "opencode-json", label: "opencode.json · allow / ask", kind: "permissions", vis: "public", where: ["oc"],
        note: "The agent can run tests, commit and push on its own; anything destructive (git reset, rm -rf) stops and asks.",
        code: [
          "{",
          "  \"$schema\": \"https://opencode.ai/config.json\",",
          "  \"instructions\": [\"AGENTS.md\", \"TODOs.md\"],",
          "  \"permission\": {",
          "    \"bash\": {",
          "      \"*\": \"allow\",",
          "      \"git push*\": \"allow\",",
          "      \"git commit*\": \"allow\",",
          "      \"git reset*\": \"ask\",",
          "      \"rm -rf*\": \"ask\"",
          "    }",
          "  }",
          "}",
        ] },
      { id: "deny", label: "settings.json · deny list", kind: "permissions · deny", vis: "private", where: ["cc"],
        role: "Commands and paths the agent can never touch, no matter what the prompt says.",
        note: "A hard floor under the ask list: the dangerous call is not even offered for approval." },
      { id: "protected", label: "protected paths", kind: "safety · paths", vis: "public", where: ["oc", "ci"],
        note: "The commit step names the files that never get staged, so a tired reviewer is not the last line of defence.",
        code: [
          "4. Stage only intended files (never `.env`, `data/`, or `node_modules/`),",
          "   commit with a concise message matching the repo style (summary line +",
          "   bullet body), and `git push`.",
        ] },
      { id: "secrets", label: "secrets policy", kind: "safety · secrets", vis: "public", where: ["cc", "oc", "ci"],
        note: "Keys have exactly one home; the reviewer rejects any diff that hardcodes one.",
        code: [
          "AGENTS.md:",
          "- API keys only via `.env` (never committed; `.env.example` documents them).", "",
          "agents/reviewer.md:",
          "3. **Config safety** — YAML changes must validate before persisting",
          "   (see `config.update_profile_in_yaml`); secrets only via `.env`, never",
          "   committed or hardcoded.",
        ] },
    ] },
    { id: "agents", name: "Agents", nodes: [
      { id: "planner", label: "agents/planner.md", kind: "subagent · plans only", vis: "private", where: ["cc", "oc"],
        role: "Reads the task and the codebase, writes a plan with file list and risks, edits nothing.",
        note: "The expensive thinking happens once, on a small context, before any file changes." },
      { id: "frontend-builder", label: "agents/frontend-builder.md", kind: "subagent · implementer", vis: "public", where: ["cc"],
        note: "The implementer gets the stack, the style and the quality bar in its own file, so every section it builds matches.",
        code: [
          "---",
          "name: frontend-builder",
          "description: Builds production HTML/CSS/JS sections from content analysis",
          "model: opus",
          "tools: Read, Write, Edit, Bash, Glob",
          "---", "",
          "You are a senior frontend developer building an interactive educational guide. You produce clean, accessible, performant HTML/CSS/JS.", "",
          "## Quality rules",
          "- Every interactive element must work with keyboard",
          "- Animations must respect prefers-reduced-motion",
          "- Text must be readable at 13px Space Mono on dark backgrounds",
          "- Cards must have sufficient contrast (WCAG AA minimum)",
          "- No layout shifts on level toggle or tool switch",
        ] },
      { id: "reviewer", label: "agents/reviewer.md · read-only", kind: "subagent · read-only reviewer", vis: "public", where: ["oc"],
        note: "A second pair of eyes with no edit rights: it cannot fix things quietly, it must report them with file:line.",
        code: [
          "---",
          "description: Read-only reviewer for alikindoi. Use before committing or when asked to review changes — checks anti-ban rules, audit-trail rules, test coverage and docs consistency.",
          "mode: subagent",
          "permission:",
          "  edit: deny",
          "  bash: allow",
          "---", "",
          "You are the code reviewer for alikindoi, a job-scraping tracker. You NEVER",
          "modify files — you inspect and report. Start by reading `AGENTS.md` at the",
          "repo root; it defines the project's hard rules.", "",
          "## Review checklist (in priority order)", "",
          "1. **Anti-ban (hard requirement)** — reject any change that:",
          "   - lowers a value in `HARD_MIN_INTERVALS` or bypasses `source_allowed()`",
          "   - adds retries/loops against a job board (fail fast, skip, move on)",
          "2. **Audit trail** — every mutation of a `Job` row must append a `job_events`",
          "   entry; jobs are never hard-deleted (tombstone via `is_active=False`).",
        ] },
      { id: "security", label: "agents/security-reviewer.md", kind: "subagent · security", vis: "private", where: ["cc", "ci"],
        role: "Reads the diff for injection, secrets, unsafe memory and supply-chain changes; read-only like the reviewer.",
        note: "Security review runs on every change, not only on the ones someone remembered to flag." },
      { id: "tester", label: "agents/test-runner.md", kind: "subagent · tests", vis: "private", where: ["cc", "ci"],
        role: "Runs the suite, bisects failures to the smallest reproducer, reports; does not edit production code.",
        note: "The main context never fills with 2,000 lines of test output; only the verdict comes back." },
      { id: "content-architect", label: "agents/content-architect.md · docs", kind: "subagent · content / docs keeper", vis: "public", where: ["cc"],
        note: "The docs agent knows which tools exist and what their config files are called, so documentation stays accurate across tools.",
        code: [
          "---",
          "name: content-architect",
          "description: Analyzes each section and produces multi-level educational content",
          "model: opus",
          "tools: Read, Grep, Glob, WebSearch, WebFetch, Write",
          "---", "",
          "## Your knowledge base", "",
          "You understand these AI coding tools deeply:",
          "- **Claude Code**: CLAUDE.md, settings.json (4 scopes), hooks (PreToolUse/PostToolUse/SessionStart), skills (SKILL.md), agents, memory system, worktree isolation, MCP, subagents/tasks, context compaction (4 levers)",
          "- **GitHub Copilot**: copilot-instructions.md, AGENTS.md, .github/instructions/*.instructions.md, copilot-setup-steps.yml",
          "- **Cursor**: .cursor/rules/*.mdc (4 types: Always, Auto Attached, Agent Requested, Manual), agents",
          "- **OpenCode**: Go-based CLI, 75+ provider support",
        ] },
      { id: "visual-qa", label: "agents/visual-qa.md", kind: "subagent · visual QA", vis: "public", where: ["cc"],
        note: "Someone looks at the screenshots, at three widths, and writes a structured report. That someone is an agent with no write access.",
        code: [
          "---",
          "name: visual-qa",
          "description: Takes screenshots of the built page and validates visual quality",
          "model: opus",
          "tools: Read, Bash, Glob",
          "---", "",
          "## Checks per section",
          "1. **Readability**: text is legible, sufficient contrast, no overflow",
          "2. **Layout**: no overlapping elements, proper spacing, grid alignment",
          "5. **Responsiveness**: check at 1280px, 768px, 480px widths", "",
          "## Process",
          "1. Run `npm run build` to generate dist/",
          "2. Use marp CLI or browser automation to capture screenshots",
          "3. Read each screenshot and evaluate visually",
          "4. Report issues as a structured list with section, issue, severity (critical/major/minor), and suggested fix",
        ] },
      { id: "hhrr", label: "agents/hhrr-reviewer/ (cv)", kind: "agent · HR / CV reviewer", vis: "public", where: ["cc"],
        note: "A prompt, a checklist and an output template: the same review shape every time, for a document instead of code.",
        code: [
          "You are an expert Human Resources (HHRR) reviewer specializing in software developer CVs.", "",
          "When given a CV (text or markdown) and optional job posting or target role, produce a review that includes:",
          "1) Short headline summary (1-2 sentences) capturing candidate fit and top risks.",
          "2) Strengths (3-6 bullets) — what stands out and should be preserved.",
          "3) Top priority improvements (3–6 bullets) — focus on things that increase interview chances.",
          "5) Concrete rewrite suggestions for 2–4 example bullet points or the professional summary (show before → after).",
          "7) Final score (1-10) and concise next steps (apply, tailor, add projects, refine metrics).", "",
          "checklist.md · Red flags:",
          "- Vague verbs without outcomes (\"worked on\", \"responsible for\").",
        ] },
    ] },
    { id: "cmd", name: "Commands", nodes: [
      { id: "test", label: "commands/test.md · /test", kind: "command · /test", vis: "public", where: ["oc"],
        note: "The agent owns the red-to-green loop, but is told exactly where the line is: fix the root cause, never commit.",
        code: [
          "---",
          "description: Run the full verification suite (backend pytest + frontend build) and report results.",
          "agent: build",
          "---", "",
          "Run the project's verification suite and report a compact summary:", "",
          "1. Backend tests: `backend/.venv/bin/pytest` (from repo root)",
          "2. Frontend build: `npm run build` in `frontend/`",
          "3. If anything fails: read the errors, fix the root cause with minimal",
          "   changes, and re-run until green.", "",
          "$ARGUMENTS", "",
          "Report: tests passed/failed count, build status, and any fixes applied.",
          "Do NOT commit — that is what /ship is for.",
        ] },
      { id: "ship", label: "commands/ship.md · /ship", kind: "command · /ship", vis: "public", where: ["oc"],
        note: "One word ships a change the same way every time: verify, independent review, then a commit in the repo's own style.",
        code: [
          "---",
          "description: Verify (tests + build), review the diff, then commit and push with a convention-following message.",
          "agent: build",
          "---", "",
          "Ship the current changes. Follow these steps in order:", "",
          "1. Run the verification suite: `backend/.venv/bin/pytest` and",
          "   `npm run build` in `frontend/`. Stop and fix if not green.",
          "2. Use the `reviewer` subagent (Task tool) to review `git diff HEAD` against",
          "   the project rules. Address any REQUEST CHANGES findings first.",
          "3. Inspect `git status` and `git log --oneline -5` for message style.",
          "4. Stage only intended files (never `.env`, `data/`, or `node_modules/`),",
          "   commit with a concise message matching the repo style (summary line +",
          "   bullet body), and `git push`.", "",
          "Report: commit hash, pushed branch, one-line summary of what shipped.",
        ] },
      { id: "review", label: "commands/review.md · /review", kind: "command · /review", vis: "private", where: ["cc", "oc"],
        role: "Runs the reviewer and the security reviewer on a diff or a PR and merges their findings into one list.",
        note: "A review is one keystroke, so it happens before every commit instead of before the important ones." },
      { id: "release", label: "commands/release.md · /release", kind: "command · /release", vis: "private", where: ["cc", "ci"],
        role: "Changelog from the commits, version bump, tag, release notes draft; stops before anything is published.",
        note: "Releases follow the same checklist whether a human or an agent cuts them." },
      { id: "triage", label: "commands/triage.md · /triage", kind: "command · /triage", vis: "private", where: ["cc"],
        role: "Reads new issues and failing CI runs, labels them, proposes an owner and a first hypothesis.",
        note: "The morning queue arrives pre-sorted with a hypothesis attached to each item." },
    ] },
    { id: "skills", name: "Skills", nodes: [
      { id: "skill", label: "skills/scraping-safety/SKILL.md", kind: "skill · auto-triggered", vis: "public", where: ["oc"],
        note: "Domain rules load only when relevant files are touched, and they outrank the feature request that triggered the edit.",
        code: [
          "---",
          "name: scraping-safety",
          "description: Anti-ban and rate-limiting rules for alikindoi's scraping engine. Use when modifying adapters/, runner.py, scheduler.py, salary/description enrichment, config rate_limits, or adding a new job-board source.",
          "---", "",
          "# Scraping safety — alikindoi", "",
          "This project's survival depends on NOT getting banned by job boards. When",
          "touching scraping code, these rules override any feature request.", "",
          "## Hard invariants (never weaken)", "",
          "- `config.HARD_MIN_INTERVALS` floors (minutes): indeed/google 30, linkedin",
          "  720, glassdoor/zip_recruiter 120, APIs 15. Values below the floor are",
          "  rejected at config load — keep it that way.",
          "- On 429/403 or adapter failure: log, record `scrape_runs(status='failed')`,",
          "  move on. No retry loops, no concurrent fetches against one source.",
        ] },
      { id: "build-section", label: "skills/build-section/SKILL.md", kind: "skill · build", vis: "public", where: ["cc"],
        note: "A repeatable recipe for the most common unit of work, including the research the agent must do before writing.",
        code: [
          "---",
          "name: build-section",
          "description: Generate production HTML/CSS/JS for a single page section with multi-level content support",
          "---", "",
          "Given an analysis from /analyze-section, build the complete HTML/CSS/JS for one section.", "",
          "## Web Research Phase (run FIRST)",
          "Before building, use WebSearch/WebFetch to gather implementation resources:",
          "- **Library versions**: Search for latest CDN links for GSAP, ScrollTrigger, and any other libraries used. Verify current API syntax hasn't changed.",
          "- **Accessibility patterns**: Search for ARIA patterns relevant to the section's interactive elements (tabs, toggles, expandable panels) from WAI-ARIA Practices.",
        ] },
      { id: "analyze-section", label: "skills/analyze-section/SKILL.md", kind: "skill · analyse", vis: "public", where: ["cc"],
        note: "Analysis is split from building and gets its own skill, so the agent critiques before it edits.",
        code: [
          "---",
          "name: analyze-section",
          "description: Analyze a webpage section from frontend + AI-expert perspectives, producing multi-level content",
          "---", "",
          "## Frontend Analysis",
          "- Layout effectiveness (grid, spacing, responsiveness)",
          "- Visual hierarchy (headings, contrast, whitespace)",
          "- Accessibility (keyboard nav, screen readers, contrast ratios)", "",
          "## AI Expert Analysis (informed by web research)",
          "- Accuracy of concepts presented — cross-reference with latest official docs",
          "- Cross-tool coverage (Claude Code, Copilot, Cursor, OpenCode) — verify feature claims against current release notes",
          "- Flag any outdated information found (model names, pricing, capabilities that have changed)",
        ] },
      { id: "build-fauna", label: "skills/build-fauna/SKILL.md", kind: "skill · build", vis: "public", where: ["cc"],
        note: "Even the playful part (background fish) is specified: rarity weights, spawn rates, speed rules. Specified means reproducible.",
        code: [
          "---",
          "name: build-fauna",
          "description: Generate the dynamic ocean fauna system (background fish, creatures, Nemo companion)",
          "---", "",
          "## Species Registry",
          "Define species with: sprite path, pixel height, opacity, speed range, rarity weight, and optional special behavior.", "",
          "Categories by rarity:",
          "- Common (w:15-20): small colorful fish (6+ variants)",
          "- Rare (w:2-4): turtle, jellyfish, seahorse",
          "- Ultra-rare (w:0.5-1): shark, manta ray, whale", "",
          "## Spawner Logic",
          "- Spawn one creature every 3-5 seconds (randomized interval)",
          "- Speed proportional to size (bigger = slower)",
        ] },
      { id: "domain", label: "skills/<domain>/SKILL.md", kind: "skills · domain", vis: "private", where: ["cc", "oc"],
        role: "Rules for the work codebase's build system, coding standards and safety-critical areas, triggered by the files being edited.",
        note: "Domain knowledge is loaded on demand by path, not pasted into every prompt." },
    ] },
    { id: "hooks", name: "Hooks", nodes: [
      { id: "pretool", label: "hooks/pre-tool-use · guard", kind: "hook · PreToolUse", vis: "private", where: ["cc"],
        role: "Runs before every tool call; blocks commands and paths that policy forbids and rewrites risky ones into safe variants.",
        note: "Policy is enforced by code outside the model, so a persuasive prompt cannot talk it away." },
      { id: "postedit", label: "hooks/post-edit · formatter + linter", kind: "hook · PostToolUse", vis: "private", where: ["cc"],
        role: "After each edit, formats the file and runs the linter; findings go back into the context immediately.",
        note: "Style issues never reach review; the agent fixes lint while the file is still in its head." },
      { id: "sessionstart", label: "hooks/session-start · bootstrap", kind: "hook · SessionStart", vis: "private", where: ["cc", "ci"],
        role: "Installs dependencies, warms caches, prints the branch, the open tasks and the memory digest.",
        note: "The first turn of every session starts informed and with tests runnable." },
      { id: "stop", label: "hooks/stop · summary", kind: "hook · Stop", vis: "private", where: ["cc"],
        role: "When the agent stops, writes what changed, what was verified and what is still open into the memory and the decision log.",
        note: "Sessions leave a trail that the next session, or a colleague, can pick up." },
    ] },
    { id: "tools", name: "Tools & MCP", nodes: [
      { id: "git", label: "git · GitHub", kind: "tool · scm", vis: "public", where: ["cc", "oc", "ci"],
        note: "Git is allowed by default, so the agent can branch, commit and push; the permission file decides which git verbs ask first.",
        code: [
          "opencode.json:",
          "      \"git push*\": \"allow\",",
          "      \"git commit*\": \"allow\",",
          "      \"git reset*\": \"ask\",", "",
          "commands/ship.md:",
          "3. Inspect `git status` and `git log --oneline -5` for message style.",
        ] },
      { id: "browser", label: "browser · screenshots", kind: "tool · browser", vis: "public", where: ["cc"],
        note: "The agent can see what it built; visual QA becomes a tool call instead of a question to a human.",
        code: [
          "agents/visual-qa.md:",
          "## Process",
          "1. Run `npm run build` to generate dist/",
          "2. Use marp CLI or browser automation to capture screenshots",
          "3. Read each screenshot and evaluate visually",
        ] },
      { id: "db", label: "mcp · database", kind: "MCP server · read-only DB", vis: "private", where: ["cc"],
        role: "A read-only connection to the test database so the agent can check the data its code will meet.",
        note: "Queries replace guesses; the agent writes migrations against real shapes." },
      { id: "ci-mcp", label: "mcp · CI", kind: "MCP server · CI runs", vis: "private", where: ["cc"],
        role: "Reads pipeline status and logs; cannot trigger deployments.",
        note: "A red pipeline is diagnosed by the agent before a human opens the log viewer." },
      { id: "issues", label: "mcp · issue tracker", kind: "MCP server · issues", vis: "private", where: ["cc", "oc"],
        role: "Reads tickets and comments; writes only labels and comments, never state transitions.",
        note: "Tasks arrive with their ticket context attached and results get posted where the team already looks." },
    ] },
    { id: "evals", name: "Evaluation", nodes: [
      { id: "suite", label: "evals/ · eval suites", kind: "evaluation · suites", vis: "private", where: ["cc", "ci"],
        role: "A fixed set of tasks the harness is run against after every change to instructions, agents or skills.",
        note: "A change to a prompt is measured like a change to code: did the pass rate move?" },
      { id: "golden", label: "evals/golden/ · golden outputs", kind: "evaluation · goldens", vis: "private", where: ["ci"],
        role: "Reference outputs for the eval tasks, reviewed by humans, diffed against new runs.",
        note: "Regressions in quality show up as diffs, not as vague feelings in review." },
      { id: "budget", label: "evals/budgets · cost + latency", kind: "evaluation · budgets", vis: "private", where: ["ci"],
        role: "Per-task ceilings on tokens, wall-clock time and retries; the run fails when it blows the budget.",
        note: "A harness that quietly got 3x more expensive is caught the same week." },
      { id: "qa-report", label: "qa-report.md (FindingMemo)", kind: "evaluation · QA report", vis: "public", where: ["cc"],
        note: "The eval result is a file with pass/fail per check, so it can be diffed, tracked and argued about.",
        code: [
          "agents/visual-qa.md:",
          "## Output",
          "Write results to `qa-report.md` with:",
          "- Screenshot of each section (reference path)",
          "- Pass/fail per check",
          "- List of issues with severity",
        ] },
    ] },
    { id: "ci", name: "CI integration", nodes: [
      { id: "prtpl", label: ".github/PULL_REQUEST_TEMPLATE.md", kind: "CI · PR template", vis: "private", where: ["ci"],
        role: "The PR body the agent must fill: what changed, how it was verified, which rules it touched, what the reviewer said.",
        note: "Agent-made PRs look like team PRs, and the verification evidence is in the body, not in a chat log." },
      { id: "bot", label: "ci/review-bot", kind: "CI · review bot", vis: "private", where: ["ci"],
        role: "Runs the read-only reviewer agent on every PR and posts its findings as review comments.",
        note: "The same reviewer that gates the local commit gates the merge, with no laptop involved." },
      { id: "deploy", label: ".github/workflows/deploy.yml", kind: "CI · deploy gate", vis: "public", where: ["ci"],
        note: "The deploy job needs a green build job and minimal permissions; nothing ships because an agent said it was fine.",
        code: [
          "name: Deploy to GitHub Pages", "",
          "on:",
          "  push:",
          "    branches: [master]",
          "  workflow_dispatch:", "",
          "permissions:",
          "  contents: read",
          "  pages: write",
          "  id-token: write", "",
          "jobs:",
          "  build:",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: actions/checkout@v4",
          "      - run: npm ci",
          "      - name: Build all lessons",
          "        run: bash scripts/build.sh", "",
          "  deploy:",
          "    needs: build",
        ] },
    ] },
  ];
  const NODES = {};
  GROUPS.forEach((g) => g.nodes.forEach((n) => { n.group = g; NODES[n.id] = n; }));

  /* ---------------- explorer: tabs ---------------- */
  const tabs = $$(".agents-tab");
  function selectTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const pane = document.getElementById(t.getAttribute("aria-controls"));
      if (pane) pane.hidden = !on;
    });
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      let j = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j]); tabs[j].focus(); }
    });
  });

  /* ---------------- explorer: layered tree ---------------- */
  const tree = $("#agents-tree");
  const codeEl = $("#agents-code"), preEl = $("#agents-pre"), pathEl = $("#agents-code-path"), kindEl = $("#agents-code-kind");
  const visEl = $("#agents-code-vis"), noteEl = $("#agents-code-note"), redEl = $("#agents-redacted"), redText = $("#agents-redacted-text");
  const whereChips = $$(".agents-where-chip");
  let current = null;

  function showNode(id) {
    const n = NODES[id]; if (!n || !codeEl) return;
    current = id;
    pathEl.textContent = n.label; kindEl.textContent = n.kind;
    visEl.textContent = n.vis; visEl.dataset.vis = n.vis;
    noteEl.textContent = n.note;
    if (n.vis === "public") {
      codeEl.textContent = n.code.join("\n");
      preEl.hidden = false; redEl.hidden = true;
    } else {
      codeEl.textContent = "";
      preEl.hidden = true; redEl.hidden = false;
      redText.textContent = n.role + " " + PRIVATE_NOTE;
    }
    whereChips.forEach((c) => c.classList.toggle("on", n.where.includes(c.dataset.where)));
    $$(".agents-file", tree).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.file === id)));
  }

  function buildTree() {
    if (!tree) return;
    let pub = 0, priv = 0;
    GROUPS.forEach((g) => {
      const gp = g.nodes.filter((n) => n.vis === "public").length, gv = g.nodes.length - gp;
      pub += gp; priv += gv;
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "agents-group"; btn.setAttribute("role", "treeitem");
      btn.setAttribute("aria-expanded", String(!!g.open)); btn.setAttribute("aria-level", "1");
      btn.dataset.group = g.id; btn.tabIndex = -1;
      btn.innerHTML = `<span class="agents-caret" aria-hidden="true">▸</span><span class="agents-gname"></span><span class="agents-gcount"><b></b> pub · <span></span> priv</span>`;
      btn.querySelector(".agents-gname").textContent = g.name + "/";
      btn.querySelector(".agents-gcount b").textContent = gp;
      btn.querySelector(".agents-gcount span").textContent = gv;
      const ul = document.createElement("ul");
      ul.className = "agents-children"; ul.setAttribute("role", "group"); ul.hidden = !g.open;
      g.nodes.forEach((n) => {
        const li = document.createElement("li"); li.setAttribute("role", "none");
        const b = document.createElement("button");
        b.type = "button"; b.className = "agents-file"; b.setAttribute("role", "treeitem"); b.setAttribute("aria-level", "2");
        b.dataset.file = n.id; b.dataset.vis = n.vis; b.tabIndex = -1; b.setAttribute("aria-selected", "false");
        b.innerHTML = `<span class="agents-fname"></span><span class="agents-vis"></span>`;
        b.querySelector(".agents-fname").textContent = n.label;
        const v = b.querySelector(".agents-vis"); v.textContent = n.vis === "public" ? "pub" : "priv"; v.dataset.vis = n.vis;
        v.setAttribute("aria-label", n.vis);
        li.append(b); ul.append(li);
      });
      btn.addEventListener("click", () => toggleGroup(btn, ul));
      tree.append(btn, ul);
    });
    const count = $("#agents-tree-count"); if (count) count.textContent = `${pub} public · ${priv} private`;
  }
  function toggleGroup(btn, ul, force) {
    const open = force ?? btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open)); ul.hidden = !open;
  }
  function visibleItems() { return $$('[role="treeitem"]', tree).filter((el) => !el.closest("ul[hidden]")); }
  function focusItem(el) { visibleItems().forEach((e) => (e.tabIndex = -1)); el.tabIndex = 0; el.focus(); }
  buildTree();
  tree?.addEventListener("click", (e) => {
    const f = e.target.closest(".agents-file"); if (f) { showNode(f.dataset.file); focusItem(f); }
  });
  tree?.addEventListener("keydown", (e) => {
    const el = e.target.closest('[role="treeitem"]'); if (!el) return;
    const items = visibleItems(), i = items.indexOf(el);
    const isGroup = el.classList.contains("agents-group");
    let j = null;
    if (e.key === "ArrowDown") j = Math.min(items.length - 1, i + 1);
    else if (e.key === "ArrowUp") j = Math.max(0, i - 1);
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = items.length - 1;
    else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (isGroup) { if (el.getAttribute("aria-expanded") !== "true") toggleGroup(el, el.nextElementSibling, true); else { const first = el.nextElementSibling.querySelector(".agents-file"); if (first) focusItem(first); } }
      return;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (isGroup) toggleGroup(el, el.nextElementSibling, false);
      else focusItem(el.closest("ul").previousElementSibling);
      return;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isGroup) toggleGroup(el, el.nextElementSibling); else showNode(el.dataset.file);
      return;
    } else if (e.key === "*") {
      e.preventDefault(); $$(".agents-group", tree).forEach((g) => toggleGroup(g, g.nextElementSibling, true)); return;
    }
    if (j !== null) { e.preventDefault(); focusItem(items[j]); }
  });
  if (tree) {
    showNode("agents-md");
    const first = $(".agents-file[data-file='agents-md']", tree) || $('[role="treeitem"]', tree);
    if (first) first.tabIndex = 0;
  }

  /* ---------------- explorer: topology ---------------- */
  // The packet only moves when motion is allowed; otherwise it is removed and
  // the diagram is a still with its legend.
  const packet = $(".agents-topo-packet");
  if (packet && reduced) packet.remove();

  /* ---------------- explorer: the loop ---------------- */
  const STEPS = [
    { fill: 12, text: "You describe the task. The prompt, the loaded instructions (AGENTS.md, CLAUDE.md), the memory files and any triggered skills go into the context window first." },
    { fill: 22, text: "The model reads the whole context and decides: answer, or call a tool. With a harness, what it reads first is yours, not luck." },
    { fill: 34, text: "It calls a tool: read a file, run the tests, ask a subagent. The pre-tool-use hook and the permissions decide which calls run, which ask first and which are blocked." },
    { fill: 58, text: "The result (a diff, a stack trace, the reviewer's verdict, the post-edit lint) comes back and is appended to the context. Big outputs cost the most." },
    { fill: 88, text: "Every turn adds to the window. It never forgets by itself, so the loop goes back to the model with a fuller, slower, pricier context." },
    { fill: 18, text: "Near the limit the history is summarised: compaction. The harness files survive because they are re-read, not remembered. Then the loop continues." },
  ];
  const stepBtns = $$(".agents-step"), fill = $("#agents-ctx-fill"), pct = $("#agents-ctx-pct");
  const stepText = $("#agents-step-text"), stepCount = $("#agents-step-count"), prev = $("#agents-prev"), next = $("#agents-next");
  let step = 0;
  function setStep(n, focus = false) {
    step = (n + STEPS.length) % STEPS.length;
    const s = STEPS[step];
    stepBtns.forEach((b, i) => {
      if (i === step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.classList.toggle("done", i < step);
    });
    if (fill) { fill.style.width = s.fill + "%"; fill.classList.toggle("agents-full", s.fill > 80); }
    if (pct) pct.textContent = s.fill + "%";
    if (stepText) stepText.textContent = s.text;
    if (stepCount) stepCount.textContent = `Step ${step + 1} / ${STEPS.length}`;
    if (prev) prev.textContent = step === 0 ? "← Start" : "← Prev";
    if (next) next.textContent = step === STEPS.length - 1 ? "Loop again ↻" : "Next →";
    if (focus) stepBtns[step]?.focus();
  }
  prev?.addEventListener("click", () => setStep(step - 1));
  next?.addEventListener("click", () => setStep(step + 1));
  stepBtns.forEach((b, i) => {
    b.addEventListener("click", () => setStep(i));
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); setStep(step + 1, true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); setStep(step - 1, true); }
    });
  });
  if (stepBtns.length) setStep(0);

  /* ---------------- atmosphere: a network with an agent loop ---------------- */
  // Nodes scattered across the viewport, edges to near neighbours; a ring of
  // "loop" nodes lights up in sequence with packets travelling along the ring.
  // Colours come from the --gn token via ATMO: thin green ink on the light
  // theme, glowing nodes on the dark one. Centre column is kept dim so
  // content on top stays readable.
  let nodes = [], edges = [], ring = [], packets = [], seed = 1;
  let G = "58,138,60", K = 1, dark = false; // rebuilt by theme()
  const col = (a) => `rgba(${G},${Math.min(1, a * K).toFixed(3)})`;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  function theme(isDark) {
    const A = window.ATMO;
    dark = !!isDark;
    G = A.rgb("--gn").join(",");
    K = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--atmo-alpha")) || 1;
    if (!dark) K *= .85; // ink, not glow
  }
  function build(s) {
    seed = 7; nodes = []; edges = []; ring = []; packets = [];
    const n = Math.round(Math.min(90, Math.max(34, (s.w * s.h) / 22000)));
    for (let i = 0; i < n; i++) nodes.push({ x: rnd() * s.w, y: rnd() * s.h, r: .9 + rnd() * 1.4, p: rnd() * Math.PI * 2, glow: 0 });
    // the loop: 8 nodes on an ellipse around the viewport centre
    const cx = s.w * .5, cy = s.h * .5, rx = Math.min(s.w * .42, 520), ry = Math.min(s.h * .36, 360);
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI / 2 + (k / 8) * Math.PI * 2 + (rnd() - .5) * .25;
      nodes.push({ x: cx + Math.cos(a) * rx * (0.92 + rnd() * .16), y: cy + Math.sin(a) * ry * (0.92 + rnd() * .16), r: 2.4, p: rnd() * Math.PI * 2, glow: 0, loop: true });
      ring.push(nodes.length - 1);
    }
    // edges: each node to its 2 nearest neighbours, plus the ring itself
    const seen = new Set();
    const add = (a, b, loop) => { const k = a < b ? a + "-" + b : b + "-" + a; if (seen.has(k)) return; seen.add(k); edges.push({ a, b, loop: !!loop }); };
    nodes.forEach((p, i) => {
      const near = nodes.map((q, j) => ({ j, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 })).filter((o) => o.j !== i).sort((u, v) => u.d - v.d).slice(0, 2);
      near.forEach((o) => { if (o.d < (s.w * .22) ** 2) add(i, o.j); });
    });
    ring.forEach((id, k) => add(id, ring[(k + 1) % ring.length], true));
  }
  function centreDim(x, s) { // 0 under the centre column, 1 at the edges
    const d = Math.abs(x - s.w * .5) / (s.w * .5);
    return .35 + .65 * Math.min(1, Math.max(0, (d - .25) / .35));
  }
  function spawnPacket() {
    const e = edges[Math.floor(Math.random() * edges.length)]; if (!e || e.loop) return;
    packets.push({ e, t: 0, v: .35 + Math.random() * .4, dir: Math.random() < .5 ? 1 : -1 });
  }
  window.ATMO.register("agents", {
    init(canvas, ctx, s) { theme(window.ATMO.isDark()); build(s); },
    resize(s) { build(s); },
    theme,
    draw(ctx, s, t, dt) {
      ctx.clearRect(0, 0, s.w, s.h);
      const period = 1.6, phase = (t / period) % ring.length, active = Math.floor(phase), frac = phase - active;
      // edges
      ctx.lineWidth = dark ? 1 : .8;
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b];
        const dim = Math.min(centreDim(a.x, s), centreDim(b.x, s));
        let alpha = (e.loop ? .16 : .07) * dim;
        if (e.loop) {
          const k = ring.indexOf(e.a), k2 = ring.indexOf(e.b);
          const isActive = (k === active && k2 === (active + 1) % ring.length) || (k2 === active && k === (active + 1) % ring.length);
          if (isActive) alpha += .3 * dim;
        }
        ctx.strokeStyle = col(alpha);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // nodes
      ring.forEach((id, k) => { const n = nodes[id]; const target = k === active ? 1 : 0; n.glow = reduced ? target : n.glow + (target - n.glow) * Math.min(1, dt * 6); });
      for (const n of nodes) {
        const dim = centreDim(n.x, s);
        const base = n.loop ? .4 : .2 + .1 * Math.sin(t * .8 + n.p);
        const a = Math.min(1, (base + .6 * n.glow) * dim);
        ctx.fillStyle = col(a);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + n.glow * 2.2, 0, Math.PI * 2); ctx.fill();
        if (n.glow > .05) {
          // dark: a soft halo; light: a thin ink ring
          ctx.lineWidth = dark ? 1 : .7;
          ctx.strokeStyle = col(n.glow * (dark ? .35 : .5) * dim);
          ctx.beginPath(); ctx.arc(n.x, n.y, 6 + n.glow * 10, 0, Math.PI * 2); ctx.stroke();
          if (dark) { ctx.strokeStyle = col(n.glow * .12 * dim); ctx.beginPath(); ctx.arc(n.x, n.y, 12 + n.glow * 16, 0, Math.PI * 2); ctx.stroke(); }
        }
      }
      // the loop packet: travels along the active ring edge
      if (ring.length) {
        const a = nodes[ring[active]], b = nodes[ring[(active + 1) % ring.length]];
        const x = a.x + (b.x - a.x) * frac, y = a.y + (b.y - a.y) * frac;
        ctx.fillStyle = col(.9 * centreDim(x, s));
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      // occasional background packets
      if (!reduced && Math.random() < dt * .9 && packets.length < 6) spawnPacket();
      packets = packets.filter((p) => { p.t += dt * p.v; return p.t < 1; });
      for (const p of packets) {
        const a = nodes[p.e.a], b = nodes[p.e.b], f = p.dir > 0 ? p.t : 1 - p.t;
        const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f;
        ctx.fillStyle = col(.55 * centreDim(x, s));
        ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
    },
  });
})();
