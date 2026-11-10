Add-Type -AssemblyName System.Drawing
$sizes = @(16, 48, 128)
$destDir = "d:\pak digital fb lead generation\icons"
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }

foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $rect = New-Object System.Drawing.Rectangle(0, 0, $sz, $sz)
    $c1 = [System.Drawing.Color]::FromArgb(79, 70, 229)
    $c2 = [System.Drawing.Color]::FromArgb(147, 51, 234)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
    $g.FillEllipse($brush, 0, 0, $sz - 1, $sz - 1)

    $fontSz = [Math]::Max(7, [int]($sz * 0.52))
    $font = New-Object System.Drawing.Font("Arial", $fontSz, [System.Drawing.FontStyle]::Bold)
    $textBrush = [System.Drawing.Brushes]::White
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textRect = New-Object System.Drawing.RectangleF(0, 0, $sz, $sz)
    $g.DrawString("P", $font, $textBrush, $textRect, $sf)

    $outPath = Join-Path $destDir "icon$sz.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}
Write-Host "Icons generated successfully!"
