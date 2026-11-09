// Minimal test runner: node tests/run.mjs [fixture] [--dump]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const dir = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(dir, "../dist/vallox-dashboard.js"), "utf8");
const defined = {};
const window = { customElements: { get: (t) => defined[t] || (t === "home-assistant" ? class {} : undefined), define: (t, c) => { defined[t] = c; } } };
const context = { window, HTMLElement: class {}, console: { info() {}, warn: console.warn }, setInterval, clearInterval };
vm.runInNewContext(src, context);
const labels = JSON.parse(vm.runInContext("JSON.stringify(TEXT)", context));
const pickUnits = vm.runInContext("pickUnits", context);
const api = window.valloxDashboard;
let failed = 0, passed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.error("FAIL", msg); } else { passed++; console.log("ok  ", msg); } };
const walk = (o, f) => { if (Array.isArray(o)) o.forEach((x) => walk(x, f)); else if (o && typeof o === "object") { f(o); Object.values(o).forEach((v) => walk(v, f)); } };
function references(config) {
  const ids = new Set();
  walk(config, (o) => {
    if (typeof o.entity === "string") ids.add(o.entity);
    if (typeof o.entity_id === "string") ids.add(o.entity_id);
    if (o.perform_action && o.perform_action.startsWith("script.")) ids.add(o.perform_action);
    if (typeof o.content === "string") {
      for (const m of o.content.matchAll(/(?:states|state_attr|is_state)\('([^']+)'/g)) ids.add(m[1]);
    }
  });
  return ids;
}
for (const fx of ["fixture_vallox2mqtt.json", "fixture_core.json", "fixture_vallox2mqtt_1_2.json"]) {
  const hass = { ...JSON.parse(fs.readFileSync(path.join(dir, fx), "utf8")), locale: { language: "en" } };
  const units = api.findUnits(hass);
  check(units.length === 1, `${fx}: one unit found (${units.map((u) => u.platform)})`);
  const sec = api.buildSection(hass, {});
  const view = api.buildView(hass, {});
  if (fx === "fixture_vallox2mqtt.json") {
    const expected = JSON.parse(fs.readFileSync(path.join(dir, "expected_vallox2mqtt_1_0_0.json"), "utf8"));
    check(JSON.stringify({ section: sec, view }) === JSON.stringify(expected), "old MQTT fixture: identical to 1.0.0 section and view (no new groups)");
  }
  const expected110 = JSON.parse(fs.readFileSync(path.join(dir, 'expected_1_1_0_' + fx), 'utf8'));
  for (const style of [undefined, 'tiles']) check(JSON.stringify({section:api.buildSection(hass,{style}),view:api.buildView(hass,{style})}) === JSON.stringify(expected110), fx + ': default/tiles byte-identical to 1.1.0');
  const ids = references([sec, view]);
  check([...ids].every((id) => hass.states[id]), `${fx}: every referenced entity exists (${ids.size})`);
  for (const r of ["outdoor", "supply", "extract", "exhaust"]) check(units[0].e[r], `${fx}: role ${r} -> ${units[0].e[r]}`);
  check(view.sections.length === 2, `${fx}: view has overview + history`);
  if (process.argv.includes("--dump")) fs.writeFileSync(path.join(dir, `out_${fx}`), JSON.stringify({ section: sec, view }, null, 1));
}
const hass = { ...JSON.parse(fs.readFileSync(path.join(dir, "fixture_vallox2mqtt_1_2.json"), "utf8")), locale: { language: "en" } };
const roles = pickUnits(hass, {})[0].e;
const newRoles = ["filter_warning", "error_relay", "cell_freeze_alarm", "fault_code", "boost_remaining",
  "bypass_setpoint", "preheat_setpoint", "defrost_setpoint", "defrost_hysteresis", "post_heating_target", "maximum_fan_speed",
  "shower_boost", "shower_timer", "shower_active", "shower_cancel", "auto_humidity_enabled", "auto_humidity_threshold",
  "auto_humidity_rise", "auto_humidity_level", "auto_humidity_minutes", "auto_humidity_cooldown"];
for (const role of newRoles) check(!!hass.states[roles[role]], `1.2 + package: role ${role} found`);
check(roles.status === "binary_sensor.ventilation" && roles.post_heating === "binary_sensor.ventilation_post_heating"
  && roles.switch_type === "sensor.ventilation_switch_type" && roles.service_needed === "binary_sensor.ventilation_service_needed",
  "new patterns preserve existing roles");
const section = api.buildSection(hass, {});
for (const [name, overview] of [["section", section], ["view", api.buildView(hass, {}).sections[0]]]) {
  const cards = overview.cards;
  const climate = cards.findIndex((c) => c.entity === roles.climate);
  check(cards[0].heading_style === "title" && climate > 0
    && !cards.slice(1, climate).some((c) => c.type === "heading"),
    `1.2 ${name}: no sub-heading between title and climate control`);
  const flow = cards.findIndex((c) => c.content?.includes(labels.en.temperature_flow));
  const shower = cards.findIndex((c) => c.heading === labels.en.shower_boost);
  const humidity = cards.findIndex((c) => c.heading === labels.en.auto_humidity);
  const alarms = cards.findIndex((c) => c.heading === labels.en.alarms);
  const temperatures = cards.findIndex((c) => c.heading === labels.en.air_temperatures);
  check(climate < flow && cards.findIndex((c) => c.entity === roles.switch_type) < flow
    && flow < shower && shower < humidity && humidity < alarms && alarms < temperatures,
    `1.2 ${name}: controls, flow, shower, humidity and alarms precede existing groups in order`);
  const banners = cards.filter((c) => c.content?.includes(labels.en.alarm_alert));
  check(banners.length === 1 && cards.indexOf(banners[0]) < climate
    && ["filter_warning", "error_relay", "cell_freeze_alarm", "fault_code"].every((r) => {
      const index = cards.findIndex((c) => c.entity === roles[r]);
      return alarms < index && index < temperatures;
    }), `1.2 ${name}: one alarm banner before controls; alarm tiles under Alarms`);
}
check(JSON.stringify(api.buildSection(hass, null)) === JSON.stringify(section), "null strategy config keeps default behavior");
check(!JSON.stringify(section).includes("defrost_hysteresis_raw"), "raw diagnostic hysteresis excluded");
const buttons = section.cards.filter((c) => c.tap_action && c.tap_action.perform_action === roles.shower_boost);
check(buttons.length === 4 && buttons.every((c) => c.type === "button" && c.entity === roles.shower_boost
  && c.tap_action.action === "perform-action") && JSON.stringify(buttons.map((c) => c.tap_action.data))
  === JSON.stringify([{ level: 6, minutes: 15 }, { level: 7, minutes: 15 }, { level: 6, minutes: 30 }, { level: 7, minutes: 30 }]),
  "four default shower buttons call the script with level/minutes only on tap");
const custom = api.buildSection(hass, { shower_boost_presets: [{ minutes: 20, level: 5 }, { minutes: -1, level: 9 }] });
check(custom.cards.filter((c) => c.tap_action?.perform_action === roles.shower_boost).length === 1
  && custom.cards.some((c) => c.tap_action?.data?.minutes === 20), "custom presets supported; invalid presets omitted");
const banner = section.cards.find((c) => c.content?.includes(labels.en.alarm_alert));
check(banner?.visibility[0].condition === "or" && banner.visibility[0].conditions.length === 4
  && banner.visibility[0].conditions.some((c) => c.condition === "numeric_state" && c.entity === roles.fault_code && c.above === 0),
  "alarm banner uses live OR conditions including fault code > 0");
check(section.cards.findIndex((c) => c.entity === roles.boost_remaining)
  === section.cards.findIndex((c) => c.entity === roles.boost_switch) + 1, "built-in boost time is next to its switch");
check(section.cards.filter((c) => ["shower_timer", "shower_cancel"].some((r) => c.entity === roles[r]))
  .every((c) => c.visibility[0].entity === roles.shower_active && c.visibility[0].state === "on"), "countdown and cancel visible only while active");
for (const [option, label, hidden] of [
  ["alarms", "alarms", ["filter_warning", "error_relay", "cell_freeze_alarm", "fault_code"]],
  ["boost_remaining", null, ["boost_remaining"]], ["unit_setpoints", "unit_setpoints", ["bypass_setpoint", "preheat_setpoint", "defrost_setpoint", "defrost_hysteresis", "post_heating_target", "maximum_fan_speed"]],
  ["temperature_flow", "temperature_flow", []], ["shower_boost", "shower_boost", ["shower_boost", "shower_timer", "shower_cancel"]],
  ["auto_humidity", "auto_humidity", ["auto_humidity_enabled", "auto_humidity_threshold", "auto_humidity_rise", "auto_humidity_level", "auto_humidity_minutes", "auto_humidity_cooldown"]],
]) {
  for (const builder of [api.buildSection, api.buildView]) {
    const result = builder(hass, { show: { [option]: false } });
    const ids = references(result);
    check(hidden.every((r) => !ids.has(roles[r])) && (!label || !JSON.stringify(result).includes(labels.en[label])),
      `${builder.name}: show.${option}=false hides its group`);
  }
}
for (const role of ["shower_boost", "shower_timer", "shower_active", "shower_cancel", "auto_humidity_enabled", "auto_humidity_threshold"]) {
  const partial = structuredClone(hass);
  delete partial.states[roles[role]];
  const result = api.buildSection(partial, {});
  check([...references(result)].every((id) => partial.states[id]), `missing ${role}: no dangling references`);
  if (role === "shower_boost") check(!JSON.stringify(result).includes(labels.en.shower_boost), "no start script: shower group absent");
  if (["shower_timer", "shower_active", "shower_cancel"].includes(role)) {
    check(!references(result).has(roles.shower_timer) && !references(result).has(roles.shower_cancel), `missing ${role}: countdown/cancel omitted together`);
  }
  if (role === "auto_humidity_enabled") check(!JSON.stringify(result).includes(labels.en.auto_humidity), "no humidity toggle: humidity group absent");
}
const overridden = structuredClone(hass);
overridden.states["script.custom_boost"] = overridden.states[roles.shower_boost];
check(api.buildSection(overridden, { entities: { shower_boost: "script.custom_boost" } }).cards
  .filter((c) => c.tap_action?.perform_action === "script.custom_boost").length === 4, "script role override changes all shower buttons");
check(!references(api.buildSection(hass, { entities: { shower_boost: null } })).has(roles.shower_boost), "null override suppresses default package role");
const renamed = structuredClone(hass);
renamed.entities = Object.fromEntries(Object.entries(renamed.entities).map(([id, ent], i) => {
  if (ent.platform !== "vallox2mqtt") return [id, ent];
  const replacement = `${id.split(".")[0]}.unit_${i}`;
  renamed.states[replacement] = renamed.states[id];
  delete renamed.states[id];
  return [replacement, { ...ent, entity_id: replacement }];
}));
const renamedRoles = api.findUnits(renamed)[0].e;
check(newRoles.slice(0, 11).every((r) => renamedRoles[r]), "friendly-name matching finds all new MQTT roles with unrelated ids");
const reordered = structuredClone(hass);
reordered.entities = Object.fromEntries(Object.entries(reordered.entities).reverse());
check(api.findUnits(reordered)[0].e.status === roles.status, "alarm sensors cannot steal catch-all status even when discovered first");
const old = JSON.parse(fs.readFileSync(path.join(dir, "fixture_vallox2mqtt.json"), "utf8"));
check(api.buildSection(old, { show: { temperature_flow: true } }).cards.some((c) => c.content?.includes(labels.en.temperature_flow)), "older units can explicitly enable flow");
const noSupply = structuredClone(hass);
delete noSupply.states[roles.supply];
check(!JSON.stringify(api.buildSection(noSupply, {})).includes(labels.en.temperature_flow), "flow requires all four temperatures");
check(section.cards.some((c) => c.content?.includes(labels.en.temperature_flow) && c.content.includes(labels.en.efficiency_est)), "flow uses the existing guarded estimate");
const measured = structuredClone(hass);
measured.states["sensor.recovery"] = { state: "80", attributes: { unit_of_measurement: "%" } };
check(api.buildSection(measured, { entities: { efficiency: "sensor.recovery" } }).cards
  .some((c) => c.content?.includes(labels.en.temperature_flow) && c.content.includes("states('sensor.recovery')")), "flow prefers a mapped efficiency sensor");
const core = JSON.parse(fs.readFileSync(path.join(dir, "fixture_core.json"), "utf8"));
check(api.buildSection(core, {}).cards.filter((c) => c.features?.some((f) => f.type === "numeric-input")).length === 3, "core supply target controls preserved");
check(JSON.stringify(Object.keys(labels.en).sort()) === JSON.stringify(Object.keys(labels.de).sort())
  && Object.values(labels.de).every((s) => typeof s === "string" && s.length), "every EN label has a nonempty DE label");
const german = JSON.stringify(api.buildSection({ ...hass, locale: { language: "de" } }, {}));
check(["alarms", "unit_setpoints", "temperature_flow", "shower_boost", "auto_humidity", ...newRoles.filter((r) => labels.de[r])]
  .every((key) => german.includes(labels.de[key])), "new groups and tiles use German labels");
check(api.version === "1.2.3" && JSON.parse(fs.readFileSync(path.join(dir, "../package.json"), "utf8")).version === api.version, "release versions agree at 1.2.3");
const generated = execFileSync(process.execPath, [path.join(dir, "explicit.mjs"), "fixture_vallox2mqtt_1_2.json", "Ventilation", "en", "--yaml"], { encoding: "utf8" });
check(generated === fs.readFileSync(path.join(dir, "../examples/section-vallox2mqtt.yaml"), "utf8").replaceAll("\r\n", "\n")
  && generated.startsWith("# Explicit section generated by vallox-dashboard 1.2.3 for vallox2mqtt"), "MQTT YAML example is reproducible with the correct header");
// German + no unit
const empty = api.buildSection({ entities: {}, states: {}, devices: {}, locale: { language: "de" } }, {});
check(/Kein Vallox/.test(JSON.stringify(empty)), "no unit -> localized warning");
check(defined["ll-strategy-section-vallox-ventilation"] && defined["ll-strategy-dashboard-vallox-ventilation"], "elements registered");
await import('./graphic.mjs').then((m) => m.testGraphic({api, defined, hass, roles, check, context, vm}));
console.log(`${passed} passed; ${failed} failed`);
process.exit(failed ? 1 : 0);
