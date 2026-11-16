Add-Type -AssemblyName System.Drawing
. "$PSScriptRoot\drawing_helpers.ps1"

$bmp = New-Object System.Drawing.Bitmap 1600, 672
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))

# Background container card
Draw-Card $g 20 20 1560 632 16 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(226, 232, 240)) "DATA FLOW DIAGRAM (DFD LEVEL 0 & LEVEL 1)" ([System.Drawing.Color]::FromArgb(30, 41, 59)) ([System.Drawing.Color]::FromArgb(241, 245, 249)) 2

# Sub-banner
$fSub = New-Object System.Drawing.Font("Segoe UI", 9.5)
$bSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
$g.DrawString("Level 0: High-Level Context Flow | Level 1: Multi-Process Functional Decomposition with Data Stores", $fSub, $bSub, 470, 28)
$fSub.Dispose()
$bSub.Dispose()

# Helper for DFD Entity (Rectangle with double border)
function Draw-DFDEntity($g, $x, $y, $w, $h, $name, $sub, $bgColor, $borderColor, $textColor) {
    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $brush = New-Object System.Drawing.SolidBrush $bgColor
    $pen = New-Object System.Drawing.Pen $borderColor, 2
    $g.FillRectangle($brush, $rect)
    $g.DrawRectangle($pen, $rect)

    $fName = New-Object System.Drawing.Font("Segoe UI", 9.2, [System.Drawing.FontStyle]::Bold)
    $bText = New-Object System.Drawing.SolidBrush $textColor
    $size = $g.MeasureString($name, $fName)
    
    if ($sub -ne $null -and $sub -ne "") {
        $fSub = New-Object System.Drawing.Font("Segoe UI", 8.0)
        $bSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
        $sizeS = $g.MeasureString($sub, $fSub)
        $g.DrawString($name, $fName, $bText, ($x + ($w - $size.Width)/2), ($y + $h/2 - 14))
        $g.DrawString($sub, $fSub, $bSub, ($x + ($w - $sizeS.Width)/2), ($y + $h/2 + 4))
        $fSub.Dispose()
        $bSub.Dispose()
    } else {
        $g.DrawString($name, $fName, $bText, ($x + ($w - $size.Width)/2), ($y + ($h - $size.Height)/2))
    }

    $brush.Dispose()
    $pen.Dispose()
    $fName.Dispose()
    $bText.Dispose()
}

# Helper for DFD Process (Rounded Rectangle with process number header)
function Draw-DFDProcess($g, $x, $y, $w, $h, $id, $name, $sub, $bgColor, $borderColor, $textColor) {
    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $path = Create-RoundedPath $rect 12
    $brush = New-Object System.Drawing.SolidBrush $bgColor
    $pen = New-Object System.Drawing.Pen $borderColor, 2
    $g.FillPath($brush, $path)
    $g.DrawPath($pen, $path)

    # Process ID divider
    $g.DrawLine($pen, $x, ($y + 24), ($x + $w), ($y + 24))

    $fId = New-Object System.Drawing.Font("Segoe UI", 8.0, [System.Drawing.FontStyle]::Bold)
    $bId = New-Object System.Drawing.SolidBrush($borderColor)
    $g.DrawString($id, $fId, $bId, ($x + 8), ($y + 4))

    $fName = New-Object System.Drawing.Font("Segoe UI", 9.0, [System.Drawing.FontStyle]::Bold)
    $bText = New-Object System.Drawing.SolidBrush $textColor
    $size = $g.MeasureString($name, $fName)

    if ($sub -ne $null -and $sub -ne "") {
        $fSub = New-Object System.Drawing.Font("Segoe UI", 7.8)
        $bSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
        $sizeS = $g.MeasureString($sub, $fSub)
        $g.DrawString($name, $fName, $bText, ($x + ($w - $size.Width)/2), ($y + 30))
        $g.DrawString($sub, $fSub, $bSub, ($x + ($w - $sizeS.Width)/2), ($y + 48))
        $fSub.Dispose()
        $bSub.Dispose()
    } else {
        $g.DrawString($name, $fName, $bText, ($x + ($w - $size.Width)/2), ($y + 34))
    }

    $brush.Dispose()
    $pen.Dispose()
    $fId.Dispose()
    $bId.Dispose()
    $fName.Dispose()
    $bText.Dispose()
    $path.Dispose()
}

# Helper for DFD Data Store (Two parallel lines with ID)
function Draw-DFDStore($g, $x, $y, $w, $h, $id, $name) {
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(13, 148, 136), 2)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 253, 250))
    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $g.FillRectangle($brush, $rect)
    $g.DrawLine($pen, $x, $y, ($x + $w), $y)
    $g.DrawLine($pen, $x, ($y + $h), ($x + $w), ($y + $h))
    $g.DrawLine($pen, ($x + 36), $y, ($x + 36), ($y + $h))

    $fId = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
    $bId = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(13, 148, 136))
    $g.DrawString($id, $fId, $bId, ($x + 8), ($y + $h/2 - 7))

    $fName = New-Object System.Drawing.Font("Segoe UI", 9.0, [System.Drawing.FontStyle]::Bold)
    $bName = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.DrawString($name, $fName, $bName, ($x + 44), ($y + $h/2 - 7))

    $pen.Dispose()
    $brush.Dispose()
    $fId.Dispose()
    $bId.Dispose()
    $fName.Dispose()
    $bName.Dispose()
}

$penFlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(99, 102, 241), 1.8)

# ==================== LEFT SIDE: DFD LEVEL 0 (CONTEXT) ====================
Draw-Card $g 40 70 540 555 12 ([System.Drawing.Color]::FromArgb(248, 250, 252)) ([System.Drawing.Color]::FromArgb(226, 232, 240)) "DFD LEVEL 0 — CONTEXT DIAGRAM" ([System.Drawing.Color]::FromArgb(67, 56, 202)) ([System.Drawing.Color]::FromArgb(224, 231, 255)) 2

# Entity: User (Top Left)
Draw-DFDEntity $g 60 130 180 65 "User" "Researcher / Shopper" ([System.Drawing.Color]::FromArgb(238, 242, 255)) ([System.Drawing.Color]::FromArgb(99, 102, 241)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# Entity: Amazon & Flipkart (Bottom Left)
Draw-DFDEntity $g 60 480 180 65 "Retail Platforms" "Amazon.in & Flipkart" ([System.Drawing.Color]::FromArgb(254, 243, 199)) ([System.Drawing.Color]::FromArgb(217, 119, 6)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# Process: 0.0 System (Center)
Draw-DFDProcess $g 320 280 230 100 "0.0" "Dynamic Price Tracker" "Core Web Engine & Scheduler" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(79, 70, 229)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# Data Store: PostgreSQL (Bottom Right)
Draw-DFDStore $g 340 480 200 45 "D1" "PostgreSQL Relational DB"

# Level 0 Flows
# User -> System: URLs, Group IDs, Date Range
Draw-ArrowLine $g $penFlow 240 150 350 280 "URLs, Group Names, Filters" ([System.Drawing.Color]::FromArgb(79, 70, 229))
# System -> User: Dashboards, Comparison Stats
Draw-ArrowLine $g $penFlow 320 310 240 180 "Charts, Stats & Alerts" ([System.Drawing.Color]::FromArgb(79, 70, 229))

# System -> Retailers: HTTP GET / DOM Query
Draw-ArrowLine $g $penFlow 350 380 200 480 "HTTP GET / Headless Render" ([System.Drawing.Color]::FromArgb(180, 83, 9))
# Retailers -> System: HTML / JSON-LD / Price Nodes
Draw-ArrowLine $g $penFlow 240 500 370 380 "HTML & Price DOM" ([System.Drawing.Color]::FromArgb(180, 83, 9))

# System <-> Database
Draw-ArrowLine $g $penFlow 440 380 440 480 "SQL Read/Write" ([System.Drawing.Color]::FromArgb(13, 148, 136))


# ==================== RIGHT SIDE: DFD LEVEL 1 (DECOMPOSITION) ====================
Draw-Card $g 610 70 950 555 12 ([System.Drawing.Color]::FromArgb(248, 250, 252)) ([System.Drawing.Color]::FromArgb(226, 232, 240)) "DFD LEVEL 1 — PROCESS DECOMPOSITION" ([System.Drawing.Color]::FromArgb(15, 118, 110)) ([System.Drawing.Color]::FromArgb(204, 251, 241)) 2

# Process 1.0: Product & Group Management (Top Left)
Draw-DFDProcess $g 630 130 220 75 "1.0" "Product Management" "CRUD & URL Validation" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(13, 148, 136)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# Process 2.0: Scraping Engine (Center Top)
Draw-DFDProcess $g 930 130 220 75 "2.0" "Price Scraping Engine" "Cheerio + Puppeteer" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(13, 148, 136)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# Process 3.0: Price Ingestion & Storage (Center)
Draw-DFDProcess $g 930 280 220 75 "3.0" "Price History Ingestion" "Sanitize & Record" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(13, 148, 136)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# Process 4.0: Compare Engine (Bottom Center)
Draw-DFDProcess $g 930 430 220 75 "4.0" "RQ1 Comparison Engine" "Min, Max, Avg, StdDev, Δ%" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(13, 148, 136)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# Process 5.0: Visual Dashboard (Bottom Left)
Draw-DFDProcess $g 630 430 220 75 "5.0" "Visual Analytics UI" "Recharts Multi-Series" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(13, 148, 136)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# Data Stores
Draw-DFDStore $g 1250 145 270 42 "D1" "products table"
Draw-DFDStore $g 1250 220 270 42 "D2" "product_groups table"
Draw-DFDStore $g 1250 350 270 42 "D3" "price_history table"
Draw-DFDStore $g 1250 480 270 42 "D4" "External Retail Sites"

# Level 1 Flows
# 1.0 -> D1 & D2
Draw-ArrowLine $g $penFlow 850 150 1250 155 "Save Product" ([System.Drawing.Color]::FromArgb(13, 148, 136))
Draw-ArrowLine $g $penFlow 850 180 1250 230 "Save Group" ([System.Drawing.Color]::FromArgb(13, 148, 136))

# 1.0 triggers 2.0
Draw-ArrowLine $g $penFlow 850 160 930 160 "New URL" ([System.Drawing.Color]::FromArgb(79, 70, 229))

# 2.0 <-> D4 External Sites
Draw-ArrowLine $g $penFlow 1150 150 1250 480 "Scrape Query" ([System.Drawing.Color]::FromArgb(180, 83, 9))
Draw-ArrowLine $g $penFlow 1250 500 1150 180 "Raw HTML" ([System.Drawing.Color]::FromArgb(180, 83, 9))

# 2.0 -> 3.0: Extracted Price
Draw-ArrowLine $g $penFlow 1040 205 1040 280 "Extracted Price" ([System.Drawing.Color]::FromArgb(13, 148, 136))

# 3.0 -> D3: Append Price History
Draw-ArrowLine $g $penFlow 1150 310 1250 360 "INSERT Price" ([System.Drawing.Color]::FromArgb(13, 148, 136))

# 4.0 reads from D3
Draw-ArrowLine $g $penFlow 1250 380 1150 440 "Fetch History" ([System.Drawing.Color]::FromArgb(13, 148, 136))

# 4.0 -> 5.0: Computed Volatility & Series Data
Draw-ArrowLine $g $penFlow 930 465 850 465 "Aggregates & Series" ([System.Drawing.Color]::FromArgb(13, 148, 136))

$penFlow.Dispose()

$bmp.Save("$PSScriptRoot\diagram_12_dataflow.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "Generated diagram_12_dataflow.png successfully!"
