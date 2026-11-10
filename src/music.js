// Rhythm data shared by the UI and the audio engine.

export const TERMS = [
  [40, 'Grave', '極緩板'], [60, 'Largo', '廣板'], [66, 'Larghetto', '小廣板'], [76, 'Adagio', '柔板'],
  [108, 'Andante', '行板'], [120, 'Moderato', '中板'], [156, 'Allegro', '快板'], [176, 'Vivace', '活潑的快板'],
  [200, 'Presto', '急板'], [Infinity, 'Prestissimo', '最急板'],
];

const T3 = 1 / 3;
// each step: [fraction of beat, sounds?]
export const PATS = [
  {k: 'q', n: '四分', s: [[1, 1]]},
  {k: 'e', n: '八分', s: [[0.5, 1], [0.5, 1]]},
  {k: 'eo', n: '反拍八分', s: [[0.5, 0], [0.5, 1]]},
  {k: 't', n: '三連音', s: [[T3, 1], [T3, 1], [T3, 1]]},
  {k: 't1', n: '三連 首休', s: [[T3, 0], [T3, 1], [T3, 1]]},
  {k: 'sw', n: 'Shuffle', s: [[T3, 1], [T3, 0], [T3, 1]]},
  {k: 't3', n: '三連 尾休', s: [[T3, 1], [T3, 1], [T3, 0]]},
  {k: 's', n: '十六分', s: [[0.25, 1], [0.25, 1], [0.25, 1], [0.25, 1]]},
  {k: 'es', n: '八＋兩十六', s: [[0.5, 1], [0.25, 1], [0.25, 1]]},
  {k: 'se', n: '兩十六＋八', s: [[0.25, 1], [0.25, 1], [0.5, 1]]},
  {k: 'ds', n: '附點八＋十六', s: [[0.75, 1], [0.25, 1]]},
  {k: 'x', n: '六連音', s: [[1 / 6, 1], [1 / 6, 1], [1 / 6, 1], [1 / 6, 1], [1 / 6, 1], [1 / 6, 1]]},
];
export const patOf = k => PATS.find(p => p.k === k) || PATS[0];

// every kit is a square (or sine) wave through a 3.5 kHz low-pass, held at full level for HOLD, pitched
// above ~1 kHz: phone speakers barely play below that, so a 660 Hz triangle sounds much quieter than the
// Linear Grooves / Double Pedal click (1250→875 Hz square) at the same digital level
export const KITS = {
  click: {n: 'Click', w: 'square', f: {3: 2000, s: 1250, p: 2600}, d: 0.04, v: 1},
  wood: {n: '木魚', w: 'square', f: {3: 1870, s: 1250, p: 1700}, d: 0.065, v: 1},
  beep: {n: 'Beep', w: 'sine', f: {3: 2640, s: 1760, p: 2350}, d: 0.09, v: 1},
  cow: {n: '牛鈴', w: 'square', f: {3: 1080, s: 800, p: 1440}, d: 0.12, v: 1},
  voice: {n: '人聲 1e&a', voice: true},
};
export const KIT_ORDER = ['click', 'wood', 'beep', 'cow', 'voice'];

export const PRESETS = [[2, 4], [3, 4], [4, 4], [5, 4], [6, 8], [7, 8], [9, 8], [12, 8]];
export const DENS = [2, 4, 8, 16];

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const termOf = bpm => TERMS.find(x => bpm < x[0]);

// 3 重音 (different timbre), 2 一般 (same sound as the subdivisions), 0 靜音
export function defaultAccents(b, d) {
  const a = Array(b).fill(2);
  a[0] = 3;
  if (d === 8 && b % 3 === 0 && b > 3) for (let i = 3; i < b; i += 3) a[i] = 3;
  else if (b === 5) a[3] = 3;
  else if (b === 7) { a[2] = 3; a[4] = 3; }
  return a;
}
export const nextAccent = l => ({3: 2, 2: 0, 0: 3})[l] ?? 2;
