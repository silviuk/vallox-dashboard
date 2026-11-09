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
    check(cards.slice(1,3).every(c => c.grid_options.columns === 12 && c.grid_options.rows === "auto"), builder.name + ": graphics fill all twelve phone columns with natural rows");
    check(cards.find(c => c.entity === roles.switch_type)?.grid_options.columns === 12, builder.name + ": remaining switch tile fills the row");
    check(cards[2].show_status === false && !render("exchanger", hass, cards[2]).includes('aria-label="Fan speed"'),
      builder.name + ": controller suppresses duplicate exchanger status");
    const alone = builder(hass, { style: "graphic", show: { controller: false } });
    const exchanger = (alone.cards || alone.sections[0].cards).find((c) => c.view === "exchanger");
    check(exchanger.show_status === true && render("exchanger", hass, exchanger).includes('aria-label="Fan speed"'),
      builder.name + ": exchanger alone shows fan status");
    check(!cards.some((c) => c.entity === roles.climate || c.entity === roles.outdoor || c.entity === roles.motor_in),
      builder.name + ": duplicate tiles removed");
    check(cards.some((c) => c.entity === roles.fault_code) && cards.some((c) => c.entity === roles.bypass_setpoint)
      && cards.some((c) => c.entity === roles.shower_boost), builder.name + ": alarm, setpoint and package groups retained");
    for (const view of ["controller", "exchanger"]) {
      const hidden = builder(hass, { style: "graphic", show: { [view]: false } });
      check(!JSON.stringify(hidden).includes('"view":"' + view + '"'), builder.name + ": show." + view);
    }
  }
  for (const builder of [api.buildSection, api.buildView]) {
    const layoutHass = clone();
    const layoutRoles = { humidity: "sensor.test_humidity", humidity_2: "sensor.test_humidity_2", co2: "sensor.test_co2" };
    for (const id of Object.values(layoutRoles)) layoutHass.states[id] = { state: "42", attributes: {} };
    const cardsFor = (config) => {
      const result = builder(layoutHass, { ...config, entities: { ...layoutRoles, ...config.entities } });
      return result.cards || result.sections[0].cards;
    };
    const withoutSwitch = { entities: { switch_type: null } };
    const baseHeadings = cardsFor(withoutSwitch).filter(c => c.type === "heading");
    const graphicHeadings = cardsFor({ ...withoutSwitch, style: "graphic" }).filter(c => c.type === "heading");
    check(graphicHeadings.length > 1 && graphicHeadings.every(c =>
      baseHeadings.some(base => JSON.stringify(base) === JSON.stringify(c))),
      builder.name + ": no switch_type role leaves headings unchanged");
    const lone = cardsFor({ style: "graphic", entities: { humidity_2: null, co2: null } });
    check(lone.find(c => c.entity === layoutRoles.humidity)?.grid_options.columns === 12,
      builder.name + ": lone half tile in an unrelated group becomes full width");
    const odd = cardsFor({ style: "graphic" });
    check(odd.find(c => c.entity === layoutRoles.humidity)?.grid_options.columns === 6
      && odd.find(c => c.entity === layoutRoles.humidity_2)?.grid_options.columns === 6
      && odd.find(c => c.entity === layoutRoles.co2)?.grid_options.columns === 12,
      builder.name + ": paired half tiles unchanged and odd final tile widened");
  }
  const dash = await defined["ll-strategy-dashboard-vallox-ventilation"].generate({ style: "graphic", show: { controller: false } }, hass);
  const activeBoost = clone(); activeBoost.states[roles.boost_remaining].state = "12";
  const controller = render("controller", activeBoost);
  check((controller.match(/<text[^>]*>Boost 12 min<\/text>/g) || []).length === 1
    && !controller.includes("Built-in boost time left"), "controller shows boost countdown once, without footer");
  check(render("exchanger", activeBoost).includes("Boost · 12 min")
    && render("exchanger", activeBoost).includes('aria-label="Fan speed"')
    && !render("exchanger", activeBoost, { show_status: false }).includes("Boost · 12 min")
    && !render("exchanger", activeBoost, { show_status: false }).includes('aria-label="Fan speed"'),
    "standalone status defaults on; show_status hides fan and boost badges");
  const crossing = render("exchanger");
  const paths = [...crossing.matchAll(/data-cell-stream="([^"]+)"[^>]*d="([^"]+)"/g)];
  check(paths.length === 2 && crossing.includes('d="M350 330L250 498"') && crossing.includes('d="M250 330L350 498"'), "two streams cross opposite faces of the tall cell");
  check(crossing.includes('id="extract-gradient"') && crossing.includes('id="supply-gradient"') && crossing.includes('x="244" y="552" width="112" height="54"'), "recovery badge sits beside crossing gradients");
  check((crossing.match(/data-duct=/g)||[]).length === 4 && [...crossing.matchAll(/data-port="(\d)"/g)].map(p=>p[1]).join('') === '4123', "four round Modell R ports preserve manual numbering and order");
  check((crossing.match(/data-fan=/g)||[]).length === 2 && crossing.includes('translate(480 390)') && crossing.includes('translate(110 498)'), "supply fan upper right and extract fan lower left");
  check(crossing.includes('data-filter="F7"') && crossing.includes('data-filter="G3"') && crossing.includes('data-component="cell"') && crossing.includes('unit-casing'), "pleated filters, tall cell and upright casing");
  check(crossing.indexOf('class="cell-outline"') > crossing.lastIndexOf('data-stream='), "crisp cell outline above streams");
  check(!crossing.includes('data-bypass-route=') && !crossing.includes('class="plate"'), "closed bypass has no route; cell has no decorative hatching");
  for (const [part, name, stream] of [["filter","F7","supply"],["filter","G3","extract"],["fan","motor_in","supply"],["fan","motor_out","extract"]]) {
    check(crossing.includes('data-' + part + '="' + name + '" data-on-stream="' + stream + '"'), name + ": component belongs to its stream");
  }
  check(crossing.includes('M210 194V300L250 330') && crossing.includes('M370 194V300L350 330')
    && crossing.includes('M350 498H480V240H510V194') && crossing.includes('M250 498H80V194'), "four separate exterior lanes join cell faces through filters, heaters and fans");
  check(crossing.includes('M186 284l8 -12 8 24 8 -24 8 24 8 -24 8 12') && crossing.includes('M456 280l8 -12 8 24 8 -24 8 24 8 -24 8 12'), "1.2.1 zigzag heaters intersect the supply inlet/outlet lanes");
  for (const role of ["outdoor","extract","supply","exhaust"]) check(crossing.includes('data-temperature="' + role + '"'), role + ": temperature belongs to its numbered duct");
  const actionRects = [...controller.matchAll(/data-action="(boost|heat|shower)"[^]*?<rect[^>]*x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g)];
  check(actionRects.length === 3 && actionRects.every((r) => r[3] === "370" && Number(r[5]) * 294 / 600 >= 40)
    && new Set(actionRects.map((r) => r[2])).size === 3
    && !vm.runInContext("GRAPHIC_CSS", context).includes('.actions [data-action='),
    "three actions share one row with at least 40 px tap height at a 320 px viewport");
  check(controller.includes('class="body" x="24" y="24" width="552" height="452" rx="24"')
    && controller.includes('class="strip"') && controller.includes('class="lcd"')
    && [...controller.matchAll(/<rect class="button"[^>]*rx="([^"]+)"/g)].every(r => r[1] === "12")
    && !/housing|bezel|recessed-lcd|linearGradient/.test(controller)
    && !/housing|bezel|button-depth/.test(vm.runInContext("GRAPHIC_CSS", context)),
    "1.2.1 flat controller panel, LCD and rx 12 buttons without depth effects");
  check(crossing.includes('class="body unit-casing" x="36" y="194" width="528" height="426" rx="24"')
    && (crossing.match(/<circle class="body" r="32" fill="var\(--surface\)"/g) || []).length === 2
    && !crossing.includes('class="bezel"'), "upright exchanger uses 1.2.1 rounded casing and circular fan glyphs");
  check(controller.includes('viewBox="0 0 600 500"') && crossing.includes('viewBox="0 0 600 676"'), "SVGs retain natural proportions");
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
  const summer = render("exchanger", bypass);
  check(summer.includes('data-bypass-route="supply"') && !summer.includes('data-cell-stream="supply"') && summer.includes('data-cell-stream="extract"'), "summer routes supply around core while extract keeps recovering path");
  const bypassRoute = summer.match(/data-bypass-route="supply"[^>]*d="([^"]+)"/);
  check(summer.includes('d="M210 194V300H170"')
    && bypassRoute?.[1] === "M170 300V574H480"
    && summer.includes('d="M480 574V240H510V194"')
    && !summer.includes('d="M250 330L350 498"')
    && !summer.includes('d="M350 498H480V240H510V194"'),
    "bypass runs after F7/preheater beside the cell, across exhaust once at a right angle, through the bottom flap to supply fan and port 3");
  check(!summer.includes('aria-label="Heat recovery"') && !summer.includes('class="recovery-label"'),
    "open bypass hides recovery badge and labels for a clear bottom lane");
  check(summer.includes('d="M250 498H80V194"') && bypassRoute?.[1] === "M170 300V574H480"
    && 170 - 80 > 14 && 574 - 498 > 14,
    "bypass vertical crosses horizontal exhaust once at 90 degrees; parallel lanes have over 14 px clearance");
  check(crossing.includes('x="456" y="608" class="muted"') && summer.includes('x="300" y="608" class="muted"'),
    "bypass label stays inside casing above its 620 bottom edge, clear of recovery badge");
  const beforeBypassFix = api.renderExchangerSvg.toString()
    .replace('bypass ? "M210 194V300H170" : "M210 194V300L250 330"', '"M210 194V300L250 330"')
    .replace('bypass ? "M480 574V240H510V194" : "M350 498H480V240H510V194"', '"M350 498H480V240H510V194"')
    .replace('"M170 300V574H480"', '"M250 330L300 310L380 378V460L350 498"');
  check(vm.runInContext("(" + beforeBypassFix + ")", context)(model()) === crossing,
    "winter SVG remains byte-identical to before the bypass fix");
  const texts = JSON.parse(vm.runInContext("JSON.stringify(GRAPHIC_TEXT)", context));
  check(JSON.stringify(Object.keys(texts.en).sort()) === JSON.stringify(Object.keys(texts.de).sort())
    && Object.values(texts.de).every(Boolean), "graphic EN/DE label parity");
  check(render("controller", { ...hass, locale: { language: "de" } }).includes("Digitalregler")
    && render("exchanger", { ...hass, locale: { language: "de" } }).includes("Wärmetauscher"), "graphic German labels");
  const Card = defined["vallox-graphic-card"], card = new Card();
  check(card.getGridOptions().rows === "auto" && card.getGridOptions().min_columns === 12 && card.getCardSize() === 7, "natural grid rows and compact controller masonry estimate");
  card._config = { view: "exchanger" };
  check(card.getCardSize() === 8, "taller exchanger masonry estimate");
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
