// Pure data — no imports, so it can be sanity-checked outside the browser.

export const SUN_DIR = [0.8, 0.35, 0.6];

export const BODIES = {
  earth:   { c: [0, 0, 0],        r: 5 },
  moon:    { c: [35, 6, -20],     r: 1.6 },
  mars:    { c: [-25, -4, -140],  r: 2.8 },
  jupiter: { c: [45, 0, -380],    r: 15 },
  saturn:  { c: [-40, 20, -570],  r: 11, ringIn: 14, ringOut: 26, tilt: [0.42, 0, 0.2] },
  bh:      { c: [40, -6, -820],  rs: 2.5 },
};

// One keyframe per chapter. Offsets verified so the Catmull-Rom flight path clears
// every planet (≥1.45× radius) and never crosses Saturn's ring annulus.
// `off` = camera offset from the body, `look` = look-target
// offset (a lateral look offset pushes the body to one side of the frame, leaving room for copy).
export const KEYFRAMES = [
  { body: 'earth',   off: [-3, 1.5, 15],  look: [-4.5, 0, 0] },
  { body: 'moon',    off: [-2.5, 0.8, 6.5], look: [2.5, 0, 0] },
  { body: 'mars',    off: [4, 2, 10],     look: [-2, 0, 0] },
  { pos: [5, 2, -230], lookAt: [18, -1, -300] },
  { body: 'jupiter', off: [-22, 6, 40],   look: [-15, 0, 0] },
  { body: 'saturn',  off: [22, 20, 48],   look: [18, 0, 0] },
  { body: 'bh',      off: [0, 8, 58],     look: [0, 0, 0] },
  { body: 'bh',      off: [0, 2.5, 24],   look: [0, 0, 0] },
];

// Distance from Earth per chapter, km (Sgr A* ≈ 26,000 ly).
export const DISTANCES_KM = [0, 384400, 2.25e8, 4.0e8, 6.28e8, 1.28e9, 2.46e17, 2.46e17];

export const ACCENTS = ['#6fc3ff', '#d4dbea', '#ff7a45', '#d9a066', '#f0b27a', '#f2d49b', '#ff9d3d', '#b89cff'];
