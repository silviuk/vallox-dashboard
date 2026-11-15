#!/usr/bin/env node
// Local-only official animated README captures.
// Headless Chrome over CDP, no network. Reduced motion off, animation=on,
// Boost lit. Animations are paused and stepped through one --speed cycle
// so the GIF loops without a jump.
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const CHROME = process.env.CHROME || "google-chrome";
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const PREVIEW = join(ROOT, "tools/render/index.html");
const OUT = join(ROOT, "images");
const PORT = Number(process.env.CAPTURE_PORT || 9521);
const FRAMES = Number(process.env.CAPTURE_FRAMES || 16);
const PROFILE = mkdtempSync(join(tmpdir(), "vallox-capture-anim-"));
const FRAME_ROOT = mkdtempSync(join(tmpdir(), "vallox-anim-frames-"));

const captures = [
  { file: "graphic-animated-light.gif", webp: "graphic-animated-light.webp", query: "?animation=on", width: 1200, height: 1600, mobile: false },
  { file: "graphic-animated-mobile-dark.gif", webp: "graphic-animated-mobile-dark.webp", query: "?layout=phone&theme=dark&animation=on", width: 390, height: 1400, mobile: true },
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
    .reduce((n, el) => n + el.getAnimations().filter((a) => a.playState === "running" || a.playState === "paused").length, 0);
  const layout = document.body.dataset.layoutCheck ? JSON.parse(document.body.dataset.layoutCheck) : null;
  return { layout, pressed, boostOn, arrows, cues, flows, spinning, animating };
})()`;

const PAUSE_INFO = `(() => {
  const anims = [];
  for (const card of document.querySelectorAll("vallox-graphic-card")) {
    for (const el of card.shadowRoot?.querySelectorAll(".flow, .spin") || []) {
      for (const a of el.getAnimations()) {
        a.pause();
        const d = a.effect?.getComputedTiming()?.duration;
        anims.push({
          cls: el.className?.baseVal || el.className,
          duration: typeof d === "number" ? d : null,
          playState: a.playState,
        });
      }
    }
  }
  return anims;
})()`;

function seekTo(ms) {
  return `(() => {
    let n = 0;
    for (const card of document.querySelectorAll("vallox-graphic-card")) {
      for (const el of card.shadowRoot?.querySelectorAll(".flow, .spin") || []) {
        for (const a of el.getAnimations()) {
          a.pause();
          a.currentTime = ${Number(ms)};
          n++;
        }
      }
    }
    return n;
  })()`;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (${r.status}):\n${r.stderr || r.stdout}`);
  }
  return r;
}

function encodeGif(frameDir, dest, fps) {
  const palette = join(frameDir, "palette.png");
  run(FFMPEG, [
    "-y", "-hide_banner", "-loglevel", "error",
    "-framerate", String(fps),
    "-i", join(frameDir, "frame_%03d.png"),
    "-vf", "palettegen=max_colors=256:stats_mode=full",
    palette,
  ]);
  // Bayer dither compresses well; fall back is not needed here.
  run(FFMPEG, [
    "-y", "-hide_banner", "-loglevel", "error",
    "-framerate", String(fps),
    "-i", join(frameDir, "frame_%03d.png"),
    "-i", palette,
    "-lavfi", "paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
    "-loop", "0",
    dest,
  ]);
}

function encodeWebp(frameDir, dest, fps) {
  run(FFMPEG, [
    "-y", "-hide_banner", "-loglevel", "error",
    "-framerate", String(fps),
    "-i", join(frameDir, "frame_%03d.png"),
    "-loop", "0",
    "-pix_fmt", "yuv420p",
    "-quality", "75",
    "-compression_level", "6",
    dest,
  ]);
}

function gifInfo(path) {
  const r = run(FFMPEG, ["-hide_banner", "-i", path, "-f", "null", "-"]);
  const text = (r.stderr || "") + (r.stdout || "");
  const stream = text.match(/Video:\s*gif[^\n]*/i)?.[0] || text;
  const size = text.match(/, (\d+)x(\d+)/)?.slice(1);
  const frames = text.match(/frame=\s*(\d+)/)?.[1];
  const fps = text.match(/([\d.]+)\s*fps/)?.[1];
  const dur = text.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  return { stream, width: size && Number(size[0]), height: size && Number(size[1]), frames: frames && Number(frames), fps: fps && Number(fps), raw: text };
}

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
  try { rmSync(FRAME_ROOT, { recursive: true, force: true }); } catch {}
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
    await delay(300);
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

    const paused = await cdp.send("Runtime.evaluate", { expression: PAUSE_INFO, returnByValue: true });
    if (paused.exceptionDetails) throw new Error("Pause failed: " + JSON.stringify(paused.exceptionDetails));
    const anims = paused.result.value;
    const durations = [...new Set(anims.map((a) => a.duration).filter((d) => typeof d === "number" && d > 0))];
    if (!durations.length) throw new Error("No animation durations for " + shot.file + ": " + JSON.stringify(anims));
    if (durations.length !== 1) {
      throw new Error("Mismatched animation durations for " + shot.file + ": " + JSON.stringify(durations));
    }
    const cycle = durations[0];
    const width = shot.mobile ? 390 : Number(m.layout.width);
    const height = Number(m.layout.contentBottom);
    const frameDir = join(FRAME_ROOT, shot.file.replace(/\.gif$/, ""));
    mkdirSync(frameDir, { recursive: true });

    for (let i = 0; i < FRAMES; i++) {
      const t = cycle * i / FRAMES;
      const seek = await cdp.send("Runtime.evaluate", { expression: seekTo(t), returnByValue: true });
      if (seek.exceptionDetails) throw new Error("Seek failed: " + JSON.stringify(seek.exceptionDetails));
      if (!(seek.result.value > 0)) throw new Error("Seek moved no animations at t=" + t);
      await delay(20);
      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "png", fromSurface: true, captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height, scale: 1 },
      });
      writeFileSync(join(frameDir, `frame_${String(i).padStart(3, "0")}.png`), Buffer.from(data, "base64"));
    }

    const fps = FRAMES / (cycle / 1000);
    const gifPath = join(OUT, shot.file);
    const webpPath = join(OUT, shot.webp);
    encodeGif(frameDir, gifPath, fps);
    encodeWebp(frameDir, webpPath, fps);

    const info = gifInfo(gifPath);
    const gifBytes = statSync(gifPath).size;
    const webpBytes = statSync(webpPath).size;
    const frameFiles = readdirSync(frameDir).filter((f) => f.startsWith("frame_") && f.endsWith(".png")).sort();
    if (frameFiles.length !== FRAMES) throw new Error("Expected " + FRAMES + " frames, got " + frameFiles.length);

    // Confirm frames actually differ (airflow/fans moved).
    const first = spawnSync("python3", ["-c", `
from pathlib import Path
from PIL import Image
import sys
a = Image.open(sys.argv[1]).convert("RGB")
b = Image.open(sys.argv[2]).convert("RGB")
c = Image.open(sys.argv[3]).convert("RGB")
def diff(x,y):
    ax, ay = list(x.getdata()), list(y.getdata())
    return sum(p!=q for p,q in zip(ax,ay))
print(a.size[0], a.size[1], diff(a,b), diff(a,c), diff(b,c))
`, join(frameDir, frameFiles[0]), join(frameDir, frameFiles[Math.floor(FRAMES / 4)]), join(frameDir, frameFiles[Math.floor(FRAMES / 2)])], { encoding: "utf8" });
    if (first.status !== 0) throw new Error("Frame diff failed: " + (first.stderr || first.stdout));
    const [fw, fh, d1, d2, d3] = first.stdout.trim().split(/\s+/).map(Number);
    if (d1 < 50 || d2 < 50 || d3 < 50) {
      throw new Error("Frames are too similar (animation not visible): " + first.stdout.trim());
    }
    if (gifBytes > 3.2 * 1024 * 1024) {
      console.warn(`WARNING: ${shot.file} is ${(gifBytes / 1024 / 1024).toFixed(2)} MB (target <= ~3 MB)`);
    }
    console.log(
      `${shot.file}: ${width}x${height}; ${FRAMES} frames @ ${fps.toFixed(2)} fps; cycle=${cycle.toFixed(1)}ms; ` +
      `gif=${(gifBytes / 1024).toFixed(0)}KB webp=${(webpBytes / 1024).toFixed(0)}KB; ` +
      `pixel diffs ${d1}/${d2}/${d3}; ff=${info.stream || "n/a"}`
    );
  }

  ws.close();
} finally {
  cleanup();
}
