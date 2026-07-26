param(
  [string]$OutputDirectory = (Join-Path (Split-Path -Parent $PSScriptRoot) 'assets')
)

Add-Type -AssemblyName System.Drawing

function New-WaveMark {
  param(
    [int]$Size,
    [string]$OutputPath,
    [switch]$WithBackground
  )

  $renderSize = $Size * 4
  $scale = $renderSize / 64.0
  $bitmap = [System.Drawing.Bitmap]::new(
    $renderSize,
    $renderSize,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  if ($WithBackground) {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#fff8f9'))
  } else {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  }

  $primaryPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $primaryPath.StartFigure()
  $primaryPath.AddBezier(4 * $scale,45 * $scale,14 * $scale,34 * $scale,20 * $scale,26 * $scale,29 * $scale,29 * $scale)
  $primaryPath.AddBezier(29 * $scale,29 * $scale,36 * $scale,31 * $scale,38 * $scale,36 * $scale,44 * $scale,32 * $scale)
  $primaryPath.AddBezier(44 * $scale,32 * $scale,51 * $scale,27 * $scale,55 * $scale,21 * $scale,61 * $scale,18 * $scale)
  $primaryPath.AddBezier(61 * $scale,18 * $scale,55 * $scale,26 * $scale,52 * $scale,32 * $scale,46 * $scale,37 * $scale)
  $primaryPath.AddBezier(46 * $scale,37 * $scale,39 * $scale,43 * $scale,34 * $scale,37 * $scale,28 * $scale,35 * $scale)
  $primaryPath.AddBezier(28 * $scale,35 * $scale,20 * $scale,31 * $scale,13 * $scale,40 * $scale,4 * $scale,45 * $scale)
  $primaryPath.CloseFigure()

  $gradientBounds = [System.Drawing.RectangleF]::new(4 * $scale,0,56 * $scale,64 * $scale)
  $primaryBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $gradientBounds,
    [System.Drawing.ColorTranslator]::FromHtml('#ff6673'),
    [System.Drawing.ColorTranslator]::FromHtml('#b20f32'),
    0
  )
  $graphics.FillPath($primaryBrush,$primaryPath)

  $output = [System.Drawing.Bitmap]::new(
    $Size,
    $Size,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $outputGraphics = [System.Drawing.Graphics]::FromImage($output)
  $outputGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $outputGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $outputGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $outputGraphics.DrawImage($bitmap,0,0,$Size,$Size)
  $output.Save($OutputPath,[System.Drawing.Imaging.ImageFormat]::Png)

  $outputGraphics.Dispose()
  $output.Dispose()
  $primaryBrush.Dispose()
  $primaryPath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
New-WaveMark -Size 32 -OutputPath (Join-Path $OutputDirectory 'favicon-32.png')
New-WaveMark -Size 64 -OutputPath (Join-Path $OutputDirectory 'favicon-64.png')
New-WaveMark -Size 128 -OutputPath (Join-Path $OutputDirectory 'wave-mark-128.png')
New-WaveMark -Size 180 -OutputPath (Join-Path $OutputDirectory 'apple-touch-icon.png') -WithBackground
