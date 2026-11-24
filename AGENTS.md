# Agent Instructions

## Git Workflow & Branching Strategy
- **New Games**: ALWAYS create a new branch (`feat/<game-name>`). Never develop or commit new games directly to `main`.
- **Big Bug Fixes / Large Refactors**: ALWAYS create a new branch (`fix/<bug-description>` or `refactor/<target>`).
- **Small / Trivial Hotfixes**: Direct commits to `main` permitted only for minor typo fixes or single-line tweaks.
- **Workflow Steps**:
  1. Ensure clean working directory: `git status`.
  2. Create and switch to new branch: `git checkout -b <branch-name>`.
  3. Implement changes and test.
  4. Commit with descriptive Conventional Commits message.
  5. Push branch to remote.

## Project Guidelines
- **Tech Stack**: Pure client-side static web (HTML5, Canvas, WebGL/Three.js, Vanilla JS). No bundler, no build step, no npm runtime dependencies.
- **Shared Audio & Utilities**: Reuse `src/arcade-core.js` for audio effects, sound synthesis, and high score storage where applicable.
- **Catalog Updates**: When introducing a new game, add entries to:
  - `index.html` (hub card/listing)
  - `games_liste.md`
  - `README.md`
- **Verification**: Verify games by serving locally (e.g., `python -m http.server 8000` or `npx serve .`) and testing interaction in browser.

## Tool Delegation
- **agy (Gemini)**: Agents other than Gemini/Antigravity should, when possible, delegate tasks where Gemini is stronger to the Antigravity CLI: `agy -p "<prompt>"` (non-interactive). Examples: image/sprite/texture generation, analysing screenshots or visual output, very large-context reads across many files, Google-grounded web research. Review agy's output before using it.
- **Blender**: Before creating or editing 3D models, textures or scenes, ask the user whether Blender (Blender MCP) should be used. Do not start Blender without confirmation.
