// Generate the explicit section for a fixture: node tests/explicit.mjs fixture.json [name]
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname);
const window = { customElements: { get: (t) => t === "home-assistant" ? 1 : undefined, define() {} } };
vm.runInNewContext(fs.readFileSync(path.join(dir, "../dist/vallox-dashboard.js"), "utf8"), { window, HTMLElement: class {}, console: { info() {}, warn() {} }, setInterval, clearInterval });
const hass = { ...JSON.parse(fs.readFileSync(path.join(dir, process.argv[2]), "utf8")), locale: { language: process.argv[4] || "en" } };
process.stdout.write(JSON.stringify(window.valloxDashboard.buildSection(hass, { name: process.argv[3] })));
