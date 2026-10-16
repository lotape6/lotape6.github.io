# Chapter: Daily toolkit (terminal craft)

Source: https://github.com/laiadlotape/dotfiles (read 2026-10-16), https://github.com/lotape6/flux-capacitor, https://github.com/lotape6/ShellCheatsheet

## One-line thesis
A terminal tuned so that moving between projects, sessions and files costs one keystroke, and the whole setup reinstalls on a new machine with one command.

## The stack (as it really is in the dotfiles)
| Layer | Tool | How it is used |
|---|---|---|
| Terminal | **kitty** | borderless, 90% opacity, Ubuntu Sans Mono 13, 100k scrollback, theme loaded by include |
| Shell | **zsh + Oh My Zsh** | plugins: git, z, docker, kubectl, fzf, tmuxinator; zsh-autosuggestions and zsh-syntax-highlighting as submodules; 100k shared history with dedup and timestamps |
| Prompt | **Starship** | directory, git branch/status, language runtimes (python, node, rust, go, java), kubernetes and docker context, command duration |
| Multiplexer | **tmux + TPM** | vi copy mode to clipboard, Alt+arrows pane navigation, Alt+1..9 windows, Alt+v / Alt+o splits in the current path, `prefix r` reload |
| Session launcher | **tmuxinator** | project layouts in YAML (`mux`); the `Town.yml` layout opens the Git worktree tree `~/gt/<repo>/crew/<branch>` |
| Fuzzy finder | **fzf + fd + bat + delta** | fd as default command (hidden files, no .git), Ctrl-T with bat preview, Ctrl-R history, Ctrl-/ toggles preview; colours and symbols come from the active theme |
| Installer | **dotbot** | `install.conf.yaml` links everything into `~`, pulls submodules and installs tmux plugins; `test/validate.sh` checks the result |

## Signature pieces (worth showing as interactive demos)
1. **tmux-sessionizer** (Alt+q, inside and outside tmux): fzf list of sessions with a live full-scrollback preview of each session's pane on the right (80% width), adaptive popup height. Outside tmux it is a zsh widget so fzf gets a TTY.
2. **tmux-projects** (Alt+w): fzf picker over tmuxinator projects; live pane preview for running ones, syntax-highlighted YAML for the others; Alt+o toggles preview mode, Alt+e edits the config and offers a restart.
3. **Themes as data**: five palettes (lavender = Catppuccin Mocha, rose, mint = Everforest, peach, gentle). One variable, `DOTFILES_THEME`, switches kitty colours, Starship, tmux, fzf colours and even the prompt glyphs (`❯`, `◈`, `✦`). Each theme exports `THEME_*` variables that every script reads.
4. **Status bar scripts**: `tmux-metrics` (load, memory %, GPU % from nvidia-smi) and `tmux-net-stat` (up/down rate) feed the tmux status line.
5. **flux-capacitor**: an earlier, Back-to-the-Future flavoured tmux session manager (`flux connect <dir>`, pre and post commands, env file autoload) with GitHub Actions integration tests; the sessionizer in the dotfiles is its successor.
6. **ShellCheatsheet**: a one-page LaTeX cheat sheet of the shell tools above (PNG + PDF in the repo).

## Small facts for the page
- Everything is symlinked, nothing copied: `git pull` updates the machine.
- History: 100,000 entries, shared across panes, written immediately.
- Safety aliases: `rm`, `cp`, `mv` are interactive by default.
- Git worktree workflow: repos live under `~/gt/<repo>/crew/<branch>`, one tmux window per worktree.
- There is a Bazel-built personal CLI (`taskslam-cli`) referenced in the aliases: a hint of a personal task tool. Ask the user whether to mention it.

## Suggested interactive element
A fake terminal panel: visitor presses Alt+q (or clicks) and the sessionizer popup appears with the five themes selectable, re-colouring the panel live. Keystroke legend underneath.
