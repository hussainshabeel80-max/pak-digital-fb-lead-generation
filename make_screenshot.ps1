Add-Type -AssemblyName System.Drawing
$width = 1280
$height = 800

$bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

# Background Gradient (Deep modern navy / tech dark theme)
$bgRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, [System.Drawing.Color]::FromArgb(15, 23, 42), [System.Drawing.Color]::FromArgb(30, 41, 59), 45.0)
$g.FillRectangle($bgBrush, $bgRect)

# Top Bar / Branding
$brandBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(129, 140, 248))
$headerFont = New-Object System.Drawing.Font("Segoe UI", 32, [System.Drawing.FontStyle]::Bold)
$g.DrawString("PakDigital AI Auto Commenter", $headerFont, $brandBrush, 80, 70)

$subFont = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Regular)
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(203, 213, 225))
$g.DrawString("Smart AI-Assisted Social Engagement & Customer Reply Manager for Facebook", $subFont, $subBrush, 80, 130)

# Card 1: Features Panel
$card1Rect = New-Object System.Drawing.Rectangle(80, 210, 480, 490)
$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 33, 50))
$cardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(51, 65, 85), 2)
$g.FillRectangle($cardBrush, $card1Rect)
$g.DrawRectangle($cardPen, $card1Rect)

$cardTitleFont = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)
$whiteBrush = [System.Drawing.Brushes]::White
$g.DrawString("Core Capabilities", $cardTitleFont, $whiteBrush, 110, 240)

$featFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Regular)
$greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 197, 94))
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, 232, 240))

$features = @(
    "Instant Contextual AI Replies",
    "Professional Direct-Response Modes",
    "Safe Daily Quota & Limits Protection",
    "Multi-Profile License & Cloud Security",
    "Direct WhatsApp Inquiry Integration",
    "1-Click Chrome Context Menu Execution"
)

$y = 310
foreach ($f in $features) {
    $g.DrawString("[OK]", $featFont, $greenBrush, 110, $y)
    $g.DrawString($f, $featFont, $textBrush, 160, $y)
    $y += 58
}

# Card 2: App Preview UI Mockup
$card2Rect = New-Object System.Drawing.Rectangle(600, 210, 600, 490)
$card2Brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 41, 59))
$card2Pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(99, 102, 241), 2)
$g.FillRectangle($card2Brush, $card2Rect)
$g.DrawRectangle($card2Pen, $card2Rect)

# Inner Mockup Header
$innerHeader = New-Object System.Drawing.Rectangle(600, 210, 600, 65)
$innerHeadBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(49, 46, 129))
$g.FillRectangle($innerHeadBrush, $innerHeader)

$mockTitleFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$g.DrawString("PakDigital AI Agent - Active Workspace", $mockTitleFont, $whiteBrush, 625, 227)

# Status Badge
$badgeRect = New-Object System.Drawing.Rectangle(625, 305, 550, 65)
$badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 83, 45))
$badgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(34, 197, 94), 1)
$g.FillRectangle($badgeBrush, $badgeRect)
$g.DrawRectangle($badgePen, $badgeRect)

$badgeFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$g.DrawString("STATUS: VERIFIED LICENSE ACTIVE (DAILY LIMIT: 100/100)", $badgeFont, $greenBrush, 645, 327)

# Mock Post Preview
$postBox = New-Object System.Drawing.Rectangle(625, 395, 550, 160)
$postBoxBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
$g.FillRectangle($postBoxBrush, $postBox)

$postFont = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Italic)
$postMuted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))
$g.DrawString("Facebook Post Context Detected:", $postFont, $brandBrush, 645, 410)
$g.DrawString('"Looking for high quality digital marketing and web solutions..."', $postFont, $postMuted, 645, 438)

$aiReplyFont = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular)
$g.DrawString("AI Generated Draft:", $postFont, $greenBrush, 645, 475)
$g.DrawString('"Hello! PakDigital provides tailored digital campaigns & CRM systems. Let us assist you!"', $aiReplyFont, $textBrush, 645, 502)

# Action Button Mockup
$btnRect = New-Object System.Drawing.Rectangle(625, 580, 550, 55)
$btnBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(79, 70, 229))
$g.FillRectangle($btnBrush, $btnRect)

$btnFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center
$btnRectF = New-Object System.Drawing.RectangleF(625, 580, 550, 55)
$g.DrawString("1-Click Generate & Insert Comment", $btnFont, $whiteBrush, $btnRectF, $sfCenter)

# Save as 24-bit PNG without alpha or JPEG
$savePath = "d:\pak digital fb lead generation\screenshot_1280x800.png"
$bmp.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Png)

$saveJpg = "d:\pak digital fb lead generation\screenshot_1280x800.jpg"
$bmp.Save($saveJpg, [System.Drawing.Imaging.ImageFormat]::Jpeg)

$g.Dispose()
$bmp.Dispose()

Write-Host "Screenshot generated successfully: $savePath & $saveJpg"