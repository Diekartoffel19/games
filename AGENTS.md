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
