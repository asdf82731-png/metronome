// Scheduler timer that keeps its pace when the page is in the background.
// The browser slows a hidden page's own timers to about one tick a second, which is longer than the engines'
// look-ahead, so the beat drops out. A timer inside a Web Worker is not slowed down (worker-timers runs one for us).
// If the worker cannot start, the page's own timer is used instead.
import * as wt from 'worker-timers';

const live = new Map();   // our id -> how to stop it
let seq = 0;

export function setInterval(fn, ms) {
  const id = ++seq;
  try {
    const w = wt.setInterval(fn, ms);
    live.set(id, () => wt.clearInterval(w));
  } catch {
    const t = window.setInterval(fn, ms);
    live.set(id, () => window.clearInterval(t));
  }
  return id;
}

// Safe to call with an id that is unknown or already cleared (worker-timers itself throws on those).
export function clearInterval(id) {
  const stop = live.get(id);
  if (!stop) return;
  live.delete(id);
  try { stop(); } catch { /* already gone */ }
}
