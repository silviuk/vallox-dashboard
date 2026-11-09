Open `index.html` directly in a browser. All resources are local. No server, dependencies,
fonts, remote images, or Home Assistant connection are used. Buttons only log mock calls.

Query options: `?theme=dark`, `?lang=de`, `?variant=bypass`, `?variant=stopped`,
`?layout=narrow` (430 px, one card per row), and `?view=controller` / `?view=exchanger`; combine with `&`.
Regenerate sanitized sample data with `node tools/render/generate.mjs`.

Example PowerShell capture from the repository root:

```powershell
$preview = (Join-Path (Get-Location) 'tools/render/index.html')
$output = (Join-Path (Get-Location) 'images/graphic-dark.png')
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --hide-scrollbars --disable-background-networking --no-first-run --window-size=1200,900 "--screenshot=$output" "file:///$($preview.Replace('\','/'))?theme=dark"
```

Animation respects the operating system's reduced-motion preference. This is development
tooling only; HA loads only `dist/vallox-dashboard.js`.

The checked-in light/dark PNGs were captured with Chrome at 1200 × 900; mobile light/dark
use 430 × 1250 with `?layout=narrow` (append `&theme=dark` for dark). The narrow harness
explicitly caps the page width to avoid Chrome headless's minimum layout viewport cropping the cards.
After Chrome exits, crop the mobile captures to 430 × 880 (content plus bottom padding):

```powershell
Add-Type -AssemblyName System.Drawing
foreach ($name in @('graphic-mobile-light.png', 'graphic-mobile-dark.png')) {
  $path = Join-Path (Get-Location) "images/$name"
  $bitmap = [System.Drawing.Bitmap]::new($path)
  $crop = $bitmap.Clone([System.Drawing.Rectangle]::new(0, 0, 430, 880), $bitmap.PixelFormat)
  $bitmap.Dispose()
  $crop.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
}
```

The default paired preview hides duplicate exchanger status, matching the strategy;
`?view=exchanger` shows standalone fan/boost badges. Keep the same sample data.
For fully offline captures, also pass `'--host-resolver-rules=MAP * ~NOTFOUND'` to Chrome.
In a sandboxed environment Chrome may additionally need `--no-sandbox`.
