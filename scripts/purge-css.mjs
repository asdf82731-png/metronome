// Vite plugin: drop Astryx CSS rules no built file uses.
// astryx.css carries the atomic StyleX classes of every Astryx component (~280 KB). The dist JS names each class it
// uses as a plain string ("x1n2onr6"), so a rule is kept only when every atomic class in its selector appears in the
// built JS or HTML. Our own class names and token rules are never touched.
import {createHash} from 'node:crypto';
import postcss from 'postcss';

const ATOMIC = /^x[0-9a-z]{5,9}$/;

export function purgeAtomicCss() {
  return {
    name: 'purge-atomic-css',
    enforce: 'post',
    generateBundle(_, bundle) {
      const used = new Set();
      for (const f of Object.values(bundle)) {
        const text = f.type === 'chunk' ? f.code : f.fileName.endsWith('.html') ? String(f.source) : '';
        for (const w of text.match(/[A-Za-z0-9_-]+/g) || []) used.add(w);
      }
      const keep = sel => [...sel.matchAll(/\.((?:\\.|[\w-])+)/g)].every(([, c]) => !ATOMIC.test(c) || used.has(c));
      for (const f of Object.values(bundle)) {
        if (f.type !== 'asset' || !f.fileName.endsWith('.css')) continue;
        const root = postcss.parse(String(f.source));
        root.walkRules(rule => {
          const sels = rule.selectors.filter(keep);
          if (!sels.length) rule.remove();
          else if (sels.length !== rule.selectors.length) rule.selectors = sels;
        });
        // at-rules left empty (@media, @supports, @layer blocks) go too; @property and statements have no nodes
        let removed;
        do {
          removed = false;
          root.walkAtRules(at => { if (at.nodes && !at.nodes.length) { at.remove(); removed = true; } });
        } while (removed);
        f.source = root.toString();
        // Vite hashed the file name before this pass: give it a hash of the new content so no cache serves the old one
        const hash = createHash('sha256').update(f.source).digest('base64url').slice(0, 8);
        const name = f.fileName.replace(/-[\w-]{8}\.css$/, `-${hash}.css`);
        if (name === f.fileName) continue;
        const [from, to] = [f.fileName.split('/').pop(), name.split('/').pop()];
        for (const o of Object.values(bundle)) {
          if (o.type === 'chunk') o.code = o.code.replaceAll(from, to);
          else if (typeof o.source === 'string') o.source = o.source.replaceAll(from, to);
        }
        delete bundle[f.fileName];
        f.fileName = name;
        bundle[name] = f;
      }
    },
  };
}
