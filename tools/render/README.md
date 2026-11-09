Open `index.html` directly in a browser. All resources are local. No server, dependencies,
fonts, remote images, or Home Assistant connection are used. Buttons only log mock calls.

Query options: `?theme=dark`, `?lang=de`, `?variant=bypass`, `?variant=stopped`,
`?layout=phone` (390 px), and `?view=controller` / `?view=exchanger`; combine with `&`.
Regenerate sanitized sample data with `node tools/render/generate.mjs`.

The phone preview uses a 12-column sections grid and the strategy's own
`grid_options.columns` and `grid_options.rows`. The graphic cards span all 12 columns
with automatic height. Numeric rows emulate 56 px rows with 8 px gaps. Phone padding
leaves 366 px for cards. The default preview also stacks the cards, at 480 px wide.

Run the local capture script from the repository root:

```powershell
./tools/render/capture.ps1
```

It uses Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`, blocks
host resolution, disables background networking, and forces reduced motion.
It verifies stacked cards, card widths and the 8 px gap to the following tile.
The script captures and trims all five PNGs to the measured content bounds automatically:

| Output in `images/` | Query | Capture viewport |
| --- | --- | --- |
| `graphic-light.png` | default | 1200 x 1600 |
| `graphic-dark.png` | `?theme=dark` | 1200 x 1600 |
| `graphic-mobile-light.png` | `?layout=phone` | 390 x 1400 |
| `graphic-mobile-dark.png` | `?layout=phone&theme=dark` | 390 x 1400 |
| `graphic-mobile-de.png` | `?layout=phone&lang=de` | 390 x 1400 |

Final widths are 536 px for desktop and 390 px for phone; heights follow content.
The script prints each final size. No manual cropping is needed.

Animation respects the operating system's reduced-motion preference. The default paired
preview hides duplicate exchanger status, matching the strategy; `?view=exchanger`
shows standalone fan/boost badges. Keep the same sample data. This is development
tooling only; HA loads only `dist/vallox-dashboard.js`.
