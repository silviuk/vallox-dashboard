/*
 * Vallox Dashboard for Home Assistant
 * https://github.com/silviuk/vallox-dashboard
 *
 * Lovelace section, view and dashboard strategies that build a modern,
 * tile-based UI for Vallox ventilation units. Supported integrations:
 *   - vallox2mqtt (Vallox Digit SE / ValloPlus SE over RS485, kotope/valloxesp)
 *   - vallox (Home Assistant core, Vallox MV units over the network)
 * Only built-in Home Assistant cards are used. MIT licensed.
 */
const VALLOX_DASHBOARD_VERSION = "1.0.0";

const TEXT = {
  en: {
    ventilation: "Ventilation", fan: "Fan", fan_speed: "Fan speed", profile: "Profile",
    profile_duration: "Profile time left", boost_switch: "Boost / fireplace", switch_type: "Switch function",
    air_temperatures: "Air temperatures", outdoor: "Outdoor air", supply: "Supply air", extract: "Extract air",
    exhaust: "Exhaust air", supply_cell: "Supply air (after cell)", efficiency: "Heat recovery",
    efficiency_est: "Heat recovery (estimate)",
    efficiency_note: "estimated from extract and exhaust air: (extract − exhaust) ÷ (extract − outdoor)",
    efficiency_na: "Heat recovery: not enough temperature difference for an estimate right now.",
    status: "Status", motor_in: "Supply fan", motor_out: "Extract fan", front_heating: "Pre-heating",
    post_heating: "Post-heating", summer_mode: "Summer mode", bypass_locked: "Bypass locked",
    cell_state: "Cell state", supply_fan_rpm: "Supply fan speed", extract_fan_rpm: "Extract fan speed",
    service: "Filter & service", service_counter: "Service counter", service_needed: "Service needed",
    service_alert: "The unit reports that service (filter change) is due.",
    filter_time: "Filter change due", filter_date: "Filter changed on",
    indoor_air: "Indoor air", humidity: "Humidity", humidity_2: "Humidity 2", co2: "CO₂",
    setpoints: "Supply air targets", target_home: "Home", target_away: "Away", target_boost: "Boost",
    temps_48h: "Air temperatures (48 h)", air_24h: "Indoor air (24 h)", activity_24h: "Activity (24 h)",
    history: "Ventilation history",
    no_unit: "No Vallox ventilation unit found. Install the vallox2mqtt or the core Vallox integration, or set entities in the strategy config.",
    unknown_section: "Unknown vallox-dashboard section",
  },
  de: {
    ventilation: "Lüftung", fan: "Lüfter", fan_speed: "Lüfterstufe", profile: "Profil",
    profile_duration: "Profil-Restzeit", boost_switch: "Boost / Kamin", switch_type: "Schalterfunktion",
    air_temperatures: "Lufttemperaturen", outdoor: "Außenluft", supply: "Zuluft", extract: "Abluft",
    exhaust: "Fortluft", supply_cell: "Zuluft (nach Tauscher)", efficiency: "Wärmerückgewinnung",
    efficiency_est: "Wärmerückgewinnung (Schätzung)",
    efficiency_note: "geschätzt aus Ab- und Fortluft: (Abluft − Fortluft) ÷ (Abluft − Außenluft)",
    efficiency_na: "Wärmerückgewinnung: Temperaturdifferenz derzeit zu klein für eine Schätzung.",
    status: "Status", motor_in: "Zuluftventilator", motor_out: "Abluftventilator", front_heating: "Vorheizung",
    post_heating: "Nachheizung", summer_mode: "Sommerbetrieb", bypass_locked: "Bypass gesperrt",
    cell_state: "Tauscherstatus", supply_fan_rpm: "Zuluft-Drehzahl", extract_fan_rpm: "Abluft-Drehzahl",
    service: "Filter & Wartung", service_counter: "Wartungszähler", service_needed: "Wartung fällig",
    service_alert: "Das Gerät meldet, dass eine Wartung (Filterwechsel) fällig ist.",
    filter_time: "Filterwechsel fällig", filter_date: "Filter gewechselt am",
    indoor_air: "Raumluft", humidity: "Luftfeuchte", humidity_2: "Luftfeuchte 2", co2: "CO₂",
    setpoints: "Zuluft-Sollwerte", target_home: "Zuhause", target_away: "Abwesend", target_boost: "Boost",
    temps_48h: "Lufttemperaturen (48 h)", air_24h: "Raumluft (24 h)", activity_24h: "Aktivität (24 h)",
    history: "Lüftungsverlauf",
    no_unit: "Kein Vallox-Lüftungsgerät gefunden. Installiere vallox2mqtt oder die Vallox-Core-Integration oder gib die Entitäten in der Strategie-Konfiguration an.",
    unknown_section: "Unbekannter vallox-dashboard-Abschnitt",
  },
};

const SECTIONS = ["overview", "history"];
const PLATFORMS = ["vallox2mqtt", "vallox"];

// Core Vallox integration: "<domain>.<translation_key>" -> role.
const CORE_KEYS = {
  "sensor.outdoor_air": "outdoor", "sensor.supply_air": "supply", "sensor.extract_air": "extract",
  "sensor.exhaust_air": "exhaust", "sensor.supply_cell_air": "supply_cell", "sensor.efficiency": "efficiency",
  "sensor.fan_speed": "fan_speed", "sensor.extract_fan_speed": "extract_fan_rpm",
  "sensor.supply_fan_speed": "supply_fan_rpm", "sensor.current_profile": "profile",
  "sensor.profile_duration": "profile_duration", "sensor.remaining_time_for_filter": "filter_time",
  "sensor.cell_state": "cell_state", "binary_sensor.post_heater": "post_heating",
  "switch.bypass_locked": "bypass_locked", "date.filter_change_date": "filter_date",
  "number.supply_air_target_home": "target_home", "number.supply_air_target_away": "target_away",
  "number.supply_air_target_boost": "target_boost",
};

// vallox2mqtt has no translation keys; match the entity id / name instead.
const MQTT_PATTERNS = [
  ["sensor", /outside_temp/, "outdoor"], ["sensor", /incoming_temp/, "supply"],
  ["sensor", /inside_temp/, "extract"], ["sensor", /exhaust_temp/, "exhaust"],
  ["sensor", /(^|_)rh_?1$|humidity_?1$/, "humidity"], ["sensor", /(^|_)rh_?2$|humidity_?2$/, "humidity_2"],
  ["sensor", /co2$/, "co2"], ["sensor", /service_counter/, "service_counter"],
  ["sensor", /switch_type/, "switch_type"],
  ["binary_sensor", /service_needed/, "service_needed"], ["binary_sensor", /motor_in$/, "motor_in"],
  ["binary_sensor", /motor_out$/, "motor_out"], ["binary_sensor", /summer_mode/, "summer_mode"],
  ["binary_sensor", /front_heating/, "front_heating"], ["binary_sensor", /post_heating/, "post_heating"],
  ["binary_sensor", /.*/, "status"], ["climate", /.*/, "climate"], ["switch", /.*/, "boost_switch"],
];

function texts(hass) {
  const lang = ((hass.locale && hass.locale.language) || hass.language || "en").split("-")[0];
  return TEXT[lang] || TEXT.en;
}

const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function roleOf(ent, st) {
  const domain = ent.entity_id.split(".")[0];
  if (ent.platform === "vallox") {
    const role = CORE_KEYS[`${domain}.${ent.translation_key}`];
    if (role) return role;
    if (domain === "fan") return "fan";
    const dc = st.attributes && st.attributes.device_class;
    if (domain === "sensor" && dc === "humidity") return "humidity";
    if (domain === "sensor" && dc === "carbon_dioxide") return "co2";
    return null;
  }
  const object = ent.entity_id.split(".")[1];
  const name = slug(st.attributes && st.attributes.friendly_name);
  for (const [d, re, role] of MQTT_PATTERNS) {
    if (d === domain && (re.test(object) || re.test(name))) return role;
  }
  return null;
}

/** Find Vallox units: [{deviceId, platform, name, e: {role: entity_id}, all: []}]. */
function findUnits(hass) {
  const units = new Map();
  for (const ent of Object.values(hass.entities || {})) {
    if (!PLATFORMS.includes(ent.platform)) continue;
    const st = hass.states[ent.entity_id];
    if (!st) continue; // disabled or not loaded
    const id = `${ent.platform}:${ent.device_id || "_none"}`;
    if (!units.has(id)) {
      const dev = (hass.devices || {})[ent.device_id] || {};
      units.set(id, {
        deviceId: ent.device_id || null, platform: ent.platform,
        name: dev.name_by_user || dev.name || "Vallox", e: {}, all: [],
      });
    }
    const unit = units.get(id);
    unit.all.push(ent.entity_id);
    const role = roleOf(ent, st);
    if (role && !unit.e[role]) unit.e[role] = ent.entity_id;
  }
  return [...units.values()].sort((a, b) =>
    PLATFORMS.indexOf(a.platform) - PLATFORMS.indexOf(b.platform) || a.name.localeCompare(b.name));
}

function pickUnits(hass, config) {
  config = config || {};
  let units = findUnits(hass);
  if (config.device_id) units = units.filter((u) => u.deviceId === config.device_id);
  if (config.entities) {
    // Manual mapping (or overrides): {outdoor: "sensor.x", climate: "climate.y", ...}
    const base = units[0] || { deviceId: null, platform: "manual", name: "Vallox", e: {}, all: [] };
    const e = { ...base.e };
    for (const [role, id] of Object.entries(config.entities)) if (id) e[role] = id; else delete e[role];
    units = [{ ...base, e }];
  }
  if (config.name && units.length) units = units.map((u) => ({ ...u, name: config.name }));
  return units;
}

const HALF = { grid_options: { columns: 6 } };
const THIRD = { grid_options: { columns: 4 } };
const FULL = { grid_options: { columns: 12 } };

function exists(hass, entity) { return !!(entity && hass.states[entity]); }

function tile(hass, entity, name, extra = {}) {
  if (!exists(hass, entity)) return null;
  const card = { type: "tile", entity, ...HALF, ...extra };
  if (name) card.name = name;
  return card;
}

function heading(text, icon, badges = [], style = "title") {
  const card = { type: "heading", heading: text, heading_style: style };
  if (icon) card.icon = icon;
  const b = badges.filter(Boolean);
  if (b.length) card.badges = b;
  return card;
}

function badge(hass, entity, extra = {}) {
  if (!exists(hass, entity)) return null;
  return { type: "entity", entity, show_state: true, show_icon: true, ...extra };
}

function history(title, hours, entries) {
  const entities = entries.filter((x) => x && x.entity);
  if (!entities.length) return null;
  return { type: "history-graph", title, hours_to_show: hours, entities };
}

const isOn = (entity) => [{ condition: "state", entity, state: "on" }];

function section(cards) {
  const list = cards.filter(Boolean);
  if (list.filter((c) => c.type !== "heading").length === 0) return null;
  return { type: "grid", cards: list };
}

/** Sub-heading followed by its cards; dropped when no card is left. */
function group(title, icon, cards) {
  const list = cards.filter(Boolean);
  return list.length ? [heading(title, icon, [], "subtitle"), ...list] : [];
}

function efficiencyCard(hass, e, t) {
  if (exists(hass, e.efficiency)) {
    return tile(hass, e.efficiency, t.efficiency, { icon: "mdi:heat-wave", color: "green", ...FULL });
  }
  if (![e.outdoor, e.extract, e.exhaust].every((x) => exists(hass, x))) return null;
  return {
    type: "markdown", ...FULL,
    content: `{% set o = states('${e.outdoor}') | float(none) %}
{% set i = states('${e.extract}') | float(none) %}
{% set x = states('${e.exhaust}') | float(none) %}
{% if o is not none and i is not none and x is not none and (i - o) >= 4 %}
{% set eff = ((i - x) / (i - o) * 100) | round(0) | int %}
<ha-icon icon="mdi:heat-wave"></ha-icon> **${t.efficiency_est}: {{ [0, [eff, 100] | min] | max }} %**
<small>${t.efficiency_note}</small>
{% else %}
<ha-icon icon="mdi:heat-wave"></ha-icon> ${t.efficiency_na}
{% endif %}`,
  };
}

function controlCards(hass, u, t) {
  const e = u.e;
  const cards = [];
  if (exists(hass, e.fan)) {
    const a = hass.states[e.fan].attributes || {};
    const features = [];
    if (Array.isArray(a.preset_modes) && a.preset_modes.length) {
      features.push({ type: "fan-preset-modes", style: "icons", preset_modes: a.preset_modes });
    }
    features.push({ type: "fan-speed" });
    cards.push(tile(hass, e.fan, t.ventilation, {
      ...FULL, icon: "mdi:fan", color: "blue", state_content: ["preset_mode", "percentage"], features,
    }));
  }
  if (exists(hass, e.climate)) {
    const a = hass.states[e.climate].attributes || {};
    const features = [];
    if (Array.isArray(a.fan_modes) && a.fan_modes.length) {
      features.push({ type: "climate-fan-modes", style: "dropdown", fan_modes: a.fan_modes });
    }
    if (Array.isArray(a.hvac_modes) && a.hvac_modes.length > 1) {
      features.push({ type: "climate-hvac-modes", hvac_modes: a.hvac_modes });
    }
    cards.push(tile(hass, e.climate, t.ventilation, {
      ...FULL, icon: "mdi:fan", color: "blue", state_content: ["fan_mode", "hvac_action"], features,
    }));
  }
  cards.push(tile(hass, e.profile, t.profile, { icon: "mdi:tune-vertical", color: "amber" }));
  cards.push(tile(hass, e.profile_duration, t.profile_duration, { icon: "mdi:timer-sand" }));
  cards.push(tile(hass, e.fan_speed, t.fan_speed, { icon: "mdi:speedometer" }));
  cards.push(tile(hass, e.boost_switch, t.boost_switch, { icon: "mdi:rocket-launch", color: "amber" }));
  cards.push(tile(hass, e.switch_type, t.switch_type, { icon: "mdi:gesture-tap-button" }));
  return cards;
}

const BUILDERS = {
  overview(hass, u, t) {
    const e = u.e;
    return section([
      heading(u.name, "mdi:hvac", [
        badge(hass, e.status, { show_state: false }),
        badge(hass, e.outdoor),
        badge(hass, e.service_needed, { color: "red", visibility: e.service_needed ? isOn(e.service_needed) : undefined }),
      ]),
      exists(hass, e.service_needed) ? {
        type: "markdown", text_only: true, visibility: isOn(e.service_needed),
        content: `<ha-alert alert-type="warning">${t.service_alert}</ha-alert>`,
      } : null,
      ...controlCards(hass, u, t),
      ...group(t.air_temperatures, "mdi:thermometer", [
        tile(hass, e.outdoor, t.outdoor, { icon: "mdi:home-import-outline", color: "teal" }),
        tile(hass, e.supply, t.supply, { icon: "mdi:arrow-right-bold-box-outline", color: "green" }),
        tile(hass, e.extract, t.extract, { icon: "mdi:home-thermometer-outline", color: "orange" }),
        tile(hass, e.exhaust, t.exhaust, { icon: "mdi:home-export-outline", color: "brown" }),
        tile(hass, e.supply_cell, t.supply_cell, { icon: "mdi:swap-horizontal" }),
        efficiencyCard(hass, e, t),
      ]),
      ...group(t.indoor_air, "mdi:air-filter", [
        tile(hass, e.humidity, t.humidity, { icon: "mdi:water-percent", color: "blue" }),
        tile(hass, e.humidity_2, t.humidity_2, { icon: "mdi:water-percent", color: "blue" }),
        tile(hass, e.co2, t.co2, { icon: "mdi:molecule-co2", color: "light-green" }),
      ]),
      ...group(t.setpoints, "mdi:thermometer-lines", [
        tile(hass, e.target_home, t.target_home, { ...THIRD, features: [{ type: "numeric-input", style: "buttons" }] }),
        tile(hass, e.target_away, t.target_away, { ...THIRD, features: [{ type: "numeric-input", style: "buttons" }] }),
        tile(hass, e.target_boost, t.target_boost, { ...THIRD, features: [{ type: "numeric-input", style: "buttons" }] }),
      ]),
      ...group(t.status, "mdi:list-status", [
        tile(hass, e.motor_in, t.motor_in, { icon: "mdi:fan-chevron-down", color: "blue" }),
        tile(hass, e.motor_out, t.motor_out, { icon: "mdi:fan-chevron-up", color: "blue" }),
        tile(hass, e.supply_fan_rpm, t.supply_fan_rpm, { icon: "mdi:fan-chevron-down" }),
        tile(hass, e.extract_fan_rpm, t.extract_fan_rpm, { icon: "mdi:fan-chevron-up" }),
        tile(hass, e.front_heating, t.front_heating, { icon: "mdi:radiator", color: "red" }),
        tile(hass, e.post_heating, t.post_heating, { icon: "mdi:radiator", color: "red" }),
        tile(hass, e.summer_mode, t.summer_mode, { icon: "mdi:weather-sunny", color: "amber" }),
        tile(hass, e.cell_state, t.cell_state, { icon: "mdi:swap-horizontal-variant" }),
        tile(hass, e.bypass_locked, t.bypass_locked, { icon: "mdi:lock-outline" }),
      ]),
      ...group(t.service, "mdi:wrench-clock", [
        tile(hass, e.filter_time, t.filter_time, { icon: "mdi:air-filter" }),
        tile(hass, e.filter_date, t.filter_date, { icon: "mdi:calendar-check" }),
        tile(hass, e.service_counter, t.service_counter, { icon: "mdi:calendar-clock" }),
        tile(hass, e.service_needed, t.service_needed, { icon: "mdi:wrench-clock" }),
      ]),
    ]);
  },

  history(hass, u, t) {
    const e = u.e;
    const ok = (x) => exists(hass, x);
    return section([
      heading(t.history, "mdi:chart-line"),
      history(t.temps_48h, 48, [
        ok(e.outdoor) && { entity: e.outdoor, name: t.outdoor },
        ok(e.supply) && { entity: e.supply, name: t.supply },
        ok(e.extract) && { entity: e.extract, name: t.extract },
        ok(e.exhaust) && { entity: e.exhaust, name: t.exhaust },
      ]),
      history(t.air_24h, 24, [
        ok(e.humidity) && { entity: e.humidity, name: t.humidity },
        ok(e.humidity_2) && { entity: e.humidity_2, name: t.humidity_2 },
      ]),
      history(t.co2, 24, [ok(e.co2) && { entity: e.co2, name: t.co2 }]),
      history(t.activity_24h, 24, [
        ok(e.fan) && { entity: e.fan, name: t.fan },
        ok(e.profile) && { entity: e.profile, name: t.profile },
        ok(e.boost_switch) && { entity: e.boost_switch, name: t.boost_switch },
        ok(e.motor_in) && { entity: e.motor_in, name: t.motor_in },
        ok(e.motor_out) && { entity: e.motor_out, name: t.motor_out },
        ok(e.front_heating) && { entity: e.front_heating, name: t.front_heating },
        ok(e.post_heating) && { entity: e.post_heating, name: t.post_heating },
        ok(e.summer_mode) && { entity: e.summer_mode, name: t.summer_mode },
      ]),
    ]);
  },
};

function errorSection(message) {
  return { type: "grid", cards: [{ type: "markdown", content: `<ha-alert alert-type="warning">${message}</ha-alert>` }] };
}

/** Section strategy: one section; `section: overview | history | all` (default all). */
function buildSection(hass, config) {
  const t = texts(hass);
  const name = (config && config.section) || "all";
  if (name !== "all" && !BUILDERS[name]) return errorSection(`${t.unknown_section}: ${name}`);
  const unit = pickUnits(hass, config)[0];
  if (!unit) return errorSection(t.no_unit);
  if (name !== "all") return BUILDERS[name](hass, unit, t) || { type: "grid", cards: [] };
  const cards = [];
  for (const n of SECTIONS) {
    const s = BUILDERS[n](hass, unit, t);
    if (s) cards.push(...(n === "overview" ? s.cards : s.cards.filter((c) => c.type !== "heading")));
  }
  return { type: "grid", cards };
}

function buildView(hass, config) {
  const t = texts(hass);
  const units = pickUnits(hass, config);
  if (!units.length) return { type: "sections", sections: [errorSection(t.no_unit)] };
  const wanted = (config && config.sections) || SECTIONS;
  const sections = [];
  for (const unit of units) {
    for (const name of wanted) {
      const s = BUILDERS[name] && BUILDERS[name](hass, unit, t);
      if (s) sections.push(s);
    }
  }
  return { type: "sections", max_columns: (config && config.max_columns) || 3, sections };
}

class ValloxSectionStrategy extends HTMLElement {
  static registryDependencies = ["entities", "devices"];
  static async generate(config, hass) { return buildSection(hass, config); }
}

class ValloxViewStrategy extends HTMLElement {
  static registryDependencies = ["entities", "devices"];
  static async generate(config, hass) { return buildView(hass, config); }
}

class ValloxDashboardStrategy extends HTMLElement {
  static registryDependencies = ["entities", "devices"];
  static async generate(config, hass) {
    const t = texts(hass);
    return {
      title: t.ventilation,
      views: [{
        title: t.ventilation, path: "ventilation", icon: "mdi:hvac",
        strategy: { ...(config || {}), type: "custom:vallox-ventilation" },
      }],
    };
  }
}

// Registration.
//
// Home Assistant's frontend replaces window.customElements with a scoped
// custom element registry polyfill. A module that runs before that (legacy
// es5 build, or a cold-cache race) would define its elements into a registry
// Home Assistant no longer looks at, which ends in "Timeout waiting for
// strategy element". So register into whatever registry is current now and
// keep checking until Home Assistant's own registry is in place and has ours.
const ELEMENTS = [
  ["ll-strategy-section-vallox-ventilation", ValloxSectionStrategy],
  ["ll-strategy-view-vallox-ventilation", ValloxViewStrategy],
  ["ll-strategy-dashboard-vallox-ventilation", ValloxDashboardStrategy],
];
const registerAll = () => {
  const registry = window.customElements;
  let ok = true;
  for (const [tag, cls] of ELEMENTS) {
    if (registry.get(tag)) continue;
    try {
      // A fresh subclass per registry: a constructor may only be defined once per registry.
      registry.define(tag, class extends cls {});
    } catch (err) {
      ok = false;
      console.warn(`vallox-dashboard: could not register ${tag}`, err);
    }
  }
  return ok && !!registry.get("home-assistant");
};
if (!registerAll()) {
  let tries = 0;
  const timer = setInterval(() => {
    if (registerAll() || ++tries >= 240) clearInterval(timer);
  }, 250);
  if (timer && typeof timer.unref === "function") timer.unref();
}

console.info(`%c VALLOX-DASHBOARD %c ${VALLOX_DASHBOARD_VERSION} `,
  "color:white;background:#0b6e4f;font-weight:700", "color:#0b6e4f;background:white");

// Exposed for tests / tooling.
window.valloxDashboard = { version: VALLOX_DASHBOARD_VERSION, buildSection, buildView, findUnits, SECTIONS };
