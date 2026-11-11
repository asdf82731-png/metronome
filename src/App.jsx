import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {Button} from '@astryxdesign/core/Button';
import {ToggleButton, ToggleButtonGroup} from '@astryxdesign/core/ToggleButton';
import {Card} from '@astryxdesign/core/Card';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Grid} from '@astryxdesign/core/Grid';
import {Divider} from '@astryxdesign/core/Divider';
import {List, ListItem} from '@astryxdesign/core/List';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Slider} from '@astryxdesign/core/Slider';
import {Switch} from '@astryxdesign/core/Switch';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {TextInput} from '@astryxdesign/core/TextInput';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {createEngine} from './engine.js';
import Notation from './Notation.jsx';
import {
  DENS, KITS, KIT_ORDER, PATS, PRESETS, clamp, defaultAccents, nextAccent, patOf, termOf,
} from './music.js';

const DEFAULTS = {
  bpm: 120, beats: 4, den: 4, pat: 'q', kit: 'wood', vol: 80, accents: [3, 2, 2, 2],
  trainer: false, tStart: 80, tTarget: 120, tBars: 4, tStep: 2,
  poly: false, polyN: 3, gap: false, gPlay: 2, gMute: 2,
};
const OLDSUB = {1: 'q', 2: 'e', 3: 't', 4: 's', sw: 'sw'};

// Settings saved by every earlier version keep working: old subdivision keys and the removed 「弱」 level.
function normalize(o) {
  const s = {...DEFAULTS, ...o};
  if (o && o.sub && !o.pat) s.pat = OLDSUB[o.sub] || 'q';
  delete s.sub;
  if (!PATS.some(p => p.k === s.pat)) s.pat = 'q';
  if (!KITS[s.kit]) s.kit = 'wood';
  if (!Array.isArray(s.accents) || s.accents.length !== s.beats) s.accents = defaultAccents(s.beats, s.den);
  s.accents = s.accents.map(l => (l === 1 ? 2 : l));
  return s;
}
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function store(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }
const LIM = {tStart: [20, 300], tTarget: [20, 300], tBars: [1, 64], tStep: [1, 40], gPlay: [1, 32], gMute: [1, 32]};

export default function App() {
  return (
    <Theme theme={neutralTheme} mode="system">
      <Metronome />
    </Theme>
  );
}

function Metronome() {
  const [S, setS] = useState(() => normalize(load('proMetronome', {})));
  const [saved, setSaved] = useState(() => load('proMetronomeSets', []));
  const [running, setRunning] = useState(false);
  const [hit, setHit] = useState({bi: -1, sub: -1, mute: false, poly: -1});
  const sRef = useRef(S);
  sRef.current = S;
  const lastBeat = useRef({t: 0, dur: 0.5, n: 0});
  const needle = useRef(null);

  useEffect(() => store('proMetronome', S), [S]);
  useEffect(() => store('proMetronomeSets', saved), [saved]);

  const update = useCallback(patch => setS(s => ({...s, ...(typeof patch === 'function' ? patch(s) : patch)})), []);
  const setBpm = useCallback(v => update({bpm: clamp(Math.round(v), 20, 300)}), [update]);

  const engine = useMemo(() => createEngine({
    getSettings: () => sRef.current,
    onBeat: q => {
      if (q.beat) lastBeat.current = {t: performance.now(), dur: q.dur, n: lastBeat.current.n + 1};
      setHit(h => ({...h, bi: q.bi, sub: q.sub, mute: q.mute}));
    },
    onPoly: j => setHit(h => ({...h, poly: j})),
    onBpm: v => setS(s => ({...s, bpm: v})),
    onStop: () => { setRunning(false); setHit({bi: -1, sub: -1, mute: false, poly: -1}); },
  }), []);
  useEffect(() => engine.setBpm(S.bpm), [engine, S.bpm]);
  useEffect(() => engine.setVolume(), [engine, S.vol]);

  const toggle = useCallback(() => {
    if (engine.isRunning()) engine.stop();
    else { engine.start(); setRunning(true); }
  }, [engine]);

  // pendulum: one swing per beat, eased with a cosine, drawn straight to the DOM every frame
  useEffect(() => {
    if (!running) return;
    let raf;
    const tick = () => {
      const b = lastBeat.current, ph = clamp((performance.now() - b.t) / 1000 / b.dur, 0, 1);
      if (needle.current) needle.current.style.transform = `rotate(${(26 * Math.cos(Math.PI * (b.n + ph))).toFixed(2)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const taps = useRef([]);
  const tap = useCallback(() => {
    const t = performance.now(), a = taps.current;
    if (a.length && t - a[a.length - 1] > 2000) a.length = 0;
    a.push(t);
    if (a.length > 6) a.shift();
    if (a.length > 1) setBpm(60000 / ((a[a.length - 1] - a[0]) / (a.length - 1)));
  }, [setBpm]);

  useEffect(() => {
    const onKey = e => {
      const tg = e.target;
      if ((tg.tagName === 'INPUT' && tg.type !== 'range') || tg.tagName === 'TEXTAREA' || tg.isContentEditable) return;
      const d = {ArrowUp: 1, ArrowDown: -1, ArrowRight: 5, ArrowLeft: -5}[e.key];
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.key === 't' || e.key === 'T') tap();
      else if (d) { e.preventDefault(); setBpm(sRef.current.bpm + d); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toggle, tap, setBpm]);

  const setSig = (beats, den) => update({beats, den, accents: defaultAccents(beats, den)});
  const pat = patOf(S.pat);
  const [term, termZh] = termOf(S.bpm).slice(1);

  return (
    <div className="wrap">
      <VStack gap={4} className="stage">
        <header className="top">
          <Heading level={1} type="display-3">Pro Metronome</Heading>
          <span className="meta">
            <Text type="supporting" hasTabularNumbers>{S.beats}/{S.den}</Text>
            <Notation steps={pat.s} label={pat.n} />
            {S.poly && <Text type="supporting" hasTabularNumbers>{S.polyN}:{S.beats}</Text>}
          </span>
        </header>

        <Panel className="tempo-panel" label="速度">
          <Pendulum needle={needle} />
          <div className="tempo">
            <div className="nudge">
              <Button label="−5" onClick={() => setBpm(S.bpm - 5)} />
              <Button label="−1" onClick={() => setBpm(S.bpm - 1)} />
            </div>
            <BpmInput bpm={S.bpm} onCommit={setBpm} />
            <div className="nudge">
              <Button label="+5" onClick={() => setBpm(S.bpm + 5)} />
              <Button label="+1" onClick={() => setBpm(S.bpm + 1)} />
            </div>
          </div>
          <div className="marking"><Text type="large" weight="semibold">{term}</Text> <Text type="supporting">{termZh}</Text></div>
          <Slider label="速度" isLabelHidden valueDisplay="none" min={20} max={300} value={S.bpm} onChange={setBpm} />
        </Panel>

        <Panel className={'beatwrap' + (hit.mute ? ' muted' : '')} label="拍子強弱">
          <div className="beats" style={{gap: S.beats > 9 ? 3 : 6}}>
            {S.accents.map((l, i) => (
              <button key={i} type="button" className={'beat' + (hit.bi === i ? ' on' : '')} data-l={l}
                aria-label={`第 ${i + 1} 拍，${{3: '重音', 2: '一般', 0: '靜音'}[l]}`}
                onClick={() => update(s => ({accents: s.accents.map((x, j) => (j === i ? nextAccent(x) : x))}))}>
                <span className="bar" />
                <span className="pips">
                  {pat.s.map((x, k) => <i key={k} className={'pip' + (x[1] ? '' : ' rest') + (hit.bi === i && hit.sub === k ? ' on' : '')} />)}
                </span>
                <span className="num">{i + 1}</span>
              </button>
            ))}
          </div>
          {S.poly && (
            <div className="polyrow">
              {Array.from({length: S.polyN}, (_, j) => (
                <i key={j} className={hit.poly === j ? 'on' : ''} style={{left: `calc(${(j / S.polyN) * 100}% + 5px)`}} />
              ))}
            </div>
          )}
        </Panel>

        <div className="transport">
          <Button variant="primary" size="lg" width="100%" label={running ? '停止' : '開始'} onClick={toggle} />
          <Button size="lg" width="100%" label="TAP" onClick={tap} />
        </div>
      </VStack>

      <VStack gap={4} className="side">
        <Panel>
          <Row label="拍號">
            <HStack gap={3} vAlign="center" wrap="wrap">
              <Stepper value={S.beats} label="拍數" min={1} max={16} onChange={b => setSig(b, S.den)} />
              <Text color="secondary">/</Text>
              <SegmentedControl label="拍號分母" size="sm" value={String(S.den)} onChange={d => setSig(S.beats, Number(d))}>
                {DENS.map(d => <SegmentedControlItem key={d} value={String(d)} label={String(d)} />)}
              </SegmentedControl>
            </HStack>
            <ToggleButtonGroup type="single" label="常用拍號" size="sm" className="chips"
              value={PRESETS.some(([b, d]) => S.beats === b && S.den === d) ? `${S.beats}/${S.den}` : ''}
              onChange={v => { if (v) { const [b, d] = v.split('/').map(Number); setSig(b, d); } }}>
              {PRESETS.map(([b, d]) => <ToggleButton key={b + '/' + d} value={`${b}/${d}`} label={`${b}/${d}`} />)}
            </ToggleButtonGroup>
          </Row>
          <Divider />
          <Row label="細分節奏">
            <ToggleButtonGroup type="single" label="細分節奏" className="pats" value={S.pat} onChange={v => v && update({pat: v})}>
              {PATS.map(p => <ToggleButton key={p.k} value={p.k} label={p.n} tooltip={p.n}><Notation steps={p.s} label={p.n} /></ToggleButton>)}
            </ToggleButtonGroup>
          </Row>
          <Divider />
          <Row label="音色">
            <ToggleButtonGroup type="single" label="音色" size="sm" className="chips" value={S.kit}
              onChange={k => { if (!k) return; sRef.current = {...sRef.current, kit: k}; update({kit: k}); engine.preview(); }}>
              {KIT_ORDER.map(k => <ToggleButton key={k} value={k} label={KITS[k].n} />)}
            </ToggleButtonGroup>
          </Row>
          <Divider />
          <Row>
            <Slider label="音量" valueDisplay="text" formatValue={v => v + '%'} min={0} max={100} value={S.vol}
              onChange={v => { sRef.current = {...sRef.current, vol: v}; update({vol: v}); }} />
          </Row>
        </Panel>

        <Panel>
          <Switch label="複節奏 Polyrhythm" description="在每小節內平均疊上另一組拍點" labelPosition="start" labelSpacing="spread"
            width="100%" value={S.poly} onChange={v => update({poly: v})} />
          {S.poly && (
            <HStack gap={4} vAlign="center" wrap="wrap">
              <Stepper value={S.polyN} label="複節奏點數" min={2} max={16} onChange={n => update({polyN: n})} />
              <b className="ratio-out">{S.polyN} : {S.beats}</b>
            </HStack>
          )}
        </Panel>

        <Panel>
          <Switch label="速度訓練" description="每隔幾小節自動加速，直到目標速度" labelPosition="start" labelSpacing="spread"
            width="100%" value={S.trainer} onChange={v => update({trainer: v})} />
          {S.trainer && (
            <VStack gap={3}>
              <Grid columns={{minWidth: 110, max: 4}} gap={2}>
                <Num k="tStart" label="起始 BPM" S={S} update={update} />
                <Num k="tTarget" label="目標 BPM" S={S} update={update} />
                <Num k="tBars" label="每幾小節" S={S} update={update} />
                <Num k="tStep" label="每次加" S={S} update={update} />
              </Grid>
              <ProgressBar label="目前速度" isLabelHidden max={100}
                value={S.tTarget > S.tStart ? clamp((S.bpm - S.tStart) / (S.tTarget - S.tStart), 0, 1) * 100 : 0} />
            </VStack>
          )}
        </Panel>

        <Panel>
          <Switch label="靜音訓練" description="響幾小節、靜幾小節，檢查自己的內在節奏" labelPosition="start" labelSpacing="spread"
            width="100%" value={S.gap} onChange={v => update({gap: v})} />
          {S.gap && (
            <Grid columns={2} gap={2}>
              <Num k="gPlay" label="發聲小節" S={S} update={update} />
              <Num k="gMute" label="靜音小節" S={S} update={update} />
            </Grid>
          )}
        </Panel>

        <SavedSets S={S} saved={saved} setSaved={setSaved}
          onLoad={p => setS(s => normalize({...p.s, vol: s.vol}))} onBpm={setBpm} />
      </VStack>
    </div>
  );
}

// A settings card: an Astryx Card whose contents stack with Astryx spacing.
function Panel({children, className = '', label}) {
  return (
    <section aria-label={label} className={('panel-wrap ' + className).trim()}>
      <Card className="panel"><VStack gap={3} className="panel-body">{children}</VStack></Card>
    </section>
  );
}

// One setting inside a card: its label above the control.
function Row({label, children}) {
  return <VStack gap={2}>{label && <Text type="label">{label}</Text>}{children}</VStack>;
}

function Pendulum({needle}) {
  const ticks = [];
  for (let a = -30; a <= 30; a += 5) {
    const r = (a * Math.PI) / 180, len = a % 15 === 0 ? 12 : 6;
    ticks.push(
      <line key={a} x1={150 + Math.sin(r) * 100} y1={120 - Math.cos(r) * 100}
        x2={150 + Math.sin(r) * (100 + len)} y2={120 - Math.cos(r) * (100 + len)} strokeWidth={a % 15 === 0 ? 2 : 1} />,
    );
  }
  return (
    <div className="pend" aria-hidden="true">
      <svg viewBox="0 0 300 120" preserveAspectRatio="xMidYMax meet">{ticks}</svg>
      <div className="needle" ref={needle} />
      <div className="pivot" />
    </div>
  );
}

// The big tempo number: tap it to type a tempo; Enter or tapping elsewhere applies it, Esc cancels.
function BpmInput({bpm, onCommit}) {
  const [draft, setDraft] = useState(null);
  const fresh = useRef(false);
  return (
    <div className="bpm">
      <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} enterKeyHint="done" autoComplete="off"
        aria-label="速度 BPM，點一下可以直接輸入數字" value={draft ?? String(bpm)}
        onFocus={e => { fresh.current = true; setDraft(String(bpm)); e.target.select(); }}
        onClick={e => { if (fresh.current) { fresh.current = false; e.target.select(); } }}
        onChange={e => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur();
          else if (e.key === 'Escape') { setDraft(String(bpm)); setTimeout(() => e.target.blur()); }
        }}
        onBlur={() => { fresh.current = false; const v = parseInt(draft, 10); if (v) onCommit(v); setDraft(null); }} />
      <Text type="supporting" size="2xs">BPM</Text>
    </div>
  );
}

function Stepper({value, label, min, max, onChange}) {
  return (
    <div className="step" role="group" aria-label={label}>
      <Button size="sm" variant="ghost" label="−" isDisabled={value <= min} onClick={() => onChange(value - 1)} />
      <output aria-live="polite">{value}</output>
      <Button size="sm" variant="ghost" label="+" isDisabled={value >= max} onClick={() => onChange(value + 1)} />
    </div>
  );
}

function Num({k, label, S, update}) {
  const [lo, hi] = LIM[k];
  return (
    <NumberInput label={label} size="sm" isIntegerOnly min={lo} max={hi} value={S[k]}
      onChange={v => update({[k]: clamp(Math.round(v) || lo, lo, hi)})} />
  );
}

/* 我的設定: save the current setup under a name, then load, rename, change BPM, overwrite, reorder or delete it */
function SavedSets({S, saved, setSaved, onLoad, onBpm}) {
  const [name, setName] = useState('');
  const [editIdx, setEditIdx] = useState(-1);
  const [curIdx, setCurIdx] = useState(-1);
  const [confirmDel, setConfirmDel] = useState(-1);
  const snapshot = () => { const s = JSON.parse(JSON.stringify(S)); delete s.vol; return s; };

  const save = () => {
    const n = name.trim() || `設定 ${saved.length + 1}`;
    const ex = saved.findIndex(p => p.name === n);
    setSaved(ex >= 0 ? saved.map((p, i) => (i === ex ? {...p, s: snapshot()} : p)) : [...saved, {name: n, s: snapshot()}]);
    setCurIdx(ex >= 0 ? ex : saved.length);
    setName('');
  };
  const patchAt = (i, f) => setSaved(saved.map((p, j) => (j === i ? f(p) : p)));
  const move = (i, d) => {
    const j = i + d, a = [...saved];
    [a[i], a[j]] = [a[j], a[i]];
    setSaved(a);
    if (curIdx === i) setCurIdx(j); else if (curIdx === j) setCurIdx(i);
    setEditIdx(j);
  };
  const remove = i => {
    setSaved(saved.filter((_, j) => j !== i));
    if (curIdx === i) setCurIdx(-1); else if (curIdx > i) setCurIdx(curIdx - 1);
    setEditIdx(-1);
    setConfirmDel(-1);
  };

  return (
    <Panel>
      <Heading level={3}>我的設定</Heading>
      <Text type="supporting" as="p">儲存速度、拍號、重音、細分等組合，一鍵切換。按「調整」可以改名、改速度、更新或調整順序</Text>
      <form className="saverow" onSubmit={e => { e.preventDefault(); save(); }}>
        <TextInput label="設定名稱" isLabelHidden placeholder="例如：Blues shuffle 練習" value={name}
          onChange={v => setName(v.slice(0, 24))} />
        <Button type="submit" label="儲存" />
      </form>
      {!saved.length && <Text type="supporting" as="p">還沒有儲存的設定。調好之後輸入名稱按「儲存」。</Text>}
      {!!saved.length && <List hasDividers edge="flush">
        {saved.map((p, i) => (
          <ListItem key={p.name + i} itemKey={p.name + i} isSelected={i === curIdx} onClick={() => { onLoad(p); setCurIdx(i); }}
            label={p.name}
            description={<span className="meta">
              <Text type="supporting" hasTabularNumbers>{p.s.bpm} BPM · {p.s.beats}/{p.s.den}</Text>
              <Notation steps={patOf(p.s.pat).s} label={patOf(p.s.pat).n} />
            </span>}
            endContent={<Button size="sm" variant={i === editIdx ? 'primary' : 'ghost'} label={i === editIdx ? '完成' : '調整'}
              onClick={() => setEditIdx(i === editIdx ? -1 : i)} />} />
        ))}
      </List>}
      {saved.map((p, i) => i === editIdx && (
              <VStack key={'edit' + i} gap={2} className="pedit" as="section" aria-label={`調整「${p.name}」`}>
                <Text type="label">調整「{p.name}」</Text>
                <div className="erow">
                  <SetName p={p} taken={v => saved.some((q, j) => j !== i && q.name === v)} onRename={v => patchAt(i, q => ({...q, name: v}))} />
                  <NumberInput label="BPM" size="sm" isIntegerOnly min={20} max={300} value={p.s.bpm}
                    onChange={v => {
                      const b = clamp(Math.round(v) || 20, 20, 300);
                      patchAt(i, q => ({...q, s: {...q.s, bpm: b}}));
                      if (i === curIdx) onBpm(b);
                    }} />
                </div>
                <HStack gap={1.5} wrap="wrap">
                  <Button size="sm" label="用目前設定更新" onClick={() => { patchAt(i, q => ({...q, s: snapshot()})); setCurIdx(i); }} />
                  <Button size="sm" label="↑" tooltip="往上移" isDisabled={i === 0} onClick={() => move(i, -1)} />
                  <Button size="sm" label="↓" tooltip="往下移" isDisabled={i === saved.length - 1} onClick={() => move(i, 1)} />
                  <Button size="sm" variant="destructive" label="刪除" onClick={() => setConfirmDel(i)} />
                </HStack>
              </VStack>
      ))}
      <AlertDialog isOpen={confirmDel >= 0} onOpenChange={o => { if (!o) setConfirmDel(-1); }}
        title={`刪除「${saved[confirmDel]?.name ?? ''}」？`} description="刪除後沒辦法復原。"
        actionLabel="刪除" cancelLabel="取消" onAction={() => remove(confirmDel)} />
    </Panel>
  );
}

// Rename on Enter or when the field loses focus; an empty or duplicate name puts the old one back.
function SetName({p, taken, onRename}) {
  const [v, setV] = useState(p.name);
  useEffect(() => setV(p.name), [p.name]);
  const commit = () => {
    const n = v.trim();
    if (!n || taken(n)) setV(p.name); else if (n !== p.name) onRename(n);
  };
  return (
    <div onBlur={commit}>
      <TextInput label="名稱" size="sm" value={v} onChange={x => setV(x.slice(0, 24))} onEnter={commit} />
    </div>
  );
}
