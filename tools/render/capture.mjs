#!/usr/bin/env node
// Local-only official screenshots (Linux counterpart to capture.ps1).
// Uses headless Chrome over CDP. No network. Motion is running (reduced
// motion off, animation=on) and the sample already has Boost active.
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const CHROME = process.env.CHROME || "google-chrome";
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const PREVIEW = join(ROOT, "tools/render/index.html");
const OUT = join(ROOT, "images");
const PORT = Number(process.env.CAPTURE_PORT || 9520);
const PROFILE = mkdtempSync(join(tmpdir(), "vallox-capture-"));

const captures = [
  { file: "graphic-light.png", query: "?animation=on", width: 1200, height: 1600, mobile: false },
  { file: "graphic-dark.png", query: "?theme=dark&animation=on", width: 1200, height: 1600, mobile: false },
  { file: "graphic-mobile-light.png", query: "?layout=phone&animation=on", width: 390, height: 1400, mobile: true },
  { file: "graphic-mobile-dark.png", query: "?layout=phone&theme=dark&animation=on", width: 390, height: 1400, mobile: true },
  { file: "graphic-mobile-de.png", query: "?layout=phone&lang=de&animation=on", width: 390, height: 1400, mobile: true },
];

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    };
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

async function waitJson(url) {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch {}
    await delay(100);
  }
  throw new Error("CDP not ready: " + url);
}

const MEASURE = `(() => {
  const cards = [...document.querySelectorAll("vallox-graphic-card")];
  const controller = cards.find((c) => c.shadowRoot?.querySelector('[data-action="boost"]')) || cards[0];
  const pressed = [...(controller?.shadowRoot?.querySelectorAll('[aria-pressed="true"]') || [])]
    .map((el) => el.getAttribute("data-action"));
  const boostOn = !!controller?.shadowRoot?.querySelector('[data-action="boost"] .button.on');
  const arrows = cards.some((c) => c.shadowRoot?.querySelector("marker[id^=flow-arrow]"));
  const cues = cards.some((c) => c.shadowRoot?.querySelector(".static-cue"));
  const flows = cards.flatMap((c) => [...(c.shadowRoot?.querySelectorAll(".flow:not(.stopped)") || [])]).length;
  const spinning = cards.flatMap((c) => [...(c.shadowRoot?.querySelectorAll(".spin") || [])]).length;
  const animating = cards.flatMap((c) => [...(c.shadowRoot?.querySelectorAll(".flow, .spin") || [])])
    .reduce((n, el) => n + el.getAnimations().filter((a) => a.playState === "running").length, 0);
  const layout = document.body.dataset.layoutCheck ? JSON.parse(document.body.dataset.layoutCheck) : null;
  return { layout, pressed, boostOn, arrows, cues, flows, spinning, animating };
})()`;

const SEEK = `(() => {
  for (const card of document.querySelectorAll("vallox-graphic-card")) {
    for (const el of card.shadowRoot?.querySelectorAll(".flow, .spin") || []) {
      for (const a of el.getAnimations()) {
        const d = a.effect?.getComputedTiming()?.duration;
        if (typeof d === "number" && d > 0) a.currentTime = d * 0.4;
      }
    }
  }
  return true;
})()`;

const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
  "--no-first-run", "--disable-background-networking",
  "--host-resolver-rules=MAP * ~NOTFOUND",
  `--remote-debugging-port=${PORT}`, "--remote-debugging-address=127.0.0.1",
  `--user-data-dir=${PROFILE}`,
  "about:blank",
], { stdio: "ignore" });

const cleanup = () => {
  try { chrome.kill("SIGKILL"); } catch {}
  try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
};
process.on("exit", cleanup);

try {
  const targets = await waitJson(`http://127.0.0.1:${PORT}/json/list`);
  const page = targets.find((t) => t.type === "page") || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new Cdp(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });

  mkdirSync(OUT, { recursive: true });
  const base = new URL("file://" + PREVIEW).href;

  for (const shot of captures) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: shot.width, height: shot.height, deviceScaleFactor: 1, mobile: false,
    });
    const loaded = new Promise((resolve) => {
      const prev = cdp.ws.onmessage;
      cdp.ws.onmessage = (ev) => {
        prev.call(cdp.ws, ev);
        const msg = JSON.parse(ev.data);
        if (msg.method === "Page.loadEventFired") resolve();
      };
    });
    await cdp.send("Page.navigate", { url: base + shot.query });
    await Promise.race([loaded, delay(8000)]);
    await delay(250);
    const seek = await cdp.send("Runtime.evaluate", { expression: SEEK, returnByValue: true, awaitPromise: false });
    if (seek.exceptionDetails) throw new Error("Seek failed: " + JSON.stringify(seek.exceptionDetails));
    await delay(50);
    const ev = await cdp.send("Runtime.evaluate", { expression: MEASURE, returnByValue: true });
    const m = ev.result.value;
    if (!m?.layout) throw new Error("Missing layout check for " + shot.file);
    if (!m.layout.stacked || m.layout.followingGap !== 8 || m.layout.widths.some((w) => w < 350)) {
      throw new Error("Invalid layout for " + shot.file + ": " + JSON.stringify(m.layout));
    }
    if (!m.boostOn || !m.pressed.includes("boost")) {
      throw new Error("Boost is not lit in " + shot.file + ": " + JSON.stringify(m));
    }
    if (m.arrows || m.cues) throw new Error("Static reduced-motion arrows present in " + shot.file);
    if (m.animating < 2 || m.flows < 2 || m.spinning < 1) {
      throw new Error("Animation not running in " + shot.file + ": " + JSON.stringify(m));
    }
    const width = shot.mobile ? 390 : Number(m.layout.width);
    const height = Number(m.layout.contentBottom);
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png", fromSurface: true, captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height, scale: 1 },
    });
    const dest = join(OUT, shot.file);
    writeFileSync(dest, Buffer.from(data, "base64"));
    console.log(`${shot.file}: ${width}x${height}; stacked=${m.layout.stacked}; next gap=${m.layout.followingGap}px; boost=${m.pressed}; animating=${m.animating}`);
  }

  ws.close();
} finally {
  cleanup();
}
