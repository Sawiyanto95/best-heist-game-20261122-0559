// The Velvet Vault v2 — an art-deco museum heist in four rooms (Node 22,
// standard library only).
//
// This program hands the game in: it copies this repository's game/ and
// screenshots/ into /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library.
//
// /output is a mounted volume in the grader, so this program never removes
// the directory itself: it creates it, then clears only what is inside it.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/* Empty the output directory without removing the directory itself. */
function clearOutput(dir) {
  mkdirSync(dir, { recursive: true });
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

function copyTree(name) {
  const from = join(here, name);
  const to = join(out, name);
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

clearOutput(out);
copyTree('game');
copyTree('screenshots');

// The gate's own caps (from the kit's reference): the dossier text is capped
// at 160 KiB, at most 4 screenshots of 256 KiB each, game/ at most 993
// files and 48 MiB, every game path at most 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
