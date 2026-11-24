# Claude Agent Guidelines

## Git Branching Rules
- **New Games**: MUST create a dedicated branch (`feat/<game-name>`). Never commit new games directly to `main`.
- **Big Bug Fixes / Major Refactors**: MUST create a dedicated branch (`fix/<bug-name>` or `refactor/<target>`). Do not make large modifications directly on `main`.
- **Small Hotfixes**: Minor doc edits or single-line fixes allowed on `main`.

## Development & Tech Rules
- **Stack**: Vanilla JavaScript, HTML5 Canvas / WebGL, static files only. No build tools or bundlers.
- **Audio & Core**: Use [`src/arcade-core.js`](src/arcade-core.js) for sound and arcade helpers.
- **Hub Registration**: Any new game must be linked in `index.html`, `games_liste.md`, and `README.md`.
- **Branch Procedure**:
  ```bash
  git checkout -b feat/<game-name>
  # make changes and verify
  git commit -m "feat(<game>): add <game description>"
  ```

## Tool Delegation
- **agy (Gemini)**: When possible, delegate tasks where Gemini is stronger to the Antigravity CLI: `agy -p "<prompt>"` (non-interactive). Examples: image/sprite/texture generation, analysing screenshots or visual output, very large-context reads across many files, Google-grounded web research. Review agy's output before using it.
- **Blender**: Before creating or editing 3D models, textures or scenes, ask the user whether Blender (Blender MCP) should be used. Do not start Blender without confirmation.
