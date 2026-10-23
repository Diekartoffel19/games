# Bad Haircut Barber: Notes

Quick reference for the game. The full design doc is in [.agents/skills/haircut/SKILL.md](.agents/skills/haircut/SKILL.md).

## Status

- **Built:** [games/haircut.html](games/haircut.html), a single-file canvas game. Nothing is committed yet (branch `add-new-games`).
- **Registered in:** [index.html](index.html) hub card (💈), [sitemap.xml](sitemap.xml), [.agents/skills/project-structure/SKILL.md](.agents/skills/project-structure/SKILL.md).
- **Other new files:** [.claude/launch.json](.claude/launch.json) (preview server on port 8765), and the design doc above.

## How to run

```bash
python -m http.server 8765
```

Then open http://localhost:8765/games/haircut.html. Opening the file directly also works.

## How it plays

- Hold the mouse or finger to run the clippers. Trim each strand to the dashed guide line.
- Cutting too short is permanent and makes the customer flinch and nervous.
- **DONE** (button, Space or Enter) ends the cut early for a speed bonus. Timeout means the customer is late.
- Six customers per shift. Each has its own hairstyle and wobble style (see the design doc table).
- Reaction tiers, from neatness score:

| Neatness | Tier | Tip |
|---|---|---|
| ≥ 92% | MASTERPIECE | q×60 + speed |
| ≥ 80% | Sharp! | q×60 + speed |
| ≥ 65% | Passable | q×60 + speed |
| ≥ 48% | Rough | q×20 |
| ≥ 30% | Devastating | 0 |
| < 30% | CATASTROPHE | −$20 |

Best shift is saved through `ArcadeCore.saveScore('haircut', …)`.

## Tuning knobs (top of the script in haircut.html)

- `TOL = 5`: how close to the guide counts as "good enough" (px).
- `BLADE = 9`: how far the clippers reach to each side (px).
- `NSTR = 130`: number of strands. More looks smoother but costs more per frame.
- `time` on each entry in `CUSTOMERS`: seconds per customer (28 to 30 now).
- `FLINCH` and `TIERS` arrays: the speech lines.

## What has been verified

- Scripted run in Node with a stubbed DOM, through all 6 customers. Perfect cuts gave MASTERPIECE (+$107). Deep cuts gave CATASTROPHE (−$20). The shift total and best score saved correctly.
- Browser: intro screen, the shop, the mirror, the order ticket, and the CATASTROPHE reaction card all render.
- Fixed a bug where fast drags skipped strands. Cutting now also runs on pointer events, not only per frame.

## Not verified yet

- Playing by hand at full speed. The browser pane was hidden, so frame timing was throttled.
- Sound. Web Audio only runs after a user gesture, and it was never heard in a live run.
- Touch and phone layout. The canvas scales, but touch cutting hasn't been tried on a real device.
- Balance. The timings, tip values and the neatness thresholds are first guesses.

## Open ideas

- Adjust tip amounts and thresholds after playtesting.
- Check how the speed bonus feels on the 30-second customers.
- Consider a "Hold to shave" control for touch users, if dragging is awkward.

## Git

Nothing is committed. When you want to commit, the changed files are: `games/haircut.html`, `index.html`, `sitemap.xml`, `.agents/skills/project-structure/SKILL.md`, `.agents/skills/haircut/SKILL.md`, `.claude/launch.json`, and this file.
