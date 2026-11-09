# Local-only screenshots. Chrome must be installed; no server or network is used.
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$preview = (Join-Path $PSScriptRoot 'index.html').Replace('\', '/')
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$captures = @(
  @('graphic-light.png', '', '1200,1600'),
  @('graphic-dark.png', '?theme=dark', '1200,1600'),
  @('graphic-mobile-light.png', '?layout=phone', '390,1400'),
  @('graphic-mobile-dark.png', '?layout=phone&theme=dark', '390,1400'),
  @('graphic-mobile-de.png', '?layout=phone&lang=de', '390,1400')
)
Add-Type -AssemblyName System.Drawing
foreach ($capture in $captures) {
  $output = Join-Path $repo "images/$($capture[0])"
  $url = "file:///$preview$($capture[1])"
  $chromeArgs = @('--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--disable-background-networking', '--no-first-run', '--host-resolver-rules=MAP * ~NOTFOUND', '--force-prefers-reduced-motion', '--virtual-time-budget=1000', "--window-size=$($capture[2])")
  $ErrorActionPreference = 'Continue' # Chrome emits harmless Windows registry diagnostics on stderr.
  $dom = & $chrome @chromeArgs --dump-dom $url 2>$null | Out-String
  $ErrorActionPreference = 'Stop'
  $match = [regex]::Match($dom, 'data-layout-check="([^"]+)"')
  if (!$match.Success) { throw "Missing layout check for $url" }
  $layout = [System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value) | ConvertFrom-Json
  if (!$layout.stacked -or $layout.followingGap -ne 8 -or @($layout.widths | Where-Object { $_ -lt 350 }).Count) { throw "Invalid layout: $($match.Value)" }
  $ErrorActionPreference = 'Continue'
  & $chrome @chromeArgs "--screenshot=$output" $url 2>$null | Out-Null
  $ErrorActionPreference = 'Stop'
  $bitmap = [System.Drawing.Bitmap]::new($output)
  $width = if ($capture[0] -like '*mobile*') { 390 } else { [int]$layout.width }
  $height = [int]$layout.contentBottom
  if ($height -gt $bitmap.Height) { $bitmap.Dispose(); throw "Capture too short: $height" }
  $crop = $bitmap.Clone([System.Drawing.Rectangle]::new(0, 0, $width, $height), $bitmap.PixelFormat)
  $bitmap.Dispose()
  $crop.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
  Write-Output "$($capture[0]): ${width}x${height}; stacked=$($layout.stacked); next gap=$($layout.followingGap)px"
}
