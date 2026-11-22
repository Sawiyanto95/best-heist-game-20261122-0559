# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Sawiyanto95/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Sawiyanto95/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Velvet Vault v2** — an art-deco museum heist in four rooms. You are Rook, the thief: lift the Velvet Diamond, the Sunburst Ruby, and the Crown of Aurelia, then run for the rooftop skylight. Guards patrol with sweeping red vision cones, cameras watch the halls, lasers guard the crown, and every second you are seen, the alarm climbs. Hide behind crates and display cases, slip over velvet ropes, spend smoke bombs, decoy coins and a shadow cloak, and get out rich.

## Run it

Serve the `game/` folder with any static server, then open it in a desktop browser:

```sh
python3 -m http.server -d game
```

Then open http://localhost:8000 — no network request, no build step.

## Controls

- **WASD / arrow keys** — move Rook
- **E** — drop a smoke bomb (costs 100 points, blinds guards and cameras)
- **Q** — raise the shadow cloak (costs 150 points, invisible to every cone for 3 seconds)
- **Click** — toss a decoy coin to that spot (costs 50 points, pulls the nearest guard over to look)
- **M** — mute

## How it plays

- Four rooms: The Gilded Gallery, The Vault Floor, The Crown Room, The Rooftop Getaway. Each adds guards, cameras, and tighter patrols; the last two add laser beams that spike the alarm when crossed.
- The alarm meter fills while a guard or camera sees you and drains while you stay hidden. At 100% you are caught, lose a life, and restart at the door. Three lives per run.
- The exit only opens once the room's loot is taken. Coins (+100) and gold bars (+250) are optional score; finishing fast pays a time bonus. Every tool costs points, so each use is a trade against the final payout.

## Layout

- `game/` — the playable game, plain static files: `index.html`, `style.css`, `js/` (one file per job: `util`, `audio`, `input`, `levels`, `guard`, `camera`, `tools`, `render`, `hud`, `main`)
- `screenshots/` — renders of the game itself
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=bc76ffwb&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
