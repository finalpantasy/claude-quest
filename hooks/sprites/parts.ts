// Part families for monsters and bosses, in the shape language. Each family has several variants.
//   top: y 0 is the body's top row, negative is above.   side: x 0 is the body's edge on its middle row, negative is outward.
//   face: y 0 is the eye row.   bottom: y 0 is the body's last row.   back: absolute canvas, drawn behind the body.
export type At = 'top' | 'side' | 'face' | 'bottom' | 'back'
export type Family = { n: string; at: At; v: string[] }

export const FAMILIES: Family[] = [
  { n: 'horns', at: 'top', v: ['T5,1,6,-2,7,1,w', 'L5,1,3,-3,w;L3,-3,2,-5,w', 'L5,0,3,0,w;L3,0,2,-3,w', 'L6,0,5,-4,a;L5,-2,3,-3,a;L5,-4,4,-6,a'] },
  { n: 'crest', at: 'top', v: ['C-2,2,3,a', 'C-3,2,4,a;C-2,6,1,a', 'R4,-2,1,3,a;R6,-4,1,5,a', 'C-4,2,5,A;R5,-2,1,3,a'] },
  { n: 'crown', at: 'top', v: ['C-1,6,2,A;R5,-3,1,2,A;R7,-3,1,2,A', 'C-1,8,2,A;R4,-3,1,2,A;R6,-3,1,2,A;R7,-4,1,3,A', 'C-4,6,1,A', 'C-1,4,1,A;R6,-3,1,3,A;y7,-4,w'] },
  { n: 'antennae', at: 'top', v: ['L6,0,4,-4,d;Y4,-5,a', 'L7,0,7,-4,d;Y7,-5,a;L5,0,3,-3,d', 'L6,0,5,-3,d;e5,-4,1,1,a', 'L6,0,3,-5,d;Y3,-6,e'] },
  { n: 'ears', at: 'top', v: ['T3,1,2,-3,5,1', 'e4,-1,2,2', 'R4,-5,1,6', 'T2,0,4,-4,6,0;R3,-2,1,2,A'] },
  { n: 'hood', at: 'top', v: ['E-1,4,3,z', 'C-1,6,3,z;C-2,2,1,A', 'E-1,5,2,a;R7,-1,2,1,A', 'E0,5,4,d;C-2,2,2,k'] },
  { n: 'flame', at: 'top', v: ['T6,0,7,-4,8,0,r;T7,0,8,-3,8,0,A', 'T5,0,6,-3,7,0,r;T6,0,7,-5,8,0,r', 'E-2,3,2,r;E-3,1,2,A', 'T4,0,5,-3,6,0,r;T6,0,7,-4,8,0,A'] },
  { n: 'sprout', at: 'top', v: ['C-3,1,3,d;e6,-3,2,1,a', 'L8,0,8,-4,d;e5,-3,2,1,a', 'C-4,2,2,a;C-2,1,2,d', 'e5,-2,2,1,a;e5,-4,1,1,A;C-3,1,4,d'] },
  { n: 'tuft', at: 'top', v: ['C-2,2,2,d;R6,-1,1,1,d', 'R5,-2,1,2,d;R7,-3,1,3,d;R6,-1,1,1,d', 'C-3,4,1,d;C-2,2,1,d', 'e6,-2,2,1,d;e7,-3,1,1,d'] },
  { n: 'stalks', at: 'top', v: ['L6,0,5,-3,d;e5,-4,1,1,w;Y5,-4,e', 'L7,0,7,-3,d;e7,-4,1,1,w', 'L5,0,3,-2,d;e3,-3,1,2,w;L7,0,6,-4,d;e6,-5,1,1,w'] },
  { n: 'wings', at: 'side', v: ['T0,-2,-6,-5,0,3,d', 'T0,-1,-5,-5,0,3,w;L0,0,-5,-4,A', 'e-3,-1,3,3,A', 'L0,0,-5,-5,w;L0,0,-6,-1,w;L0,0,-5,3,w', 'T0,-3,-4,-7,0,1,a;T0,1,-5,3,0,4,z'] },
  { n: 'orbs', at: 'side', v: ['e-3,-2,1,1,A;e-3,2,1,1,A', 'e-4,0,2,2,A', 'e-3,-3,1,1,e;e-4,1,1,1,A;e-3,4,1,1,e'] },
  { n: 'claws', at: 'side', v: ['e-2,0,2,2,a', 'L0,0,-4,-3,a;L0,1,-4,1,a;L0,2,-4,4,a', 'L0,0,-3,2,a;L-3,2,-4,5,a', 'e-3,1,3,2,z;R-5,-1,1,1,w;R-5,2,1,1,w'] },
  { n: 'spikes', at: 'side', v: ['T0,-1,-3,-3,0,1,w', 'T0,-2,-2,-4,1,0,w;T0,0,-3,0,0,2,w', 'e-2,-1,2,2,A', 'T0,-3,-1,-5,1,-2,a;T0,0,-3,1,0,3,a'] },
  { n: 'fins', at: 'side', v: ['T0,-2,-3,0,0,3,A', 'T0,-4,-4,-1,0,2,a;T0,1,-4,4,0,4,a', 'e-2,0,2,3,A', 'L0,-3,-3,-5,A;L0,0,-4,0,A;L0,3,-3,5,A'] },
  { n: 'tongue', at: 'face', v: ['C3,2,2,r', 'C3,2,3,r;C6,4,1,r', 'C2,2,4,r'] },
  { n: 'eyes', at: 'face', v: ['C-2,2,1,e', 'Y4,-2;Y6,-2', 'C-1,4,3,w;C0,2,2,e;C1,2,1,k', 'C-3,2,1,e;C-2,2,1,e'] },
  { n: 'fangs', at: 'face', v: ['Y6,2,w', 'Y5,2,w;Y7,2,w', 'L5,2,4,5,w', 'Y4,3,w;Y7,2,w'] },
  { n: 'mask', at: 'face', v: ['C-1,8,3,w;Y5,0,k;Y5,1,k;Y6,0,e', 'C0,10,2,d;Y5,0', 'C-1,6,4,A;Y6,0,k', 'C-1,12,2,z;Y5,0,e'] },
  { n: 'beard', at: 'face', v: ['C3,4,3,d', 'C3,6,2,w;C5,4,2,w', 'L6,3,5,6,a;L8,3,8,7,a', 'C4,6,3,A'] },
  { n: 'snout', at: 'face', v: ['C1,2,2,A', 'C1,4,2,A;Y6,1,k', 'C1,2,5,d', 'C2,6,2,w;Y6,2,k'] },
  { n: 'wheels', at: 'bottom', v: ['e4,1,2,2,k;y4,0,w', 'e3,1,2,2,k;e6,1,2,2,k', 'e5,0,2,2,d'] },
  { n: 'trail', at: 'bottom', v: ['R6,1,1,2,r;R5,2,1,1,A', 'R4,1,1,2,A;R6,2,1,2,A', 'C1,4,1,A;C2,2,1,A'] },
  { n: 'legs', at: 'bottom', v: ['R4,0,2,2,d', 'R3,1,1,2,d;R6,1,1,2,d', 'R5,1,2,1,d', 'R3,0,1,3,z;R6,0,1,3,z'] },
  { n: 'tentacles', at: 'bottom', v: ['L5,0,3,3,a;L7,0,6,3,a', 'L4,0,2,2,a;L6,0,5,3,a;L7,0,8,3,a', 'L5,0,5,3,A;L7,0,9,2,A'] },
  { n: 'drips', at: 'bottom', v: ['R5,0,1,2,A;R7,1,1,1,A', 'R4,0,1,1,A;R6,0,1,3,A', 'R6,0,2,1,A;R5,1,1,2,A'] },
  { n: 'spines', at: 'back', v: ['T3,10,5,2,7,10,d;T5,9,8,1,8,9,d', 'L2,9,5,2,z;L3,10,6,3,z;L5,9,6,1,z', 'T2,12,4,4,7,10,a;T6,9,8,5,8,9,a'] },
  { n: 'shell', at: 'back', v: ['E8,7,6,d', 'E8,7,7,z', 'E9,6,6,a'] },
  { n: 'rays', at: 'back', v: ['T2,10,5,2,6,10,d', 'T1,8,5,0,6,8,z;T3,13,5,5,6,13,z', 'T2,11,4,3,7,9,a'] },
  { n: 'cape', at: 'back', v: ['T3,6,5,15,8,15,d', 'T2,5,3,15,8,15,z', 'T4,5,2,14,8,14,a'] },
]

/** Whole-body marks, drawn only where the body is. Each gets the column folded to the left half (x), the row, a seed and the body width, and returns a replacement letter or ''. */
export const MARKS: ((x: number, y: number, h: number, w: number) => string)[] = [
  (x, y) => (y % 3 === 0 ? 'd' : ''),
  x => (x % 4 === 1 ? 'd' : ''),
  (x, y, h) => ((x * 7 + y * 13 + h) % 17 === 0 ? 'd' : ''),
  (x, y) => ((x + y) % 4 === 0 ? 'd' : ''),
  (x, y) => (y % 2 === 0 && (x + (y % 4)) % 6 === 0 ? 'l' : ''),
  (x, y, _h, w) => ((x + y) % 2 === 0 && y > w / 2 ? 'd' : ''),
  (x, y, h) => ((x * 3 + y * 5 + h) % 23 === 0 ? 'k' : ''),
  (x, y) => (y % 4 === 0 ? 'd' : x % 5 === 0 && y % 2 ? 'w' : ''),
  (x, y) => (y % 3 === 1 && x % 2 === 0 ? 'e' : ''),
  (x, y) => ((x + 2 * y) % 7 < 2 ? 'w' : ''),
  (x, y, h) => (y < 8 && (x * 5 + y * 7 + h) % 9 === 0 ? 'a' : ''),
  (x, y, _h, w) => (y > w / 2 && w / 2 - x < 3 ? 'A' : ''),
  (x, y, _h, w) => ((x === w / 2 - 2 && y % 3 === 0) || (x === w / 2 - 3 && y % 3 === 1) ? 'e' : ''),
  (x, y, h) => ((x * 11 + y * 3 + h) % 29 === 0 ? 'w' : ''),
]
