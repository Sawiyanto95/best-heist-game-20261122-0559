// The Velvet Vault — the four rooms of the heist.
// Each map is 15 rows of 24 cells:
//   '#' wall   'C' wooden crate   'D' glass display case   'V' velvet rope
//   '|' laser beam   '.' marble floor   'P' Rook's door   'L' the loot
//   'E' the exit   'g' a gold bar (bonus pickup)
// Crates and cases block movement and sight, so every room has several
// routes through. Ropes block feet but not eyes — you can be seen over one.

import { tileCenter } from './util.js';

export const LEVELS = [
  {
    name: 'I · The Gilded Gallery',
    lootName: 'the Velvet Diamond',
    hint: 'Slip past the patrols. The Velvet Diamond waits in its case.',
    smokes: 3,
    decoys: 2,
    cloaks: 1,
    map: [
      '########################',
      '#P..................L..#',
      '#......................#',
      '#..C......D......C.....#',
      '#......................#',
      '#......####.####.......#',
      '#......................#',
      '#..D.....g..........C..#',
      '#......................#',
      '#......####.####.......#',
      '#......................#',
      '#..C......D......C.....#',
      '#......................#',
      '#...................E..#',
      '########################',
    ],
    guards: [
      { path: [[2, 2], [21, 2]], speed: 58 },
      { path: [[21, 12], [2, 12]], speed: 68 },
    ],
    cameras: [
      { at: [6, 1], from: Math.PI * 0.35, to: Math.PI * 0.65, speed: 0.5 },
      { at: [18, 13], from: Math.PI * 1.35, to: Math.PI * 1.65, speed: 0.45 },
    ],
    coins: [[5, 6], [18, 6], [12, 10]],
  },
  {
    name: 'II · The Vault Floor',
    lootName: 'the Sunburst Ruby',
    hint: 'Three guards, ropes to hop around, and cameras on the long halls.',
    smokes: 3,
    decoys: 2,
    cloaks: 2,
    map: [
      '########################',
      '#P...#..........#...L..#',
      '#....#...C...D..#......#',
      '#....#..........#..C...#',
      '#.C..#...D......#......#',
      '#....####.####..#..D...#',
      '#..VV..................#',
      '#..D....C......C....C..#',
      '#..................VV..#',
      '#....####.####..#..D...#',
      '#.C..#......D...#..C...#',
      '#....#...C......#......#',
      '#....#..........#...E..#',
      '#......................#',
      '########################',
    ],
    guards: [
      { path: [[2, 6], [21, 6]], speed: 62 },
      { path: [[21, 8], [2, 8]], speed: 72 },
      { path: [[14, 1], [14, 13]], speed: 62 },
    ],
    cameras: [
      { at: [12, 1], from: Math.PI * 0.3, to: Math.PI * 0.7, speed: 0.55 },
      { at: [5, 13], from: Math.PI * 1.3, to: Math.PI * 1.7, speed: 0.5 },
    ],
    coins: [[10, 6], [14, 8], [21, 3]],
  },
  {
    name: 'III · The Crown Room',
    lootName: 'the Crown of Aurelia',
    hint: 'Laser beams guard the crown. Cross one and the alarm screams.',
    smokes: 4,
    decoys: 2,
    cloaks: 2,
    map: [
      '########################',
      '#P......C.......D...L..#',
      '#......................#',
      '#..D....####.####...C..#',
      '#......................#',
      '#..C....#.......#...D..#',
      '#......#...C...#.......#',
      '#..D....#...|...#...C..#',
      '#......#...|...#.......#',
      '#..C....#...|...#...D..#',
      '#......#...C...#.......#',
      '#..D....####.####...C..#',
      '#......................#',
      '#...................E..#',
      '########################',
    ],
    guards: [
      { path: [[2, 2], [21, 2]], speed: 66 },
      { path: [[21, 10], [2, 10]], speed: 76 },
      { path: [[21, 4], [2, 4]], speed: 72 },
      { path: [[12, 1], [12, 13]], speed: 66 },
    ],
    cameras: [
      { at: [6, 7], from: Math.PI * 0.25, to: Math.PI * 0.75, speed: 0.6 },
      { at: [18, 7], from: Math.PI * 1.25, to: Math.PI * 1.75, speed: 0.55 },
      { at: [21, 1], from: Math.PI * 0.55, to: Math.PI * 0.95, speed: 0.5 },
    ],
    coins: [[5, 6], [18, 8], [12, 4]],
  },
  {
    name: 'IV · Rooftop Getaway',
    lootName: 'the Getaway',
    hint: 'The alarm is already warm. Grab the case and run for the skylight!',
    smokes: 4,
    decoys: 3,
    cloaks: 2,
    startAlarm: 30,
    map: [
      '########################',
      '#P......C.......D...L..#',
      '#......................#',
      '#..D....####.####...C..#',
      '#..|...................#',
      '#..|....#.......#...D..#',
      '#......#...C...#.......#',
      '#..D....#...|...#...C..#',
      '#......#...|...#.......#',
      '#..C....#.......#...D..#',
      '#......................#',
      '#..D....####.####...C..#',
      '#......................#',
      '#...................E..#',
      '########################',
    ],
    guards: [
      { path: [[2, 2], [21, 2]], speed: 72 },
      { path: [[21, 12], [2, 12]], speed: 80 },
      { path: [[12, 1], [12, 13]], speed: 72 },
    ],
    cameras: [
      { at: [12, 1], from: Math.PI * 0.3, to: Math.PI * 0.7, speed: 0.65 },
      { at: [18, 13], from: Math.PI * 1.3, to: Math.PI * 1.7, speed: 0.6 },
    ],
    coins: [[5, 6], [18, 8], [12, 10]],
  },
];

// Pull the marked cells out of a map: player start, loot, exit, gold bars.
export function findMarks(map) {
  const marks = { start: null, loot: null, exit: null, gold: [] };
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const c = map[y][x];
      if (c === 'P') marks.start = tileCenter(x, y);
      if (c === 'L') marks.loot = tileCenter(x, y);
      if (c === 'E') marks.exit = tileCenter(x, y);
      if (c === 'g') marks.gold.push(tileCenter(x, y));
    }
  }
  return marks;
}
