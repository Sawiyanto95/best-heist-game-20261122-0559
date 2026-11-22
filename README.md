# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Sawiyanto95/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Sawiyanto95/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Velvet Vault** — a midnight heist game in three rooms. You are Rook, the thief: lift the Velvet Diamond from each gallery, then slip out the exit unseen. Guards patrol with vision cones, cameras sweep the halls, and every second you are seen, the alarm climbs. Hide behind crates and display cases, spend smoke bombs and decoy coins, and get out rich.

## Run it

Serve the `game/` folder with any static server, then open it in a desktop browser:

```sh
python3 -m http.server -d game
```

Then open http://localhost:8000 — no network request, no build step.

## Controls

- **WASD / arrow keys** — move Rook
- **E** — drop a smoke bomb (costs 100 points, blinds guards and cameras)
- **Click** — toss a decoy coin to that spot (costs 50 points, pulls the nearest guard over to look)
- **M** — mute

## How it plays

- Three rooms: The Gallery, The Vault Floor, The Crown Room. Each adds guards, cameras, and tighter patrols.
- The alarm meter fills while a guard or camera sees you and drains while you stay hidden. At 100% you are caught, lose a life, and restart at the door.
- The exit only opens once the diamond is taken. Coins are optional score; finishing fast pays a time bonus.

## Layout

- `game/` — the playable game, plain static files: `index.html`, `style.css`, `js/` (one file per job: `util`, `levels`, `guard`, `camera`, `audio`, `input`, `render`, `main`)
- `screenshots/` — renders of the game itself
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=bc76ffwb&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
