import fs from "node:fs";

export async function testGraphic({ api, defined, hass, roles, check, context, vm }) {
  const clone = () => structuredClone(hass);
  const model = (h = hass, config = {}) => api.graphicModel(h, config);
  const render = (view, h = hass, config = {}) => api[view === "controller" ? "renderControllerSvg" : "renderExchangerSvg"](model(h, config));
  for (const builder of [api.buildSection, api.buildView]) {
    const result = builder(hass, { style: "graphic" });
    const cards = result.cards || result.sections[0].cards;
    check(cards[1].view === "controller" && cards[2].view === "exchanger"
      && cards.slice(1, 3).every((c) => c.type === "custom:vallox-graphic-card"), builder.name + ": graphics lead overview");
    check(!cards.some((c) => c.entity === roles.climate || c.entity === roles.outdoor || c.entity === roles.motor_in),
      builder.name + ": duplicate tiles removed");
    check(cards.some((c) => c.entity === roles.fault_code) && cards.some((c) => c.entity === roles.bypass_setpoint)
      && cards.some((c) => c.entity === roles.shower_boost), builder.name + ": alarm, setpoint and package groups retained");
    for (const view of ["controller", "exchanger"]) {
      const hidden = builder(hass, { style: "graphic", show: { [view]: false } });
      check(!JSON.stringify(hidden).includes('"view":"' + view + '"'), builder.name + ": show." + view);
    }
  }
  const dash = await defined["ll-strategy-dashboard-vallox-ventilation"].generate({ style: "graphic", show: { controller: false } }, hass);
  check(dash.views[0].strategy.style === "graphic" && dash.views[0].strategy.show.controller === false, "dashboard propagates graphic config");
  const core = JSON.parse(fs.readFileSync(new URL("fixture_core.json", import.meta.url)));
  const coreCards = api.buildSection(core, { style: "graphic" }).cards;
  check(coreCards.some((c) => c.entity === "fan.vallox") && !render("controller", core).includes('data-action="increase"'),
    "core retains fan/profile tiles and hides discrete level actions");
  const multiple = clone();
  multiple.devices.second = { name: "Z second" };
  multiple.entities["climate.second"] = { entity_id: "climate.second", device_id: "second", platform: "vallox2mqtt" };
  multiple.states["climate.second"] = structuredClone(hass.states[roles.climate]);
  const secondCard = api.buildView(multiple, { style: "graphic" }).sections.flatMap((s) => s.cards)
    .find((c) => c.view === "controller" && c.device_id === "second");
  check(!api.graphicModel(multiple, secondCard).e.shower_boost, "second unit cannot acquire first unit's package through card rediscovery");
  for (const option of ["alarms", "boost_remaining", "shower_boost"]) {
    const output = render("controller", hass, { show: { [option]: false } });
    check(!output.includes(option === "alarms" ? "Fault code" : option === "boost_remaining" ? "Built-in boost time left" : 'data-action="shower"'),
      "graphic honors show." + option);
  }
  for (const view of ["controller", "exchanger"]) {
    const svg = render(view);
    check(svg.startsWith("<svg ") && svg.includes("</svg>") && !svg.includes("<image"), view + ": original inline SVG");
    const missing = render(view, hass, { entities: { co2: null, humidity: null, front_heating: null, motor_in: null, summer_mode: null } });
    check(!missing.includes("CO₂") && !missing.includes("Pre-heating") && !missing.includes('data-motor="motor_in"')
      && !missing.includes("Summer mode"), view + ": missing optional roles omitted");
    const escaped = render(view, hass, { name: '<img onerror="boom">&\'' });
    check(!escaped.includes("<img") && escaped.includes("&lt;img") && escaped.includes("&amp;") && escaped.includes("&quot;"), view + ": name escaped");
    const unavailable = clone(); unavailable.states[roles.outdoor].state = "unavailable";
    check(render(view, unavailable).includes("—") && !render(view, unavailable).includes("NaN"), view + ": unavailable numeric states use dash");
  }
  check(model().efficiency === 60, "guarded extract-side estimate");
  const lowDelta = clone(); lowDelta.states[roles.extract].state = "8";
  check(model(lowDelta).efficiency === null, "estimate suppressed below 4 K");
  const measured = clone(); measured.states["sensor.recovery"] = { state: "82", attributes: {} };
  check(model(measured, { entities: { efficiency: "sensor.recovery" } }).efficiency === 82, "measured efficiency wins");
  measured.states["sensor.recovery"].state = "unavailable";
  check(model(measured, { entities: { efficiency: "sensor.recovery" } }).efficiency === null, "unavailable measured efficiency stays dash");
  const stopped = clone(); stopped.states[roles.status].state = "off";
  check(!render("exchanger", stopped).includes('class="spin"') && !model(stopped).running("motor_in"), "power off stops fans and flows");
  stopped.states[roles.status].state = "on"; stopped.states[roles.motor_in].state = "off";
  check(!model(stopped).running("motor_in") && model(stopped).running("motor_out"), "each motor controls its own flow");
  const bypass = clone(); bypass.states[roles.summer_mode].state = "on"; bypass.states[roles.cell_freeze_alarm].state = "on";
  check(render("exchanger", bypass).includes('data-bypass="open"') && render("exchanger", bypass).includes("Cell freeze"), "bypass and freeze alarm highlights");
  const texts = JSON.parse(vm.runInContext("JSON.stringify(GRAPHIC_TEXT)", context));
  check(JSON.stringify(Object.keys(texts.en).sort()) === JSON.stringify(Object.keys(texts.de).sort())
    && Object.values(texts.de).every(Boolean), "graphic EN/DE label parity");
  check(render("controller", { ...hass, locale: { language: "de" } }).includes("Digitalregler")
    && render("exchanger", { ...hass, locale: { language: "de" } }).includes("Wärmetauscher"), "graphic German labels");
  const Card = defined["vallox-graphic-card"], card = new Card();
  let renders = 0, html = "", calls = [];
  const listeners = {};
  card.attachShadow = () => {
    card.shadowRoot = { addEventListener: (name, fn) => { listeners[name] = fn; }, querySelector: () => null,
      set innerHTML(value) { renders++; html = value; }, get innerHTML() { return html; } };
  };
  const live = clone(); live.callService = async (...args) => { calls.push(args); };
  card.setConfig({ view: "controller" }); card.hass = live;
  check(calls.length === 0 && html.includes("<ha-card>") && html.includes("<svg"), "card mounts shadow SVG without service calls");
  card.hass = { ...live, states: { ...live.states, "sensor.unrelated": { state: "5" } } };
  check(renders === 1, "unrelated entity changes do not render");
  const activate = (action, keyboard = false, disabled = false) => {
    const target = { closest() { return this; }, getAttribute: (name) => name === "aria-disabled" ? String(disabled) : action };
    listeners[keyboard ? "keydown" : "click"]({ target, key: "Enter", preventDefault() {} });
  };
  activate("next"); activate("previous", true);
  check(calls.length === 0 && card._readout === 0, "display selection is local (click and keyboard)");
  live.states[roles.climate].attributes.fan_mode = "3"; card.hass = live;
  activate("increase");
  check(JSON.stringify(calls.pop()) === JSON.stringify(["climate", "set_fan_mode", { entity_id: roles.climate, fan_mode: "4" }]), "fan + calls string mode 4");
  activate("decrease", true);
  check(calls.pop()?.[2].fan_mode === "2", "fan minus keyboard calls string mode 2");
  live.states[roles.climate].attributes.fan_mode = "1"; card.hass = live; await card._action("decrease");
  check(calls.length === 0, "fan clamps at 1");
  live.states[roles.maximum_fan_speed].state = "5"; live.states[roles.climate].attributes.fan_mode = "5"; card.hass = live;
  await card._action("increase"); check(calls.length === 0, "fan clamps at mapped maximum");
  live.states[roles.climate].attributes.fan_modes = ["1", "3", "5"]; live.states[roles.climate].attributes.fan_mode = "3"; card.hass = live;
  await card._action("increase"); check(calls.pop()?.[2].fan_mode === "5", "fan respects sparse advertised modes");
  await card._action("boost");
  check(JSON.stringify(calls.pop()) === JSON.stringify(["switch", "turn_on", { entity_id: roles.boost_switch }]), "boost only turns on");
  live.states[roles.boost_remaining].state = "12"; card.hass = live; await card._action("boost");
  check(calls.length === 0 && html.includes("12 min") && html.includes("aria-disabled=\"true\""), "active boost disabled with countdown");
  live.states[roles.climate].state = "fan_only"; card.hass = live; await card._action("heat");
  check(calls.pop()?.[2].hvac_mode === "heat", "heat toggle from fan_only");
  live.states[roles.climate].state = "heat"; card.hass = live; await card._action("heat");
  check(calls.pop()?.[2].hvac_mode === "fan_only", "heat toggle back to fan_only");
  live.states[roles.climate].attributes.hvac_modes = ["fan_only"]; card.hass = live; await card._action("heat");
  check(calls.length === 0, "unsupported heat mode cannot be called");
  await card._action("shower");
  check(JSON.stringify(calls.pop()) === JSON.stringify(["script", roles.shower_boost.split(".")[1], { level: 6, minutes: 15 }]), "shower calls first preset");
  activate("increase", false, true); await card._action("power");
  check(calls.length === 0, "disabled controls and power LED never call services");
  live.states[roles.climate].state = "unavailable"; card.hass = live; await card._action("increase");
  check(calls.length === 0, "unavailable climate cannot write");
  card.setConfig({ view: "controller", shower_boost_presets: [{ level: 7, minutes: 20 }] });
  await card._action("shower");
  check(calls.pop()?.[2].minutes === 20, "direct card honors first custom shower preset");
  live.callService = async () => { throw new Error("offline"); };
  await card._action("shower");
  check(html.includes("Action failed"), "service rejection is caught and shown");
  let threw = false; try { card.setConfig({ view: "invalid" }); } catch { threw = true; }
  check(threw, "invalid graphic view rejected");
  card.setConfig({ view: "exchanger" }); activate("boost");
  check(calls.length === 0 && html.includes("Heat exchanger"), "exchanger has no writable actions");
  check(Card.getStubConfig().view === "controller" && card.getCardSize() > 0 && card.getGridOptions().columns === 12, "card sizing and stub");
}
