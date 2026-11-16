Add-Type -AssemblyName System.Drawing
. "$PSScriptRoot\drawing_helpers.ps1"

$bmp = New-Object System.Drawing.Bitmap 1600, 672
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))

# Background container card
Draw-Card $g 20 20 1560 632 16 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(226, 232, 240)) "UML USE CASE DIAGRAM" ([System.Drawing.Color]::FromArgb(30, 41, 59)) ([System.Drawing.Color]::FromArgb(241, 245, 249)) 2

# Sub-banner
$fSub = New-Object System.Drawing.Font("Segoe UI", 9.5)
$bSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
$g.DrawString("Functional Use Cases, User Interactions and Autonomous Background Scheduler Operations", $fSub, $bSub, 460, 28)
$fSub.Dispose()
$bSub.Dispose()

# --- SYSTEM BOUNDARY BOX (Center: x=280..1300, y=70..620) ---
$sbX = 270; $sbY = 70; $sbW = 1040; $sbH = 555
$penBoundary = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(99, 102, 241), 2)
$penBoundary.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$brushBoundary = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(250, 250, 255))
$g.FillRectangle($brushBoundary, $sbX, $sbY, $sbW, $sbH)
$g.DrawRectangle($penBoundary, $sbX, $sbY, $sbW, $sbH)

$fBoundary = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$bBoundary = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(67, 56, 202))
$g.DrawString("System Boundary: Dynamic Price Tracker Platform", $fBoundary, $bBoundary, ($sbX + 20), ($sbY + 12))
$fBoundary.Dispose()
$bBoundary.Dispose()

# --- ACTOR 1: USER / RESEARCHER (Left: x=40..240) ---
function Draw-StickActor($g, $centerX, $centerY, $name, $role) {
    $penActor = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 41, 59), 3)
    $brushHead = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(224, 231, 255))
    
    # Head
    $g.FillEllipse($brushHead, ($centerX - 22), ($centerY - 70), 44, 44)
    $g.DrawEllipse($penActor, ($centerX - 22), ($centerY - 70), 44, 44)
    # Body
    $g.DrawLine($penActor, $centerX, ($centerY - 26), $centerX, ($centerY + 35))
    # Arms
    $g.DrawLine($penActor, ($centerX - 35), ($centerY - 5), ($centerX + 35), ($centerY - 5))
    # Legs
    $g.DrawLine($penActor, $centerX, ($centerY + 35), ($centerX - 25), ($centerY + 85))
    $g.DrawLine($penActor, $centerX, ($centerY + 35), ($centerX + 25), ($centerY + 85))

    # Name label
    $fName = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $bName = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $size = $g.MeasureString($name, $fName)
    $g.DrawString($name, $fName, $bName, ($centerX - $size.Width/2), ($centerY + 95))
    
    # Role label
    $fRole = New-Object System.Drawing.Font("Segoe UI", 8.5)
    $bRole = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
    $sizeR = $g.MeasureString($role, $fRole)
    $g.DrawString($role, $fRole, $bRole, ($centerX - $sizeR.Width/2), ($centerY + 115))

    $penActor.Dispose()
    $brushHead.Dispose()
    $fName.Dispose()
    $bName.Dispose()
    $fRole.Dispose()
    $bRole.Dispose()
}

Draw-StickActor $g 140 280 "User / Researcher" "Primary Actor (Shopper / Analyst)"

# --- ACTOR 2: BACKGROUND SCHEDULER (Right: x=1340..1560) ---
function Draw-SystemActor($g, $centerX, $centerY, $name, $role) {
    # Server / Clock icon
    $penActor = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(13, 148, 136), 2.5)
    $brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(204, 251, 241))
    
    # Server stack
    for ($i = 0; $i -lt 3; $i++) {
        $sy = ($centerY - 60) + ($i * 30)
        $g.FillRectangle($brushBg, ($centerX - 38), $sy, 76, 22)
        $g.DrawRectangle($penActor, ($centerX - 38), $sy, 76, 22)
        # Small LED
        $bLed = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))
        $g.FillEllipse($bLed, ($centerX + 22), ($sy + 6), 8, 8)
        $bLed.Dispose()
    }

    # Name label
    $fName = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $bName = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $size = $g.MeasureString($name, $fName)
    $g.DrawString($name, $fName, $bName, ($centerX - $size.Width/2), ($centerY + 45))
    
    # Role label
    $fRole = New-Object System.Drawing.Font("Segoe UI", 8.5)
    $bRole = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
    $sizeR = $g.MeasureString($role, $fRole)
    $g.DrawString($role, $fRole, $bRole, ($centerX - $sizeR.Width/2), ($centerY + 65))

    $penActor.Dispose()
    $brushBg.Dispose()
    $fName.Dispose()
    $bName.Dispose()
    $fRole.Dispose()
    $bRole.Dispose()
}

Draw-SystemActor $g 1450 280 "node-cron Scheduler" "System Actor (Autonomous Daemon)"

# --- HELPER FOR USE CASE OVAL ---
function Draw-UseCase($g, $cx, $cy, $w, $h, $title, $sub, $bgColor, $borderColor, $textColor) {
    $rect = New-Object System.Drawing.Rectangle ($cx - $w/2), ($cy - $h/2), $w, $h
    $brush = New-Object System.Drawing.SolidBrush $bgColor
    $pen = New-Object System.Drawing.Pen $borderColor, 1.8
    $g.FillEllipse($brush, $rect)
    $g.DrawEllipse($pen, $rect)

    $fTitle = New-Object System.Drawing.Font("Segoe UI", 9.2, [System.Drawing.FontStyle]::Bold)
    $bText = New-Object System.Drawing.SolidBrush $textColor
    $size = $g.MeasureString($title, $fTitle)
    
    if ($sub -ne $null -and $sub -ne "") {
        $fSub = New-Object System.Drawing.Font("Segoe UI", 7.8)
        $bSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
        $sizeS = $g.MeasureString($sub, $fSub)
        $g.DrawString($title, $fTitle, $bText, ($cx - $size.Width/2), ($cy - 14))
        $g.DrawString($sub, $fSub, $bSub, ($cx - $sizeS.Width/2), ($cy + 4))
        $fSub.Dispose()
        $bSub.Dispose()
    } else {
        $g.DrawString($title, $fTitle, $bText, ($cx - $size.Width/2), ($cy - $size.Height/2))
    }

    $brush.Dispose()
    $pen.Dispose()
    $fTitle.Dispose()
    $bText.Dispose()
}

# --- USE CASES IN COLUMN 1 (Left within boundary: x=470) ---
# UC1: Add Product URL
$uc1 = @{ x=480; y=125; w=300; h=58 }
Draw-UseCase $g $uc1.x $uc1.y $uc1.w $uc1.h "Submit Product URL" "Amazon India or Flipkart listing link" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(99, 102, 241)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# UC2: Assign Product Group
$uc2 = @{ x=480; y=200; w=300; h=58 }
Draw-UseCase $g $uc2.x $uc2.y $uc2.w $uc2.h "Assign to Product Group" "Pairs equivalent listings for RQ1 comparison" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(99, 102, 241)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# UC3: Trigger Manual Refresh
$uc3 = @{ x=480; y=275; w=300; h=58 }
Draw-UseCase $g $uc3.x $uc3.y $uc3.w $uc3.h "Trigger Manual Price Refresh" "On-demand re-scrape for single/all items" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(99, 102, 241)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# UC4: View Tracked Products
$uc4 = @{ x=480; y=350; w=300; h=58 }
Draw-UseCase $g $uc4.x $uc4.y $uc4.w $uc4.h "View Tracked Products & Prices" "Catalog table with platform badges & latest data" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(99, 102, 241)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# UC5: Inspect Price History
$uc5 = @{ x=480; y=425; w=300; h=58 }
Draw-UseCase $g $uc5.x $uc5.y $uc5.w $uc5.h "Inspect Historical Price Chart" "Individual product time-series visualization" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(99, 102, 241)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# UC6: Compare Cross-Platform
$uc6 = @{ x=480; y=500; w=300; h=58 }
Draw-UseCase $g $uc6.x $uc6.y $uc6.w $uc6.h "Compare Cross-Platform (RQ1)" "Dual-line Amazon vs Flipkart comparison" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(99, 102, 241)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# UC7: View Volatility Statistics
$uc7 = @{ x=480; y=575; w=300; h=58 }
Draw-UseCase $g $uc7.x $uc7.y $uc7.w $uc7.h "View Fluctuation Statistics" "Min, Max, Avg, StdDev (σ), % Change (Δ%)" ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(99, 102, 241)) ([System.Drawing.Color]::FromArgb(30, 41, 59))

# --- USE CASES IN COLUMN 2 (Right within boundary: x=980) ---
# UC8: Automated Periodic Scraping
$uc8 = @{ x=980; y=200; w=320; h=62 }
Draw-UseCase $g $uc8.x $uc8.y $uc8.w $uc8.h "Periodic Automated Scraping" "node-cron daemon running every 6 hours" ([System.Drawing.Color]::FromArgb(240, 253, 250)) ([System.Drawing.Color]::FromArgb(20, 184, 166)) ([System.Drawing.Color]::FromArgb(15, 118, 110))

# UC9: Store Time-Series Price Data (<<include>>)
$uc9 = @{ x=980; y=350; w=320; h=62 }
Draw-UseCase $g $uc9.x $uc9.y $uc9.w $uc9.h "Store Time-Series Price Data" "INSERT into PostgreSQL price_history table" ([System.Drawing.Color]::FromArgb(238, 242, 255)) ([System.Drawing.Color]::FromArgb(79, 70, 229)) ([System.Drawing.Color]::FromArgb(67, 56, 202))

# UC10: Dynamic Fallback Extraction (<<extend>>)
$uc10 = @{ x=980; y=500; w=320; h=62 }
Draw-UseCase $g $uc10.x $uc10.y $uc10.w $uc10.h "Fallback Dynamic DOM Rendering" "Puppeteer Headless Chrome on JS-gated sites" ([System.Drawing.Color]::FromArgb(254, 242, 242)) ([System.Drawing.Color]::FromArgb(239, 68, 68)) ([System.Drawing.Color]::FromArgb(185, 28, 28))

# --- ASSOCIATIONS: USER -> USE CASES ---
$penUser = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(71, 85, 105), 1.5)
$userPt = [System.Drawing.PointF]::new(190, 280)

foreach ($uc in @($uc1, $uc2, $uc3, $uc4, $uc5, $uc6, $uc7)) {
    $targetPt = [System.Drawing.PointF]::new(($uc.x - $uc.w/2), $uc.y)
    $g.DrawLine($penUser, $userPt, $targetPt)
}

# --- ASSOCIATIONS: SCHEDULER -> UC8 ---
$penSched = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(13, 148, 136), 1.8)
$schedPt = [System.Drawing.PointF]::new(1380, 280)
$g.DrawLine($penSched, $schedPt, [System.Drawing.PointF]::new(($uc8.x + $uc8.w/2), $uc8.y))

# Manual Refresh also triggers Scraping (UC3 -> UC8 or UC9)
$penRel = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(99, 102, 241), 1.8)
$penRel.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash

# UC8 <<include>> UC9
Draw-ArrowLine $g $penRel $uc8.x ($uc8.y + $uc8.h/2) $uc9.x ($uc9.y - $uc9.h/2) "<<include>>" ([System.Drawing.Color]::FromArgb(79, 70, 229))

# UC3 <<include>> UC9
Draw-ArrowLine $g $penRel ($uc3.x + $uc3.w/2) $uc3.y ($uc9.x - $uc9.w/2) ($uc9.y - 10) "<<include>>" ([System.Drawing.Color]::FromArgb(79, 70, 229))

# UC9 <<extend>> UC10
Draw-ArrowLine $g $penRel $uc9.x ($uc9.y + $uc9.h/2) $uc10.x ($uc10.y - $uc10.h/2) "<<extend>>" ([System.Drawing.Color]::FromArgb(220, 38, 38))

$penBoundary.Dispose()
$brushBoundary.Dispose()
$penUser.Dispose()
$penSched.Dispose()
$penRel.Dispose()

$bmp.Save("$PSScriptRoot\diagram_11_use_case.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "Generated diagram_11_use_case.png successfully!"
