Add-Type -AssemblyName System.Drawing
. "$PSScriptRoot\drawing_helpers.ps1"

function Draw-BrowserHeader($g, $w, $url) {
    # Window header bar
    $hRect = New-Object System.Drawing.Rectangle 0, 0, $w, 36
    $hBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))
    $g.FillRectangle($hBrush, $hRect)
    $hBrush.Dispose()

    # Window dots
    $bRed = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239, 68, 68))
    $bYellow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 158, 11))
    $bGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))
    $g.FillEllipse($bRed, 14, 13, 10, 10)
    $g.FillEllipse($bYellow, 30, 13, 10, 10)
    $g.FillEllipse($bGreen, 46, 13, 10, 10)
    $bRed.Dispose(); $bYellow.Dispose(); $bGreen.Dispose()

    # URL bar
    $urlRect = New-Object System.Drawing.Rectangle 70, 7, ($w - 85), 22
    $urlBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $urlPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), 1)
    $g.FillRectangle($urlBrush, $urlRect)
    $g.DrawRectangle($urlPen, $urlRect)
    $fUrl = New-Object System.Drawing.Font("Segoe UI", 7.8)
    $bUrl = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
    $g.DrawString($url, $fUrl, $bUrl, 78, 10)
    $urlBrush.Dispose(); $urlPen.Dispose(); $fUrl.Dispose(); $bUrl.Dispose()

    # App navbar
    $navRect = New-Object System.Drawing.Rectangle 0, 36, $w, 32
    $navBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.FillRectangle($navBrush, $navRect)
    $navBrush.Dispose()

    $fLogo = New-Object System.Drawing.Font("Segoe UI", 9.0, [System.Drawing.FontStyle]::Bold)
    $bLogo = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString("⚡ PriceTracker", $fLogo, $bLogo, 14, 42)
    $fLogo.Dispose(); $bLogo.Dispose()

    # Tabs
    $fTab = New-Object System.Drawing.Font("Segoe UI", 8.0)
    $bTabActive = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(99, 102, 241))
    $bTab = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))
    $g.DrawString("Products", $fTab, $bTabActive, 140, 44)
    $g.DrawString("Compare (RQ1)", $fTab, $bTab, 210, 44)
    $g.DrawString("Analytics", $fTab, $bTab, 310, 44)
    $fTab.Dispose(); $bTabActive.Dispose(); $bTab.Dispose()
}

# ==================== 1. SCREENSHOT: HOME DASHBOARD ====================
function Generate-HomeScreenshot {
    $w = 640; $h = 500
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))

    Draw-BrowserHeader $g $w "http://localhost:5173/products"

    # Page Header
    $fHeader = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $bDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.DrawString("Tracked Products", $fHeader, $bDark, 14, 76)
    $fHeader.Dispose()

    # Buttons
    Draw-Badge $g 450 75 "+ Add Product" ([System.Drawing.Color]::FromArgb(79, 70, 229)) ([System.Drawing.Color]::White) | Out-Null
    Draw-Badge $g 550 75 "🔄 Refresh" ([System.Drawing.Color]::FromArgb(16, 185, 129)) ([System.Drawing.Color]::White) | Out-Null

    # KPI mini-cards
    $kpis = @(
        @{ label="Total Tracked"; val="8 Products"; bg=[System.Drawing.Color]::FromArgb(238, 242, 255); tc=[System.Drawing.Color]::FromArgb(67, 56, 202) },
        @{ label="Groups (RQ1)"; val="4 Groups"; bg=[System.Drawing.Color]::FromArgb(240, 253, 250); tc=[System.Drawing.Color]::FromArgb(15, 118, 110) },
        @{ label="Platforms"; val="Amazon & Flipkart"; bg=[System.Drawing.Color]::FromArgb(255, 251, 235); tc=[System.Drawing.Color]::FromArgb(180, 83, 9) }
    )
    for ($i = 0; $i -lt 3; $i++) {
        $kx = 14 + ($i * 206)
        $krect = New-Object System.Drawing.Rectangle $kx, 108, 198, 48
        $kpath = Create-RoundedPath $krect 8
        $kbrush = New-Object System.Drawing.SolidBrush $kpis[$i].bg
        $g.FillPath($kbrush, $kpath)
        $fL = New-Object System.Drawing.Font("Segoe UI", 7.5)
        $fV = New-Object System.Drawing.Font("Segoe UI", 10.0, [System.Drawing.FontStyle]::Bold)
        $bT = New-Object System.Drawing.SolidBrush $kpis[$i].tc
        $g.DrawString($kpis[$i].label, $fL, $bT, ($kx + 10), 114)
        $g.DrawString($kpis[$i].val, $fV, $bT, ($kx + 10), 130)
        $kpath.Dispose(); $kbrush.Dispose(); $fL.Dispose(); $fV.Dispose(); $bT.Dispose()
    }

    # Product Table Card
    $tRect = New-Object System.Drawing.Rectangle 14, 168, 612, 318
    $tPath = Create-RoundedPath $tRect 8
    $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $tPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), 1)
    $g.FillPath($tBrush, $tPath)
    $g.DrawPath($tPen, $tPath)
    $tPath.Dispose(); $tBrush.Dispose(); $tPen.Dispose()

    # Table Header Row
    $thBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))
    $g.FillRectangle($thBrush, 15, 169, 610, 28)
    $thBrush.Dispose()

    $fTh = New-Object System.Drawing.Font("Segoe UI", 8.0, [System.Drawing.FontStyle]::Bold)
    $bTh = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))
    $g.DrawString("PRODUCT NAME", $fTh, $bTh, 24, 175)
    $g.DrawString("PLATFORM", $fTh, $bTh, 240, 175)
    $g.DrawString("CURRENT PRICE", $fTh, $bTh, 330, 175)
    $g.DrawString("LAST SCRAPED", $fTh, $bTh, 450, 175)
    $g.DrawString("STATUS", $fTh, $bTh, 545, 175)
    $fTh.Dispose(); $bTh.Dispose()

    # Table Rows
    $rows = @(
        @{ name="Sony WH-1000XM5 ANC Headphones"; plat="Amazon.in"; pbg=[System.Drawing.Color]::FromArgb(254, 243, 199); ptc=[System.Drawing.Color]::FromArgb(180, 83, 9); price="₹26,990"; time="12m ago"; status="Active" },
        @{ name="Sony WH-1000XM5 ANC Headphones"; plat="Flipkart"; pbg=[System.Drawing.Color]::FromArgb(239, 246, 255); ptc=[System.Drawing.Color]::FromArgb(29, 78, 216); price="₹25,490"; time="12m ago"; status="Active" },
        @{ name="Apple iPhone 15 (128GB, Blue)"; plat="Amazon.in"; pbg=[System.Drawing.Color]::FromArgb(254, 243, 199); ptc=[System.Drawing.Color]::FromArgb(180, 83, 9); price="₹69,999"; time="45m ago"; status="Active" },
        @{ name="Apple iPhone 15 (128GB, Blue)"; plat="Flipkart"; pbg=[System.Drawing.Color]::FromArgb(239, 246, 255); ptc=[System.Drawing.Color]::FromArgb(29, 78, 216); price="₹68,999"; time="45m ago"; status="Active" },
        @{ name="boAt Airdopes 141 Wireless Earbuds"; plat="Amazon.in"; pbg=[System.Drawing.Color]::FromArgb(254, 243, 199); ptc=[System.Drawing.Color]::FromArgb(180, 83, 9); price="₹1,099"; time="2h ago"; status="Active" },
        @{ name="boAt Airdopes 141 Wireless Earbuds"; plat="Flipkart"; pbg=[System.Drawing.Color]::FromArgb(239, 246, 255); ptc=[System.Drawing.Color]::FromArgb(29, 78, 216); price="₹1,149"; time="2h ago"; status="Active" }
    )

    $fRow = New-Object System.Drawing.Font("Segoe UI", 8.2)
    $fPrice = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
    $bRow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 41, 59))
    $bTime = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
    $pLine = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(241, 245, 249), 1)

    for ($i = 0; $i -lt $rows.Count; $i++) {
        $ry = 202 + ($i * 44)
        $g.DrawLine($pLine, 15, $ry, 625, $ry)
        $g.DrawString($rows[$i].name, $fRow, $bRow, 24, ($ry + 10))
        Draw-Badge $g 240 ($ry + 8) $rows[$i].plat $rows[$i].pbg $rows[$i].ptc | Out-Null
        $g.DrawString($rows[$i].price, $fPrice, $bRow, 330, ($ry + 10))
        $g.DrawString($rows[$i].time, $fRow, $bTime, 450, ($ry + 10))
        Draw-Badge $g 545 ($ry + 8) "● Active" ([System.Drawing.Color]::FromArgb(236, 253, 245)) ([System.Drawing.Color]::FromArgb(6, 95, 70)) | Out-Null
    }

    $fRow.Dispose(); $fPrice.Dispose(); $bRow.Dispose(); $bTime.Dispose(); $pLine.Dispose(); $bDark.Dispose()

    $bmp.Save("$PSScriptRoot\screenshot_15_home.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "Generated screenshot_15_home.png"
}

# ==================== 2. SCREENSHOT: PRODUCT DETAIL CHART ====================
function Generate-DetailScreenshot {
    $w = 640; $h = 500
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))

    Draw-BrowserHeader $g $w "http://localhost:5173/products/1"

    # Title & Badge
    $fTitle = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $bDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.DrawString("Sony WH-1000XM5 Wireless Headphones", $fTitle, $bDark, 14, 76)
    Draw-Badge $g 450 75 "Amazon.in Listing" ([System.Drawing.Color]::FromArgb(254, 243, 199)) ([System.Drawing.Color]::FromArgb(180, 83, 9)) | Out-Null
    $fTitle.Dispose()

    # Stat cards
    $stats = @(
        @{ l="CURRENT PRICE"; v="₹26,990"; tc=[System.Drawing.Color]::FromArgb(79, 70, 229) },
        @{ l="LOWEST PRICE"; v="₹24,990"; tc=[System.Drawing.Color]::FromArgb(16, 185, 129) },
        @{ l="HIGHEST PRICE"; v="₹29,990"; tc=[System.Drawing.Color]::FromArgb(239, 68, 68) },
        @{ l="TOTAL SCRAPES"; v="56 Points"; tc=[System.Drawing.Color]::FromArgb(15, 118, 110) }
    )
    for ($i = 0; $i -lt 4; $i++) {
        $sx = 14 + ($i * 154)
        $srect = New-Object System.Drawing.Rectangle $sx, 108, 146, 52
        $spath = Create-RoundedPath $srect 8
        $sbrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $spen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), 1)
        $g.FillPath($sbrush, $spath)
        $g.DrawPath($spen, $spath)
        $fL = New-Object System.Drawing.Font("Segoe UI", 7.0, [System.Drawing.FontStyle]::Bold)
        $fV = New-Object System.Drawing.Font("Segoe UI", 11.0, [System.Drawing.FontStyle]::Bold)
        $bM = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
        $bV = New-Object System.Drawing.SolidBrush $stats[$i].tc
        $g.DrawString($stats[$i].l, $fL, $bM, ($sx + 10), 114)
        $g.DrawString($stats[$i].v, $fV, $bV, ($sx + 10), 130)
        $spath.Dispose(); $sbrush.Dispose(); $spen.Dispose(); $fL.Dispose(); $fV.Dispose(); $bM.Dispose(); $bV.Dispose()
    }

    # Chart Container Card
    $cRect = New-Object System.Drawing.Rectangle 14, 172, 612, 314
    $cPath = Create-RoundedPath $cRect 8
    $cBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $cPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), 1)
    $g.FillPath($cBrush, $cPath)
    $g.DrawPath($cPen, $cPath)
    $cPath.Dispose(); $cBrush.Dispose(); $cPen.Dispose()

    # Chart Title
    $fCTitle = New-Object System.Drawing.Font("Segoe UI", 8.8, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("14-Day Price History Trend (Recharts Time-Series)", $fCTitle, $bDark, 26, 184)
    $fCTitle.Dispose()

    # Chart Grid & Axes
    # Chart area: x=60..590 (w=530), y=220..440 (h=220)
    $pGrid = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(241, 245, 249), 1)
    $fAxis = New-Object System.Drawing.Font("Segoe UI", 7.5)
    $bAxis = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))

    # Y-axis ticks (24k to 30k)
    $yVals = @("₹30,000", "₹28,500", "₹27,000", "₹25,500", "₹24,000")
    for ($i = 0; $i -lt 5; $i++) {
        $gy = 220 + ($i * 50)
        $g.DrawLine($pGrid, 65, $gy, 590, $gy)
        $g.DrawString($yVals[$i], $fAxis, $bAxis, 18, ($gy - 6))
    }

    # X-axis ticks (Dates)
    $xDates = @("Nov 1", "Nov 3", "Nov 5", "Nov 7", "Nov 9", "Nov 11", "Nov 13", "Nov 14")
    for ($i = 0; $i -lt 8; $i++) {
        $gx = 70 + ($i * 74)
        $g.DrawLine($pGrid, $gx, 220, $gx, 420)
        $g.DrawString($xDates[$i], $fAxis, $bAxis, ($gx - 14), 430)
    }

    # Data points for line chart
    # Y-range: 24,000 = y:420, 30,000 = y:220 (200px = 6000 => 1px = 30)
    $ptsData = @(
        [System.Drawing.PointF]::new(70,  235), # 29,550
        [System.Drawing.PointF]::new(120, 240), # 29,400
        [System.Drawing.PointF]::new(170, 270), # 28,500
        [System.Drawing.PointF]::new(220, 270), # 28,500
        [System.Drawing.PointF]::new(270, 310), # 27,300
        [System.Drawing.PointF]::new(320, 390), # 24,990 (Flash Drop)
        [System.Drawing.PointF]::new(370, 380), # 25,300
        [System.Drawing.PointF]::new(420, 340), # 26,500
        [System.Drawing.PointF]::new(470, 320), # 27,100
        [System.Drawing.PointF]::new(520, 325), # 26,990
        [System.Drawing.PointF]::new(580, 325)  # 26,990
    )

    # Shaded Area under curve
    $areaPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $areaPath.AddLines($ptsData)
    $areaPath.AddLine(580, 420, 70, 420)
    $areaPath.CloseFigure()
    $bArea = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 99, 102, 241))
    $g.FillPath($bArea, $areaPath)
    $areaPath.Dispose(); $bArea.Dispose()

    # Draw Line Curve
    $pLine = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(99, 102, 241), 2.5)
    $g.DrawLines($pLine, $ptsData)
    $pLine.Dispose()

    # Draw Points & Tooltip at lowest price
    $bPoint = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(99, 102, 241))
    $bPointInner = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    foreach ($pt in $ptsData) {
        $g.FillEllipse($bPoint, ($pt.X - 4), ($pt.Y - 4), 8, 8)
        $g.FillEllipse($bPointInner, ($pt.X - 2), ($pt.Y - 2), 4, 4)
    }

    # Tooltip callout at flash drop (x=320, y=390)
    $ttRect = New-Object System.Drawing.Rectangle 260, 330, 125, 40
    $ttPath = Create-RoundedPath $ttRect 6
    $bTt = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.FillPath($bTt, $ttPath)
    $fTt1 = New-Object System.Drawing.Font("Segoe UI", 7.5, [System.Drawing.FontStyle]::Bold)
    $fTt2 = New-Object System.Drawing.Font("Segoe UI", 7.0)
    $bW = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $bYG = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(52, 211, 153))
    $g.DrawString("₹24,990 (Lowest)", $fTt1, $bYG, 268, 334)
    $g.DrawString("Nov 10 — Flash Deal", $fTt2, $bW, 268, 350)
    $ttPath.Dispose(); $bTt.Dispose(); $fTt1.Dispose(); $fTt2.Dispose(); $bW.Dispose(); $bYG.Dispose()

    $pGrid.Dispose(); $fAxis.Dispose(); $bAxis.Dispose(); $bPoint.Dispose(); $bPointInner.Dispose(); $bDark.Dispose()

    $bmp.Save("$PSScriptRoot\screenshot_15_detail.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "Generated screenshot_15_detail.png"
}

# ==================== 3. SCREENSHOT: COMPARE (RQ1) ====================
function Generate-CompareScreenshot {
    $w = 640; $h = 500
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))

    Draw-BrowserHeader $g $w "http://localhost:5173/compare?group=1"

    # Header
    $fTitle = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $bDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.DrawString("Cross-Platform Price Fluctuation (RQ1)", $fTitle, $bDark, 14, 76)
    $fTitle.Dispose()

    Draw-Badge $g 470 75 "Group: Sony WH-1000XM5" ([System.Drawing.Color]::FromArgb(243, 232, 255)) ([System.Drawing.Color]::FromArgb(107, 33, 168)) | Out-Null

    # Dual-Line Chart Card
    $cRect = New-Object System.Drawing.Rectangle 14, 108, 612, 215
    $cPath = Create-RoundedPath $cRect 8
    $cBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $cPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), 1)
    $g.FillPath($cBrush, $cPath)
    $g.DrawPath($cPen, $cPath)
    $cPath.Dispose(); $cBrush.Dispose(); $cPen.Dispose()

    # Legend inside chart
    Draw-Badge $g 360 116 "■ Amazon.in" ([System.Drawing.Color]::FromArgb(254, 243, 199)) ([System.Drawing.Color]::FromArgb(180, 83, 9)) | Out-Null
    Draw-Badge $g 470 116 "■ Flipkart.com" ([System.Drawing.Color]::FromArgb(239, 246, 255)) ([System.Drawing.Color]::FromArgb(29, 78, 216)) | Out-Null

    $fCTitle = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("14-Day Comparative Trajectory", $fCTitle, $bDark, 26, 118)
    $fCTitle.Dispose()

    # Grid & Axes
    $pGrid = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(241, 245, 249), 1)
    $fAxis = New-Object System.Drawing.Font("Segoe UI", 7.2)
    $bAxis = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))

    for ($i = 0; $i -lt 4; $i++) {
        $gy = 145 + ($i * 45)
        $g.DrawLine($pGrid, 65, $gy, 590, $gy)
    }
    $g.DrawString("₹30k", $fAxis, $bAxis, 30, 140)
    $g.DrawString("₹28k", $fAxis, $bAxis, 30, 185)
    $g.DrawString("₹26k", $fAxis, $bAxis, 30, 230)
    $g.DrawString("₹24k", $fAxis, $bAxis, 30, 275)

    # Dates
    $xDates = @("Nov 1", "Nov 4", "Nov 7", "Nov 10", "Nov 12", "Nov 14")
    for ($i = 0; $i -lt 6; $i++) {
        $gx = 70 + ($i * 100)
        $g.DrawLine($pGrid, $gx, 145, $gx, 285)
        $g.DrawString($xDates[$i], $fAxis, $bAxis, ($gx - 12), 295)
    }

    # Amazon Line (Orange)
    $ptsAmz = @(
        [System.Drawing.PointF]::new(70,  155),
        [System.Drawing.PointF]::new(140, 160),
        [System.Drawing.PointF]::new(210, 180),
        [System.Drawing.PointF]::new(280, 200),
        [System.Drawing.PointF]::new(350, 255), # 25,990 drop
        [System.Drawing.PointF]::new(420, 240),
        [System.Drawing.PointF]::new(490, 225),
        [System.Drawing.PointF]::new(570, 225)
    )
    $pAmz = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(217, 119, 6), 2.2)
    $g.DrawLines($pAmz, $ptsAmz)
    $pAmz.Dispose()

    # Flipkart Line (Blue)
    $ptsFlp = @(
        [System.Drawing.PointF]::new(70,  180),
        [System.Drawing.PointF]::new(140, 195),
        [System.Drawing.PointF]::new(210, 210),
        [System.Drawing.PointF]::new(280, 215),
        [System.Drawing.PointF]::new(350, 280), # 24,490 lowest
        [System.Drawing.PointF]::new(420, 260),
        [System.Drawing.PointF]::new(490, 245),
        [System.Drawing.PointF]::new(570, 245)
    )
    $pFlp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(37, 99, 235), 2.2)
    $g.DrawLines($pFlp, $ptsFlp)
    $pFlp.Dispose()

    # Compare Statistics Table Card
    $tRect = New-Object System.Drawing.Rectangle 14, 332, 612, 154
    $tPath = Create-RoundedPath $tRect 8
    $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $tPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), 1)
    $g.FillPath($tBrush, $tPath)
    $g.DrawPath($tPen, $tPath)
    $tPath.Dispose(); $tBrush.Dispose(); $tPen.Dispose()

    # Table Header Row
    $thBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))
    $g.FillRectangle($thBrush, 15, 333, 610, 26)
    $thBrush.Dispose()

    $fTh = New-Object System.Drawing.Font("Segoe UI", 7.8, [System.Drawing.FontStyle]::Bold)
    $bTh = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))
    $g.DrawString("RQ1 STATISTICAL METRIC", $fTh, $bTh, 24, 339)
    $g.DrawString("AMAZON INDIA", $fTh, $bTh, 210, 339)
    $g.DrawString("FLIPKART", $fTh, $bTh, 340, 339)
    $g.DrawString("CROSS-PLATFORM DIFFERENCE", $fTh, $bTh, 450, 339)
    $fTh.Dispose(); $bTh.Dispose()

    # Table rows
    $statRows = @(
        @{ m="Minimum Price"; a="₹25,990"; f="₹24,490"; d="Flipkart lower by ₹1,500"; dc=[System.Drawing.Color]::FromArgb(16, 185, 129) },
        @{ m="Maximum Price"; a="₹29,990"; f="₹28,990"; d="Flipkart lower by ₹1,000"; dc=[System.Drawing.Color]::FromArgb(16, 185, 129) },
        @{ m="Average Price (μ)"; a="₹27,420"; f="₹26,110"; d="Flipkart -4.8% on average"; dc=[System.Drawing.Color]::FromArgb(16, 185, 129) },
        @{ m="Standard Deviation (σ)"; a="₹1,245.80"; f="₹1,680.50"; d="Flipkart higher volatility (RQ1)"; dc=[System.Drawing.Color]::FromArgb(217, 119, 6) }
    )

    $fRow = New-Object System.Drawing.Font("Segoe UI", 8.0)
    $fRowB = New-Object System.Drawing.Font("Segoe UI", 8.0, [System.Drawing.FontStyle]::Bold)
    $bRow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 41, 59))
    $pLine = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(241, 245, 249), 1)

    for ($i = 0; $i -lt $statRows.Count; $i++) {
        $ry = 362 + ($i * 28)
        $g.DrawLine($pLine, 15, $ry, 625, $ry)
        $g.DrawString($statRows[$i].m, $fRowB, $bRow, 24, ($ry + 6))
        $g.DrawString($statRows[$i].a, $fRow, $bRow, 210, ($ry + 6))
        $g.DrawString($statRows[$i].f, $fRow, $bRow, 340, ($ry + 6))
        $bD = New-Object System.Drawing.SolidBrush $statRows[$i].dc
        $g.DrawString($statRows[$i].d, $fRowB, $bD, 450, ($ry + 6))
        $bD.Dispose()
    }

    $fRow.Dispose(); $fRowB.Dispose(); $bRow.Dispose(); $pLine.Dispose(); $pGrid.Dispose(); $fAxis.Dispose(); $bAxis.Dispose(); $bDark.Dispose()

    $bmp.Save("$PSScriptRoot\screenshot_15_compare.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "Generated screenshot_15_compare.png"
}

Generate-HomeScreenshot
Generate-DetailScreenshot
Generate-CompareScreenshot
