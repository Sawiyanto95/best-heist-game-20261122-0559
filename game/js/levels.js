'use strict';
/* The Velvet Vault — the three rooms.
   Each map is 15 rows of 24 cells: '#' wall, 'C' crate, 'D' display case,
   'P' where Rook starts, 'L' the loot, 'E' the exit door.
   Crates and cases are cover: they block movement and sight, so every room
   has several ways through. Guards walk straight patrol lines on open rows
   and columns; cameras sweep fixed arcs from the ceiling. */


Heist.LEVELS = [
  {
    name: 'The Gallery',
    hint: 'Slip past the patrols. The Velvet Diamond waits in its case.',
    smokes: 3,
    decoys: 2,
    map: [
      '########################',
      '#P..................L..#',
      '#......................#',
      '#..C......D......C.....#',
      '#......................#',
      '#......####.####.......#',
      '#......................#',
      '#..D................C..#',
      '#......................#',
      '#......####.####.......#',
      '#......................#',
      '#..C......D......C.....#',
      '#......................#',
      '#...................E..#',
      '########################',
    ],
    guards: [
      { path: [[2, 2], [21, 2]], speed: 55 },
      { path: [[21, 12], [2, 12]], speed: 65 },
    ],
    cameras: [
      { at: [6, 1], from: Math.PI * 0.35, to: Math.PI * 0.65, speed: 0.5 },
      { at: [18, 13], from: Math.PI * 1.35, to: Math.PI * 1.65, speed: 0.45 },
    ],
    coins: [[5, 6], [18, 6], [12, 10]],
  },
  {
    name: 'The Vault Floor',
    hint: 'Three guards now, and the cameras watch the long halls.',
    smokes: 3,
    decoys: 2,
    map: [
      '########################',
      '#P...#..........#...L..#',
      '#....#...C...D..#......#',
      '#....#..........#..C...#',
      '#.C..#...D......#......#',
      '#....####.####..#..D...#',
      '#......................#',
      '#..D....C......C....C..#',
      '#......................#',
      '#....####.####..#..D...#',
      '#.C..#......D...#..C...#',
      '#....#...C......#......#',
      '#....#..........#...E..#',
      '#......................#',
      '########################',
    ],
    guards: [
      { path: [[2, 6], [21, 6]], speed: 60 },
      { path: [[21, 8], [2, 8]], speed: 70 },
      { path: [[14, 1], [14, 13]], speed: 60 },
    ],
    cameras: [
      { at: [12, 1], from: Math.PI * 0.3, to: Math.PI * 0.7, speed: 0.55 },
      { at: [5, 13], from: Math.PI * 1.3, to: Math.PI * 1.7, speed: 0.5 },
    ],
    coins: [[10, 6], [14, 8], [21, 3]],
  },
  {
    name: 'The Crown Room',
    hint: 'Four guards, three cameras, one crown jewel. No mistakes left.',
    smokes: 4,
    decoys: 2,
    map: [
      '########################',
      '#P......C.......D...L..#',
      '#......................#',
      '#..D....####.####...C..#',
      '#......................#',
      '#..C....#.......#...D..#',
      '#......#...C...#.......#',
      '#..D....#.......#...C..#',
      '#......#...D...#.......#',
      '#..C....#.......#...D..#',
      '#......................#',
      '#..D....####.####...C..#',
      '#......................#',
      '#...................E..#',
      '########################',
    ],
    guards: [
      { path: [[2, 2], [21, 2]], speed: 65 },
      { path: [[21, 10], [2, 10]], speed: 75 },
      { path: [[21, 4], [2, 4]], speed: 70 },
      { path: [[12, 1], [12, 13]], speed: 65 },
    ],
    cameras: [
      { at: [6, 7], from: Math.PI * 0.25, to: Math.PI * 0.75, speed: 0.6 },
      { at: [18, 7], from: Math.PI * 1.25, to: Math.PI * 1.75, speed: 0.55 },
      { at: [21, 1], from: Math.PI * 0.55, to: Math.PI * 0.95, speed: 0.5 },
    ],
    coins: [[5, 6], [18, 8], [12, 4]],
  },
];

/* Pull the marked cells out of a map: player start, loot, exit. */
Heist.findMarks = function (map) {
  const marks = { start: null, loot: null, exit: null };
  for (let y = 0; y < Heist.ROWS; y++) {
    for (let x = 0; x < Heist.COLS; x++) {
      const c = map[y][x];
      if (c === 'P') marks.start = Heist.tileCenter(x, y);
      if (c === 'L') marks.loot = Heist.tileCenter(x, y);
      if (c === 'E') marks.exit = Heist.tileCenter(x, y);
    }
  }
  return marks;
};
