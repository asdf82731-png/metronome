// One beat of a subdivision pattern drawn as music notation: heads, stems, beams (or flags), rests and tuplet numbers.
// Durations are fractions of the beat, as in music.js PATS.

const W = 64, LEFT = 10, SPAN = 44, HEAD_Y = 31, STEM_TOP = 9, BEAM_H = 3.2, BEAM_GAP = 5;

// beams a note gets from its duration: 8th / triplet 8th = 1, 16th / sextuplet = 2, dotted 8th = 1 + dot
function beamsOf(d) {
  if (Math.abs(d - 1) < 0.01) return 0;
  if (Math.abs(d - 0.75) < 0.01) return 1;
  if (d >= 1 / 3 - 0.01) return 1;
  return 2;
}

// heads shrink for six notes so they do not touch
let HEAD = 1;
const Head = ({x}) => <ellipse cx={x} cy={HEAD_Y} rx={4.4 * HEAD} ry={3.3 * HEAD} transform={`rotate(-20 ${x} ${HEAD_Y})`} />;
const stemX = x => x + 3.7 * HEAD;

function Flag({x, level}) {
  const sx = stemX(x), y = STEM_TOP + level * BEAM_GAP;
  return <path d={`M${sx} ${y} c 1 4 7 5 6 12 c -1 -4 -3 -6 -6 -7 z`} />;
}

// eighth rest: a dot with a slanted tail; a sixteenth rest adds a second dot
function Rest({x, beams}) {
  return (
    <g>
      <circle cx={x - 1.5} cy={20} r="2" />
      <path d={`M${x - 1.5} 21.5 Q ${x + 1.5} 22 ${x + 3} 18.5 L ${x - 0.5} 33`} fill="none" strokeWidth="1.4" />
      {beams > 1 && <circle cx={x - 2.8} cy={26} r="2" />}
    </g>
  );
}

export default function Notation({steps, label}) {
  HEAD = steps.length >= 6 ? 0.7 : 1;
  const total = steps.reduce((a, s) => a + s[0], 0);
  let t = 0;
  const notes = steps.map(([d, on]) => {
    const n = {x: steps.length === 1 ? W / 2 - 2 : LEFT + (t / total) * SPAN, d, on: !!on, beams: beamsOf(d)};
    t += d;
    return n;
  });
  const sounding = notes.filter(n => n.on);
  // beam runs of consecutive sounding notes that need beams; a lone note gets flags instead
  const runs = [];
  let run = [];
  notes.forEach(n => {
    if (n.on && n.beams > 0) run.push(n);
    else { if (run.length) runs.push(run); run = []; }
  });
  if (run.length) runs.push(run);
  const tuplet = steps.length === 3 && notes.every(n => Math.abs(n.d - 1 / 3) < 0.01) ? 3
    : steps.length === 6 ? 6 : 0;

  const parts = [];
  notes.forEach((n, i) => {
    if (!n.on) { parts.push(<Rest key={'r' + i} x={n.x + (notes[i - 1]?.on ? 2 : 0)} beams={n.beams} />); return; }
    parts.push(<Head key={'h' + i} x={n.x} />);
    parts.push(<line key={'s' + i} x1={stemX(n.x)} y1={HEAD_Y - 1} x2={stemX(n.x)} y2={STEM_TOP} strokeWidth="1.3" />);
    if (Math.abs(n.d - 0.75) < 0.01) parts.push(<circle key={'d' + i} cx={n.x + 8} cy={HEAD_Y} r="1.5" />);
  });
  runs.forEach((r, ri) => {
    if (r.length === 1) {
      for (let l = 0; l < r[0].beams; l++) parts.push(<Flag key={`f${ri}-${l}`} x={r[0].x} level={l} />);
      return;
    }
    const x0 = stemX(r[0].x), x1 = stemX(r[r.length - 1].x);
    parts.push(<rect key={'b' + ri} x={x0 - 0.65} y={STEM_TOP} width={x1 - x0 + 1.3} height={BEAM_H} />);
    // second beam: between neighbouring 16ths, or a short stub on a 16th next to an 8th
    r.forEach((n, k) => {
      if (n.beams < 2) return;
      const prev = r[k - 1], next = r[k + 1], y = STEM_TOP + BEAM_GAP;
      if (next && next.beams >= 2) parts.push(<rect key={`b2${ri}-${k}`} x={stemX(n.x) - 0.65} y={y} width={stemX(next.x) - stemX(n.x) + 1.3} height={BEAM_H} />);
      else if (!(prev && prev.beams >= 2)) {
        const toLeft = !next, sx = stemX(n.x);
        parts.push(<rect key={`b2${ri}-${k}`} x={toLeft ? sx - 6 : sx - 0.65} y={y} width={6.65} height={BEAM_H} />);
      }
    });
  });
  if (tuplet) {
    const cx = sounding.length ? (stemX(notes[0].x) + stemX(notes[notes.length - 1].x)) / 2 : W / 2;
    parts.push(<text key="tu" x={cx} y={6} textAnchor="middle" fontSize="7.5" fontWeight="700" stroke="none">{tuplet}</text>);
  }

  return (
    <svg className="notation" viewBox={`0 0 ${W} 38`} role="img" aria-label={label} fill="currentColor" stroke="currentColor" strokeWidth="0">
      {parts}
    </svg>
  );
}
