// Minimal test runner: node tests/run.mjs [fixture] [--dump]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const dir = path.dirname(new URL(import.meta.url).pathname);
const src = fs.readFileSync(path.join(dir, "../dist/vallox-dashboard.js"), "utf8");
const defined = {};
const window = { customElements: { get: (t) => defined[t] || (t === "home-assistant" ? class {} : undefined), define: (t, c) => { defined[t] = c; } } };
vm.runInNewContext(src, { window, HTMLElement: class {}, console: { info() {}, warn: console.warn }, setInterval, clearInterval });
const api = window.valloxDashboard;
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.error("FAIL", msg); } else console.log("ok  ", msg); };
const walk = (o, f) => { if (Array.isArray(o)) o.forEach((x) => walk(x, f)); else if (o && typeof o === "object") { f(o); Object.values(o).forEach((v) => walk(v, f)); } };
for (const fx of ["fixture_vallox2mqtt.json", "fixture_core.json"]) {
  const hass = { ...JSON.parse(fs.readFileSync(path.join(dir, fx), "utf8")), locale: { language: "en" } };
  const units = api.findUnits(hass);
  check(units.length === 1, `${fx}: one unit found (${units.map((u) => u.platform)})`);
  const sec = api.buildSection(hass, {});
  const view = api.buildView(hass, {});
  const ids = new Set();
  walk([sec, view], (o) => { if (typeof o.entity === "string") ids.add(o.entity); });
  check([...ids].every((id) => hass.states[id]), `${fx}: every referenced entity exists (${ids.size})`);
  for (const r of ["outdoor", "supply", "extract", "exhaust"]) check(units[0].e[r], `${fx}: role ${r} -> ${units[0].e[r]}`);
  check(view.sections.length === 2, `${fx}: view has overview + history`);
  if (process.argv.includes("--dump")) fs.writeFileSync(path.join(dir, `out_${fx}`), JSON.stringify({ section: sec, view }, null, 1));
}
// German + no unit
const empty = api.buildSection({ entities: {}, states: {}, devices: {}, locale: { language: "de" } }, {});
check(/Kein Vallox/.test(JSON.stringify(empty)), "no unit -> localized warning");
check(defined["ll-strategy-section-vallox-ventilation"] && defined["ll-strategy-dashboard-vallox-ventilation"], "elements registered");
process.exit(failed ? 1 : 0);
