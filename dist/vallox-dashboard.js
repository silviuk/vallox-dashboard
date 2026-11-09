/*
 * Vallox Dashboard for Home Assistant
 * https://github.com/silviuk/vallox-dashboard
 *
 * Lovelace section, view and dashboard strategies that build a modern,
 * tile-based UI for Vallox ventilation units. Supported integrations:
 *   - vallox2mqtt (Vallox Digit SE / ValloPlus SE over RS485, kotope/valloxesp)
 *   - vallox (Home Assistant core, Vallox MV units over the network)
 * Built-in cards plus original inline SVG graphics. MIT licensed.
 */
const VALLOX_DASHBOARD_VERSION = "1.2.0";

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
    alarms: "Alarms", filter_warning: "Filter warning", error_relay: "Error relay",
    cell_freeze_alarm: "Cell freeze alarm", fault_code: "Fault code",
    alarm_alert: "The unit reports an alarm. Check the alarm tiles below.",
    boost_remaining: "Built-in boost time left", unit_setpoints: "Unit setpoints (read-only)",
    bypass_setpoint: "Bypass setpoint", preheat_setpoint: "Preheat setpoint", defrost_setpoint: "Defrost setpoint",
    defrost_hysteresis: "Defrost hysteresis", post_heating_target: "Post-heating target", maximum_fan_speed: "Maximum fan level",
    temperature_flow: "Temperature flow", shower_boost: "Shower boost", shower_timer: "Shower boost time left",
    shower_cancel: "Cancel shower boost", level: "Level", minutes: "min",
    auto_humidity: "Auto humidity boost", auto_humidity_enabled: "Enable humidity boost",
    auto_humidity_threshold: "Humidity threshold", auto_humidity_rise: "Humidity rise",
    auto_humidity_level: "Humidity boost level", auto_humidity_minutes: "Humidity boost duration",
    auto_humidity_cooldown: "Humidity boost cooldown",
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
    alarms: "Alarme", filter_warning: "Filterwarnung", error_relay: "Störmelderelais",
    cell_freeze_alarm: "Frostalarm am Tauscher", fault_code: "Fehlercode",
    alarm_alert: "Das Gerät meldet einen Alarm. Bitte die Alarmkacheln unten prüfen.",
    boost_remaining: "Geräte-Boost Restzeit", unit_setpoints: "Geräte-Sollwerte (nur Anzeige)",
    bypass_setpoint: "Bypass-Sollwert", preheat_setpoint: "Vorheiz-Sollwert", defrost_setpoint: "Abtau-Sollwert",
    defrost_hysteresis: "Abtau-Hysterese", post_heating_target: "Nachheiz-Sollwert", maximum_fan_speed: "Maximale Lüfterstufe",
    temperature_flow: "Temperaturfluss", shower_boost: "Dusch-Boost", shower_timer: "Dusch-Boost Restzeit",
    shower_cancel: "Dusch-Boost abbrechen", level: "Stufe", minutes: "Min.",
    auto_humidity: "Automatischer Feuchte-Boost", auto_humidity_enabled: "Feuchte-Boost aktivieren",
    auto_humidity_threshold: "Feuchteschwelle", auto_humidity_rise: "Feuchteanstieg",
    auto_humidity_level: "Feuchte-Boost Lüfterstufe", auto_humidity_minutes: "Feuchte-Boost Dauer",
    auto_humidity_cooldown: "Feuchte-Boost Sperrzeit",
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
  ["sensor", /fault_code$/, "fault_code"], ["sensor", /boost_remaining$/, "boost_remaining"],
  ["sensor", /bypass_setpoint$/, "bypass_setpoint"], ["sensor", /preheat_setpoint$/, "preheat_setpoint"],
  ["sensor", /defrost_setpoint$/, "defrost_setpoint"], ["sensor", /defrost_hysteresis$/, "defrost_hysteresis"],
  ["sensor", /post_heating_target$/, "post_heating_target"], ["sensor", /maximum_fan_speed$/, "maximum_fan_speed"],
  ["binary_sensor", /filter_warning$/, "filter_warning"], ["binary_sensor", /error_relay$/, "error_relay"],
  ["binary_sensor", /cell_freeze_alarm$/, "cell_freeze_alarm"],
  ["binary_sensor", /service_needed/, "service_needed"], ["binary_sensor", /motor_in$/, "motor_in"],
  ["binary_sensor", /motor_out$/, "motor_out"], ["binary_sensor", /summer_mode/, "summer_mode"],
  ["binary_sensor", /front_heating/, "front_heating"], ["binary_sensor", /post_heating/, "post_heating"],
  ["binary_sensor", /.*/, "status"], ["climate", /.*/, "climate"], ["switch", /.*/, "boost_switch"],
];

// Package helpers are not integration entities. Resolve only these known defaults;
// other installations can override them with entities (including null to suppress).
const PACKAGE_ENTITIES = {
  shower_boost: "script.vallox_shower_boost", shower_timer: "timer.vallox_shower_boost",
  shower_active: "input_boolean.vallox_shower_boost_active", shower_cancel: "script.vallox_shower_boost_cancel",
  auto_humidity_enabled: "input_boolean.vallox_auto_humidity_boost",
  auto_humidity_threshold: "input_number.vallox_auto_humidity_threshold",
  auto_humidity_rise: "input_number.vallox_auto_humidity_rise",
  auto_humidity_level: "input_number.vallox_auto_humidity_boost_level",
  auto_humidity_minutes: "input_number.vallox_auto_humidity_boost_minutes",
  auto_humidity_cooldown: "timer.vallox_auto_humidity_cooldown",
};
const ALARM_ROLES = ["filter_warning", "error_relay", "cell_freeze_alarm", "fault_code"];
const SETPOINT_ROLES = ["bypass_setpoint", "preheat_setpoint", "defrost_setpoint", "defrost_hysteresis", "post_heating_target", "maximum_fan_speed"];
const SHOWER_PRESETS = [{ minutes: 15, level: 6 }, { minutes: 15, level: 7 }, { minutes: 30, level: 6 }, { minutes: 30, level: 7 }];

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
  units = units.map((u, i) => {
    const e = { ...u.e };
    // The default package controls one unit: attach it only to the first selected unit.
    if (i === 0) for (const [role, id] of Object.entries(PACKAGE_ENTITIES)) if (exists(hass, id)) e[role] = id;
    return { ...u, e };
  });
  if (config.entities) {
    // Manual mapping (or overrides): {outdoor: "sensor.x", climate: "climate.y", ...}
    const base = units[0] || { deviceId: null, platform: "manual", name: "Vallox", e: {}, all: [] };
    const e = { ...base.e };
    if (!units.length) for (const [role, id] of Object.entries(PACKAGE_ENTITIES)) if (exists(hass, id)) e[role] = id;
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

function alarmBanner(hass, e, t) {
  const roles = ALARM_ROLES.filter((r) => exists(hass, e[r]));
  if (!roles.length) return null;
  return {
    type: "markdown", text_only: true, ...FULL,
    visibility: [{ condition: "or", conditions: roles.map((r) => r === "fault_code"
      ? { condition: "numeric_state", entity: e[r], above: 0 }
      : isOn(e[r])[0]) }],
    content: `<ha-alert alert-type="error">${t.alarm_alert}</ha-alert>`,
  };
}

function alarmCards(hass, e, t) {
  return group(t.alarms, "mdi:alert", ALARM_ROLES.map((r) =>
    tile(hass, e[r], t[r], { icon: "mdi:alert-circle-outline", color: "red" })));
}

function temperatureFlow(hass, e, t) {
  if (![e.outdoor, e.supply, e.extract, e.exhaust].every((id) => exists(hass, id))) return null;
  const temperature = (r) => `**${t[r]}** {{ states('${e[r]}') }} {{ state_attr('${e[r]}', 'unit_of_measurement') or '' }}`;
  const recovery = exists(hass, e.efficiency)
    ? `**${t.efficiency}: {{ states('${e.efficiency}') }} %**`
    : efficiencyCard(hass, e, t).content;
  return {
    type: "markdown", ...FULL,
    content: `### ${t.temperature_flow}\n${temperature("outdoor")} → ${temperature("supply")}\n\n${recovery}\n\n${temperature("extract")} → ${temperature("exhaust")}`,
  };
}

function showerCards(hass, e, t, config) {
  if (!exists(hass, e.shower_boost)) return [];
  const presets = Array.isArray(config.shower_boost_presets) ? config.shower_boost_presets : SHOWER_PRESETS;
  const cards = presets.filter((p) => p && Number.isInteger(p.level) && p.level >= 1 && p.level <= 8
    && Number.isInteger(p.minutes) && p.minutes > 0 && p.minutes <= 120).map((p) => ({
    type: "button", entity: e.shower_boost, name: `${p.minutes} ${t.minutes} · ${t.level} ${p.level}`,
    icon: "mdi:shower-head", show_state: false, ...HALF,
    tap_action: { action: "perform-action", perform_action: e.shower_boost, data: { level: p.level, minutes: p.minutes } },
    hold_action: { action: "none" },
  }));
  if ([e.shower_timer, e.shower_active, e.shower_cancel].every((id) => exists(hass, id))) {
    cards.push(tile(hass, e.shower_timer, t.shower_timer, { visibility: isOn(e.shower_active), icon: "mdi:timer-sand" }));
    cards.push({
      type: "button", entity: e.shower_cancel, name: t.shower_cancel, icon: "mdi:cancel", ...HALF,
      visibility: isOn(e.shower_active),
      tap_action: { action: "perform-action", perform_action: e.shower_cancel }, hold_action: { action: "none" },
    });
  }
  return group(t.shower_boost, "mdi:shower-head", cards);
}

function humidityCards(hass, e, t) {
  if (!exists(hass, e.auto_humidity_enabled)) return [];
  return group(t.auto_humidity, "mdi:water-percent", [
    tile(hass, e.auto_humidity_enabled, t.auto_humidity_enabled),
    ...["auto_humidity_threshold", "auto_humidity_rise", "auto_humidity_level", "auto_humidity_minutes"].map((r) =>
      tile(hass, e[r], t[r], { features: [{ type: "numeric-input", style: "buttons" }] })),
    tile(hass, e.auto_humidity_cooldown, t.auto_humidity_cooldown, { icon: "mdi:timer-lock-outline" }),
  ]);
}

function controlCards(hass, u, t, config) {
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
  if (!config.show || config.show.boost_remaining !== false) {
    cards.push(tile(hass, e.boost_remaining, t.boost_remaining, { icon: "mdi:timer-sand" }));
  }
  cards.push(tile(hass, e.switch_type, t.switch_type, { icon: "mdi:gesture-tap-button" }));
  return cards;
}

// Original MIT artwork: abstract geometry, no embedded or traced reference artwork.
const GRAPHIC_TEXT = {
  en: { controller: "Digital controller", exchanger: "Heat exchanger", power: "Power",
    heating: "Heating mode", filter: "Service", alarm: "Alarm", previous: "Previous readout",
    next: "Next readout", increase: "Increase fan level", decrease: "Decrease fan level",
    readout: "Readout", bypass: "Bypass", filter_f7: "Outdoor filter · F7", active: "Active",
    action_error: "Action failed", core_fan: "Fan speed", freeze: "Cell freeze",
    boost: "Boost", bypass_open: "Bypass open", bypass_closed: "Bypass closed" },
  de: { controller: "Digitalregler", exchanger: "Wärmetauscher", power: "Betrieb",
    heating: "Heizbetrieb", filter: "Wartung", alarm: "Alarm", previous: "Vorherige Anzeige",
    next: "Nächste Anzeige", increase: "Lüfterstufe erhöhen", decrease: "Lüfterstufe senken",
    readout: "Anzeige", bypass: "Bypass", filter_f7: "Außenfilter · F7", active: "Aktiv",
    action_error: "Aktion fehlgeschlagen", core_fan: "Lüfterleistung", freeze: "Tauscherfrost",
    boost: "Boost", bypass_open: "Bypass offen", bypass_closed: "Bypass geschlossen" },
};
const escapeGraphic = (value) => String(value).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const graphicNumber = (value) => value !== null && value !== undefined && String(value).trim() !== ""
  && Number.isFinite(Number(value)) ? Number(value) : null;
const graphicAvailable = (state) => !!state && !["unknown", "unavailable"].includes(state.state);

function graphicModel(hass, config = {}, readout = 0) {
  const unit = pickUnits(hass, config)[0] || { name: config.name || "Vallox", e: {} };
  const e = Object.fromEntries(Object.entries(unit.e).filter(([, id]) => exists(hass, id)));
  const state = (r) => hass.states[e[r]];
  const value = (r) => graphicAvailable(state(r)) ? state(r).state : null;
  const number = (r) => graphicNumber(value(r));
  const on = (r) => value(r) === "on";
  const flag = (r) => value(r) === null ? null : on(r);
  const anyFlag = (roles) => roles.some(on) ? true : roles.some((r) => e[r] && value(r) === null) ? null : false;
  const a = state("climate")?.attributes || {};
  const t = texts(hass);
  const lang = t === TEXT.de ? "de" : "en";
  const g = GRAPHIC_TEXT[lang];
  let max = Math.max(1, Math.min(8, Math.floor(number("maximum_fan_speed") ?? 8)));
  const modes = (Array.isArray(a.fan_modes) ? a.fan_modes : []).filter((v) =>
    typeof v === "string" && /^[1-8]$/.test(v) && Number(v) <= max).sort((x, y) => Number(x) - Number(y));
  if (modes.length) max = Number(modes[modes.length - 1]);
  const level = graphicAvailable(state("climate")) ? graphicNumber(a.fan_mode) : number("fan_speed");
  const powerRole = e.status ? "status" : e.climate ? "climate" : e.fan ? "fan" : null;
  const power = powerRole && value(powerRole) !== null ? !["off", "0"].includes(value(powerRole)) : null;
  const alarm = ALARM_ROLES.some((r) => r === "fault_code" ? number(r) > 0 : on(r));
  let efficiency = number("efficiency");
  if (!e.efficiency && ["outdoor", "extract", "exhaust"].every((r) => number(r) !== null)
      && number("extract") - number("outdoor") >= 4) {
    efficiency = Math.max(0, Math.min(100, (number("extract") - number("exhaust")) /
      (number("extract") - number("outdoor")) * 100));
  }
  const formatted = (r, suffix = "") => number(r) === null ? "—" : `${Math.round(number(r) * 10) / 10}${suffix}`;
  const readouts = ["outdoor", "supply", "extract", "exhaust"].filter((r) => e[r])
    .map((r) => [t[r], formatted(r, " °C")]);
  if (e.efficiency || [e.outdoor, e.extract, e.exhaust].every(Boolean)) {
    readouts.push([e.efficiency ? t.efficiency : t.efficiency_est, efficiency === null ? "—" : `${Math.round(efficiency)} %`]);
  }
  if (e.boost_remaining && config.show?.boost_remaining !== false) readouts.push([t.boost_remaining, formatted("boost_remaining", ` ${t.minutes}`)]);
  if (e.fault_code && config.show?.alarms !== false) readouts.push([t.fault_code, formatted("fault_code")]);
  const selected = readouts.length ? ((readout % readouts.length) + readouts.length) % readouts.length : 0;
  const presets = Array.isArray(config.shower_boost_presets) ? config.shower_boost_presets : SHOWER_PRESETS;
  const preset = presets.find((p) => p && Number.isInteger(p.level) && p.level >= 1 && p.level <= 8
    && Number.isInteger(p.minutes) && p.minutes > 0 && p.minutes <= 120);
  const boost = on("boost_switch") || number("boost_remaining") > 0;
  const usableClimate = graphicAvailable(state("climate"));
  return { unit, e, t, g, config, value, number, on, flag, anyFlag, formatted, max, modes, level, power, alarm, efficiency,
    readouts, selected, preset, boost, hass,
    fanPercentage: graphicAvailable(state("fan")) && graphicNumber(state("fan")?.attributes?.percentage) !== null
      ? `${graphicNumber(state("fan").attributes.percentage)} %` : null,
    canFan: usableClimate && level !== null && modes.length > 0,
    canHeat: usableClimate && ["heat", "fan_only"].includes(value("climate"))
      && ["heat", "fan_only"].every((v) => a.hvac_modes?.includes(v)),
    running: (r) => power === true && (e[r] ? on(r) : (level > 0 || value("fan") === "on")),
    duration: `${Math.max(0.35, 2.8 / Math.max(1, level || 1))}s`,
  };
}

const GRAPHIC_CSS = `
  :host { display:block; font-family:var(--primary-font-family, inherit); color:var(--primary-text-color,#172d3b);
    --line:var(--divider-color,#cfdae0); --muted:var(--secondary-text-color,#5b707e);
    --surface:var(--ha-card-background,var(--card-background-color,#fff));
    --active:var(--state-active-color,#e69b28); --cold:#369ac7; --warm:#df8054; }
  ha-card { display:block; background:var(--surface); border-radius:20px; overflow:hidden;
    border:1px solid var(--line); box-shadow:none; }
  svg { display:block; width:100%; height:auto; font-family:inherit; }
  text { fill:currentColor; font-size:20px; } .muted { fill:var(--muted); font-size:20px; }
  .body,.button { fill:var(--surface); stroke:var(--line); stroke-width:2; }
  .strip { fill:var(--line); opacity:.35; } .lcd { fill:var(--line); fill-opacity:.22; stroke:var(--line); }
  .big { font-size:64px; font-weight:600; letter-spacing:-3px; }
  .title { font-size:24px; font-weight:600; } .value { font-size:28px; font-weight:600; }
  .control-symbol { stroke:currentColor; stroke-width:4; stroke-linecap:round; fill:none; pointer-events:none; }
  .direction { stroke:currentColor; stroke-width:2; fill:none; }
  .led { fill:var(--line); stroke:var(--muted); } .lit { fill:var(--active); stroke:var(--active); }
  .warning { fill:var(--error-color,#db625a); } .button { cursor:pointer; }
  [role=button]:focus .button { stroke:var(--primary-color,#369ac7); stroke-width:3; }
  [aria-disabled=true] { opacity:.65; cursor:default; } [role=button] text { pointer-events:none; }
  .pipe { fill:none; stroke-width:13; stroke-linecap:round; stroke-linejoin:round; opacity:.18; }
  .flow { fill:none; stroke-width:3; stroke-dasharray:5 13; stroke-linecap:round; animation:flow var(--speed) linear infinite; }
  .cold { stroke:var(--cold); } .warm { stroke:var(--warm); }
  .stopped { animation:none!important; opacity:.28; } .spin { animation:spin var(--speed) linear infinite; }
  .heater { stroke:var(--line); fill:none; stroke-width:4; } .hot { stroke:var(--active); }
  .cell { fill:var(--surface); stroke:var(--line); stroke-width:2; }
  .fin { stroke:var(--line); stroke-width:2; opacity:.7; } .badge { fill:var(--line); fill-opacity:.35; }
  .error { padding:0 20px 12px; color:var(--error-color,#db625a); font-size:12px; }
  @keyframes flow { to { stroke-dashoffset:-36; } } @keyframes spin { to { transform:rotate(360deg); } }
  @media(prefers-reduced-motion:reduce) { .flow,.spin { animation:none!important; } }
`;
const svgText = (x, y, text, cls = "", anchor = "start") =>
  `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${escapeGraphic(text)}</text>`;
function graphicButton(x, y, w, h, label, action, disabled = false, glyph = label) {
  return `<g role="button" tabindex="${disabled ? -1 : 0}" aria-label="${escapeGraphic(label)}" aria-disabled="${disabled}" data-action="${action}">
    <rect class="button" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>
    ${["increase", "decrease"].includes(action)
      ? `<path class="control-symbol" d="M${x + w / 2 - 16} ${y + h / 2}h32${action === "increase" ? `M${x + w / 2} ${y + h / 2 - 16}v32` : ""}"/>`
      : svgText(x + w / 2, y + h / 2 + 7, glyph, "", "middle")}</g>`;
}
function graphicSvg(title, content, duration, height = 760) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 ${height}" role="group"
    aria-label="${escapeGraphic(title)}" style="--speed:${duration}"><title>${escapeGraphic(title)}</title>${content}</svg>`;
}
function renderControllerSvg(m) {
  const { e, t, g } = m;
  const leds = [
    [m.power !== null || e.status || e.climate || e.fan, g.power, m.power],
    [e.post_heating, t.post_heating, m.flag("post_heating")],
    [e.front_heating, t.front_heating, m.flag("front_heating")],
    [e.summer_mode, t.summer_mode, m.flag("summer_mode")],
    [e.service_needed || e.filter_warning, g.filter, m.anyFlag(["service_needed", "filter_warning"])],
    [m.config.show?.alarms !== false && ALARM_ROLES.some((r) => e[r]), g.alarm,
      m.alarm ? true : ALARM_ROLES.some((r) => e[r] && m.value(r) === null) ? null : false],
    [e.co2, t.co2, m.number("co2") !== null ? true : null],
    [e.humidity || e.humidity_2, t.humidity, m.number("humidity") !== null || m.number("humidity_2") !== null ? true : null],
  ].filter(([present]) => present);
  let content = `<rect class="body" x="24" y="24" width="552" height="712" rx="28"/>
    <path class="strip" d="M52 24H548Q576 24 576 52V88H24V52Q24 24 52 24Z"/>`
    + svgText(48, 63, m.unit.name, "title");
  content += leds.map(([, label, active], i) => {
    const x = 56 + (i % 3) * 168, y = 120 + Math.floor(i / 3) * 38;
    return `<circle cx="${x}" cy="${y - 6}" r="6" class="led ${active ? "lit" : ""}"><title>${escapeGraphic(label)}</title></circle>`
      + svgText(x + 14, y, active === null ? `${label} —` : label, "muted");
  }).join("");
  content += `<rect class="lcd" x="48" y="222" width="504" height="196" rx="18"/>`
    + svgText(72, 252, e.climate ? t.fan_speed : g.core_fan, "muted")
    + svgText(72, 322, e.climate ? `${m.level ?? "—"} / ${m.max}` :
      (m.fanPercentage ?? m.formatted("fan_speed", " %")), "big");
  const readout = m.readouts[m.selected];
  if (readout) content += svgText(72, 362, readout[0], "muted") + svgText(72, 398, readout[1], "value");
  if (m.readouts.length > 1) content += graphicButton(476, 336, 52, 32, g.previous, "previous", false, "▲")
    + graphicButton(476, 376, 52, 32, g.next, "next", false, "▼");
  if (m.canFan) content += graphicButton(48, 434, 240, 60, g.decrease, "decrease", !m.modes.some((v) => Number(v) < m.level), "−")
    + graphicButton(312, 434, 240, 60, g.increase, "increase", !m.modes.some((v) => Number(v) > m.level), "+");
  const actions = [];
  if (e.boost_switch) actions.push([m.boost ? `${g.boost} · ${e.boost_remaining && m.config.show?.boost_remaining !== false ? m.formatted("boost_remaining", ` ${t.minutes}`) : g.active}` : t.boost_switch, "boost",
    m.boost || !graphicAvailable(m.hass?.states[e.boost_switch])]);
  if (m.canHeat) actions.push([g.heating, "heat", false]);
  if (e.shower_boost && m.preset && m.config.show?.shower_boost !== false) actions.push([t.shower_boost, "shower",
    !graphicAvailable(m.hass.states[e.shower_boost])]);
  content += actions.map(([label, action, disabled], i) => graphicButton(48, 510 + i * 58, 504, 48, label, action, disabled)).join("");
  if (m.boost && e.boost_remaining && m.config.show?.boost_remaining !== false) {
    content += svgText(300, 714, `${t.boost_remaining}: ${m.formatted("boost_remaining", ` ${t.minutes}`)}`, "muted", "middle");
  }
  return graphicSvg(g.controller, content, m.duration);
}

function renderExchangerSvg(m) {
  const { e, t, g } = m;
  const bypass = m.on("summer_mode");
  let content = svgText(32, 40, g.exchanger, "title") + svgText(32, 72, m.unit.name, "muted")
    + '<rect class="body" x="30" y="178" width="540" height="456" rx="24"/>'
    + '<path class="cell" d="M300 234L390 300V410L300 476L210 410V300Z"/>';
  for (let y = 300; y <= 410; y += 14) content += `<path class="fin" d="M220 ${y}H380"/>`;
  // Continuous diagonals cross inside the cell, beneath the recovery label.
  const ducts = [
    ["outdoor", 520, bypass ? "M520 178V550H180V220H380V178" : "M520 178V550H420L300 354", "cold", "motor_in", true],
    ["supply", 380, bypass ? "M380 220H450V198H380V178" : "M300 354L450 290V198H380V178", bypass ? "cold" : "warm", "motor_in", false],
    ["extract", 220, "M220 178V250L300 354", "warm", "motor_out", true],
    ["exhaust", 80, "M300 354L180 510H80V178", "cold", "motor_out", false],
  ];
  content += ducts.filter(([r]) => e[r]).map(([r, x, path, color, motor, incoming]) =>
    svgText(x, 116, t[r], "muted", "middle") + svgText(x, 150, m.formatted(r, " °C"), "value", "middle")
    + `<path class="direction" aria-label="${incoming ? "↓" : "↑"}" d="${incoming ? `M${x + 40} 132v22m-5 -5l5 5 5 -5` : `M${x + 40} 154v-22m-5 5l5 -5 5 5`}"/>
      <path class="pipe ${color}" d="${path}"/>
      <path data-stream="${r}" class="flow ${color} ${m.running(motor) ? "" : "stopped"}" d="${path}"/>
      <rect class="body" x="${x - 19}" y="168" width="38" height="22" rx="5"/>`).join("");
  if (e.efficiency || [e.outdoor, e.extract, e.exhaust].every(Boolean)) {
    content += '<rect class="cell" x="194" y="270" width="212" height="64" rx="10"/>'
      + svgText(300, 295, t.efficiency, "muted", "middle")
      + svgText(300, 323, m.efficiency === null ? "—" : `${Math.round(m.efficiency)} %`, "value", "middle");
  }
  const fan = (role, x, y) => !e[role] ? "" : `<g transform="translate(${x} ${y})">
    <circle class="body" r="27"/><g data-motor="${role}" class="${m.running(role) ? "spin" : "stopped"}">
    <path fill="var(--muted)" d="M0 0C-24-28 22-30 4-4C40-9 24 30 2 5C-10 40-38 6-5 0Z"/>
    </g><circle r="4" fill="var(--surface)"/></g>`;
  content += fan("motor_out", 80, 440) + fan("motor_in", bypass ? 520 : 450, bypass ? 320 : 260);
  const heater = (role, x, y, labelX, labelY, anchor) => !e[role] ? "" : `<path data-heater="${role}" class="heater ${m.on(role) ? "hot" : ""}"
    d="M${x - 24} ${y}l8 -12 8 24 8 -24 8 24 8 -24 8 12"/>`
    + svgText(labelX, labelY, m.value(role) === null ? `${t[role]} —` : t[role], "muted", anchor);
  content += heater("front_heating", 476, 550, 540, 602, "end")
    + heater("post_heating", 415, 198, 300, 204, "middle");
  if (e.outdoor) content += '<path class="fin" d="M496 430L544 464M496 438L544 472M496 446L544 480"/>'
    + svgText(360, 578, g.filter_f7, "muted", "middle");
  if (e.summer_mode) {
    content += `<g data-bypass="${bypass ? "open" : "closed"}">
      <circle class="led" cx="180" cy="550" r="5"/>
      <path class="heater ${bypass ? "hot" : ""}" d="${bypass ? "M180 550L210 520" : "M180 550V510"}"/></g>`
      + svgText(60, 602, m.value("summer_mode") === null ? `${g.bypass} —` : bypass ? g.bypass_open : g.bypass_closed, "muted");
  }
  const badges = [];
  if (e.climate || e.fan_speed || e.fan) badges.push(`${t.fan_speed}: ${e.climate ? m.level ?? "—" : m.fanPercentage ?? m.formatted("fan_speed", " %")}`);
  if (m.boost && m.config.show?.boost_remaining !== false) badges.push(`${g.boost} · ${e.boost_remaining ? m.formatted("boost_remaining", ` ${t.minutes}`) : g.active}`);
  if (m.on("cell_freeze_alarm") && m.config.show?.alarms !== false) badges.push(g.freeze);
  if (m.alarm && m.config.show?.alarms !== false) badges.push(g.alarm);
  content += badges.map((label, i) => {
    const x = 30 + i % 2 * 276, y = 652 + Math.floor(i / 2) * 48;
    return `<rect class="badge" x="${x}" y="${y}" width="264" height="38" rx="19"/>`
      + svgText(x + 132, y + 26, label, "muted", "middle");
  }).join("");
  if (m.alarm && m.config.show?.alarms !== false) content += '<circle class="warning" cx="550" cy="195" r="8"/>';
  return graphicSvg(g.exchanger, content, m.duration);
}

class ValloxGraphicCard extends HTMLElement {
  static getStubConfig() { return { view: "controller" }; }
  setConfig(config) {
    if (!config || (config.view && !["controller", "exchanger"].includes(config.view))) throw new Error("view: controller | exchanger");
    this._config = { ...config, view: config.view || "controller" };
    this._readout = 0;
    this._signature = null;
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener("click", (event) => this._activate(event));
      this.shadowRoot.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!event.repeat) this._activate(event); }
      });
    }
    if (this._hass) this.hass = this._hass;
  }
  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const m = this._model();
    const signature = JSON.stringify([hass.locale, hass.language, m.unit.name, m.e,
      Object.values(m.e).map((id) => hass.states[id])]);
    if (signature === this._signature) return;
    this._signature = signature;
    this._render(m);
  }
  getCardSize() { return 8; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 8 }; }
  _model() {
    const m = graphicModel(this._hass, this._config, this._readout);
    return m;
  }
  _render(m = this._model()) {
    const focused = this.shadowRoot.activeElement?.getAttribute("data-action");
    this.shadowRoot.innerHTML = `<style>${GRAPHIC_CSS}</style><ha-card>${
      this._config.view === "controller" ? renderControllerSvg(m) : renderExchangerSvg(m)
    }<div class="error" role="status">${this._error ? escapeGraphic(m.g.action_error) : ""}</div></ha-card>`;
    if (focused) this.shadowRoot.querySelector(`[data-action="${focused}"]`)?.focus();
  }
  _activate(event) {
    const target = event.target.closest?.("[data-action]");
    if (this._config.view !== "controller" || !target || target.getAttribute("aria-disabled") === "true") return;
    this._action(target.getAttribute("data-action"));
  }
  async _action(action) {
    const m = this._model(), e = m.e;
    if (["next", "previous"].includes(action)) {
      this._readout += action === "next" ? 1 : -1; this._render(); return;
    }
    let call;
    if (m.canFan && ["increase", "decrease"].includes(action)) {
      const candidates = m.modes.filter((v) => action === "increase" ? Number(v) > m.level : Number(v) < m.level);
      const mode = action === "increase" ? candidates[0] : candidates[candidates.length - 1];
      if (mode) call = ["climate", "set_fan_mode", { entity_id: e.climate, fan_mode: mode }];
    }
    if (action === "boost" && e.boost_switch && !m.boost && graphicAvailable(this._hass.states[e.boost_switch])) {
      call = ["switch", "turn_on", { entity_id: e.boost_switch }];
    }
    if (action === "heat" && m.canHeat) call = ["climate", "set_hvac_mode",
      { entity_id: e.climate, hvac_mode: m.value("climate") === "heat" ? "fan_only" : "heat" }];
    if (action === "shower" && e.shower_boost && m.preset && m.config.show?.shower_boost !== false
        && graphicAvailable(this._hass.states[e.shower_boost])) {
      call = ["script", e.shower_boost.split(".")[1], { level: m.preset.level, minutes: m.preset.minutes }];
    }
    if (call) {
      try { await this._hass.callService(...call); this._error = false; }
      catch { this._error = true; }
      this._render();
    }
  }
}

function graphicOverview(hass, u, t, config) {
  // Start from the established groups, removing only the duplicates below.
  const base = BUILDERS.overview(hass, u, t, { ...config, style: "tiles" });
  const show = config.show || {};
  const duplicate = ["climate", "fan_speed", "boost_switch", "boost_remaining", "outdoor", "supply", "extract", "exhaust",
    "efficiency", "motor_in", "motor_out", "front_heating", "post_heating", "summer_mode"];
  const ids = new Set(duplicate.map((r) => u.e[r]).filter(Boolean));
  let cards = base.cards.filter((c) => !(c.entity && ids.has(c.entity)) &&
    !(c.content && (c.content.includes(t.temperature_flow) || c.content.includes(t.efficiency))));
  cards = cards.filter((c, i) => c.heading_style !== "subtitle" ||
    (cards[i + 1] && cards[i + 1].type !== "heading"));
  const graphics = ["controller", "exchanger"].filter((view) => show[view] !== false).map((view) => ({
    type: "custom:vallox-graphic-card", view, ...HALF,
    device_id: u.deviceId, name: u.name,
    entities: { ...Object.fromEntries(Object.keys(PACKAGE_ENTITIES).map((r) => [r, null])), ...u.e }, show: { ...show },
    ...(config.shower_boost_presets ? { shower_boost_presets: config.shower_boost_presets } : {}),
  }));
  return section([cards[0], ...graphics, ...cards.slice(1)]);
}

const BUILDERS = {
  overview(hass, u, t, config = {}) {
    config = config || {};
    if (config.style === "graphic") return graphicOverview(hass, u, t, config);
    const e = u.e;
    const show = config.show || {};
    // Preserve 1.0 output on older units. The flow can also be explicitly enabled.
    const flow = show.temperature_flow === true || (show.temperature_flow !== false
      && [...ALARM_ROLES, ...SETPOINT_ROLES, "boost_remaining"].some((r) => exists(hass, e[r])));
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
      show.alarms !== false ? alarmBanner(hass, e, t) : null,
      ...controlCards(hass, u, t, config),
      flow ? temperatureFlow(hass, e, t) : null,
      ...(show.shower_boost !== false ? showerCards(hass, e, t, config) : []),
      ...(show.auto_humidity !== false ? humidityCards(hass, e, t) : []),
      ...(show.alarms !== false ? alarmCards(hass, e, t) : []),
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
      ...(show.unit_setpoints !== false ? group(t.unit_setpoints, "mdi:thermometer-lines",
        SETPOINT_ROLES.map((r) => tile(hass, e[r], t[r], { icon: "mdi:tune", tap_action: { action: "more-info" } }))) : []),
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
  if (name !== "all") return BUILDERS[name](hass, unit, t, config) || { type: "grid", cards: [] };
  const cards = [];
  for (const n of SECTIONS) {
    const s = BUILDERS[n](hass, unit, t, config);
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
      const s = BUILDERS[name] && BUILDERS[name](hass, unit, t, config);
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
  ["vallox-graphic-card", ValloxGraphicCard],
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
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "vallox-graphic-card")) window.customCards.push({
  type: "vallox-graphic-card", name: "Vallox graphic", description: "Original digital controller / heat exchanger · Digitalregler / Wärmetauscher",
  preview: true,
});
window.valloxDashboard = { version: VALLOX_DASHBOARD_VERSION, buildSection, buildView, findUnits, SECTIONS,
  graphicModel, renderControllerSvg, renderExchangerSvg };
