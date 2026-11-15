Open `index.html` directly in a browser. All resources are local. No server, dependencies,
fonts, remote images, or Home Assistant connection are used. Buttons only log mock calls.

Query options: `?theme=dark`, `?lang=de`, `?variant=bypass`, `?variant=stopped`, `?variant=active`
(all three action buttons on), `?animation=on|off`, `?layout=phone` (390 px), `?layout=wide` (1280 px),
and `?view=controller` / `?view=exchanger`; combine with `&`.
Regenerate sanitized sample data with `node tools/render/generate.mjs`.

The phone preview uses a 12-column sections grid and the strategy's own
`grid_options.columns` and `grid_options.rows`. The graphic cards span all 12 columns
with automatic height. Numeric rows emulate 56 px rows with 8 px gaps. Phone padding
leaves 366 px for cards. The default preview also stacks the cards, at 480 px wide. On `?layout=wide` the cards stay centred and do not exceed the 600 px drawing cap.

The default sample has built-in Boost on (12 minutes remaining), so the Boost button
is lit. Animation respects the operating system's reduced-motion preference unless
`?animation=on` is set; `?animation=off` always shows the static flow-direction arrows.
The default paired preview hides duplicate exchanger status, matching the strategy;
`?view=exchanger` shows standalone fan/boost badges. Keep the same sample data. This is
development tooling only; HA loads only `dist/vallox-dashboard.js`.

## Official screenshots

From the repository root, on Linux with Chrome:

```bash
node tools/render/capture.mjs
```

Or on Windows:

```powershell
./tools/render/capture.ps1
```

Both write and trim all five PNGs to the measured content bounds automatically:

| Output in `images/` | Query | Capture viewport |
| --- | --- | --- |
| `graphic-light.png` | `?animation=on` | 1200 x 1600 |
| `graphic-dark.png` | `?theme=dark&animation=on` | 1200 x 1600 |
| `graphic-mobile-light.png` | `?layout=phone&animation=on` | 390 x 1400 |
| `graphic-mobile-dark.png` | `?layout=phone&theme=dark&animation=on` | 390 x 1400 |
| `graphic-mobile-de.png` | `?layout=phone&lang=de&animation=on` | 390 x 1400 |

Final widths are 536 px for desktop and 390 px for phone; heights follow content.
The scripts print each final size. No manual cropping is needed.

Official captures force the animation on and turn reduced motion off, and
`capture.mjs` seeks the airflow and fans to 40% of their cycle so a still frame
shows motion (rotated fans, mid-offset dashes, no static arrowheads). Chrome is
started with host resolution blocked and background networking disabled.
Both scripts verify stacked cards, card widths and the 8 px gap to the following tile.
`capture.mjs` also checks that the Boost button is lit and that the airflow animation is running.

## Official animated captures

The stills above freeze one frame mid-cycle, so the README also ships looping GIFs
of a full airflow and fan cycle. From the repository root, on Linux with Chrome and ffmpeg:

```bash
node tools/render/capture-anim.mjs
```

That writes and trims:

| Output in `images/` | Query | Capture viewport |
| --- | --- | --- |
| `graphic-animated-light.gif` (and `.webp`) | `?animation=on` | 1200 x 1600 |
| `graphic-animated-mobile-dark.gif` (and `.webp`) | `?layout=phone&theme=dark&animation=on` | 390 x 1400 |

Final sizes match the stills (536×1195 desktop, 390×960 phone). Animations are paused and
stepped through one `--speed` cycle (fan level 3: 0.933 s) so the loop has no jump.
Default is 16 frames, about 17 fps, looping forever. The script checks that Boost is lit,
that the animation is present, and that frames actually differ. GitHub's README renderer
plays the GIFs; the WebP files are smaller optional alternatives.
