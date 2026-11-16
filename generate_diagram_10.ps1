Add-Type -AssemblyName System.Drawing
. "$PSScriptRoot\drawing_helpers.ps1"

$bmp = New-Object System.Drawing.Bitmap 1600, 672
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))

# Background container card
Draw-Card $g 20 20 1560 632 16 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(226, 232, 240)) "SCRAPING PIPELINE & WORKFLOW ARCHITECTURE" ([System.Drawing.Color]::FromArgb(30, 41, 59)) ([System.Drawing.Color]::FromArgb(241, 245, 249)) 2

# Sub-banner
$fSub = New-Object System.Drawing.Font("Segoe UI", 9.5)
$bSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
$g.DrawString("Dual-Engine Price Extraction Pipeline: Axios/Cheerio Fast Path + Puppeteer Headless Dynamic Fallback", $fSub, $bSub, 460, 28)
$fSub.Dispose()
$bSub.Dispose()

$fTitle = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$fBody = New-Object System.Drawing.Font("Segoe UI", 8.2)
$bDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 41, 59))
$bMuted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))
$penFlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(99, 102, 241), 2.2)

# --- STEP 1: TRIGGER (x=45, y=210, w=190, h=190) ---
Draw-Card $g 45 210 190 190 10 ([System.Drawing.Color]::FromArgb(238, 242, 255)) ([System.Drawing.Color]::FromArgb(165, 180, 252)) "1. Trigger Event" ([System.Drawing.Color]::FromArgb(67, 56, 202)) ([System.Drawing.Color]::FromArgb(224, 231, 255))
$g.DrawString("Dual Activation:`n• Automated Cron:`n  node-cron daemon`n  Runs every 6 hours`n  (0 */6 * * *)`n• Manual UI Trigger:`n  'Refresh All Prices'`n  or Single-Item Scrape", $fBody, $bMuted, 55, 255)

# --- STEP 2: DISPATCHER (x=275, y=210, w=200, h=190) ---
Draw-Card $g 275 210 200 190 10 ([System.Drawing.Color]::FromArgb(240, 253, 250)) ([System.Drawing.Color]::FromArgb(153, 246, 228)) "2. URL Dispatcher" ([System.Drawing.Color]::FromArgb(15, 118, 110)) ([System.Drawing.Color]::FromArgb(204, 251, 241))
$g.DrawString("• Fetch active listings from`n  PostgreSQL 'products'`n• Platform Detection:`n  - Amazon India (.in)`n  - Flipkart (.com)`n• Polite Sequential Queue`n  Prevents concurrent bursts`n  & avoids IP rate limits", $fBody, $bMuted, 285, 255)

# Arrow 1 -> 2
Draw-ArrowLine $g $penFlow 235 305 275 305 "Start" ([System.Drawing.Color]::FromArgb(67, 56, 202))

# --- STEP 3A: FAST PATH CHEERIO (x=520, y=90, w=280, h=210) ---
Draw-Card $g 520 90 280 210 10 ([System.Drawing.Color]::FromArgb(254, 243, 199)) ([System.Drawing.Color]::FromArgb(251, 191, 36)) "3A. Fast-Path Extraction" ([System.Drawing.Color]::FromArgb(180, 83, 9)) ([System.Drawing.Color]::FromArgb(254, 240, 138))
Draw-Badge $g 680 97 "Axios + Cheerio" ([System.Drawing.Color]::FromArgb(217, 119, 6)) ([System.Drawing.Color]::White) | Out-Null
$g.DrawString("• HTTP GET with Desktop User-Agent`n• Cheerio Static DOM Parsing`n• Strike-Through Filter (CRITICAL):`n  Skips Amazon .a-text-price MRP`n  to avoid recording fake list prices`n• JSON-LD Product Schema Parser`n• Embedded JSON Script Regex`n  (__NEXT_DATA__ on Flipkart)", $fBody, $bMuted, 530, 135)

# Arrow 2 -> 3A
Draw-ArrowLine $g $penFlow 475 270 520 190 "Fetch HTML" ([System.Drawing.Color]::FromArgb(180, 83, 9))

# --- STEP 3B: FALLBACK PUPPETEER (x=520, y=370, w=280, h=200) ---
Draw-Card $g 520 370 280 200 10 ([System.Drawing.Color]::FromArgb(254, 242, 242)) ([System.Drawing.Color]::FromArgb(252, 165, 165)) "3B. Dynamic Headless Fallback" ([System.Drawing.Color]::FromArgb(185, 28, 28)) ([System.Drawing.Color]::FromArgb(254, 226, 226))
Draw-Badge $g 700 377 "Puppeteer" ([System.Drawing.Color]::FromArgb(220, 38, 38)) ([System.Drawing.Color]::White) | Out-Null
$g.DrawString("• Invoked if Cheerio gets null / blocked`n• Launches Headless Chromium`n• Executes Client-Side JS Hydration`n• Waits for dynamic selector rendering:`n  Amazon: span.a-price-whole`n  Flipkart: div._30jeq3`n• Extracts in-page hydrated price", $fBody, $bMuted, 530, 415)

# Decision Diamond 1: Price Found? (x=840, y=145, w=130, h=95)
$penGreen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 185, 129), 2.2)
$penRed = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(239, 68, 68), 2.2)

$pts = @(
    [System.Drawing.PointF]::new(905, 145),
    [System.Drawing.PointF]::new(970, 192),
    [System.Drawing.PointF]::new(905, 240),
    [System.Drawing.PointF]::new(840, 192)
)
$bDia = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))
$pDia = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(148, 163, 184), 2)
$g.FillPolygon($bDia, $pts)
$g.DrawPolygon($pDia, $pts)
$fDia = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Price Valid?", $fDia, $bDark, 868, 183)

# Arrow 3A -> Decision 1
Draw-ArrowLine $g $penFlow 800 192 840 192 "" $null

# If NO from Decision 1 -> go to 3B Puppeteer
Draw-ArrowLine $g $penRed 905 240 760 370 "NO (Null / JS Blocked)" ([System.Drawing.Color]::FromArgb(220, 38, 38))

# Arrow 3B -> Decision 2 or Merger
# --- STEP 4: NORMALIZER & CLEANER (x=1010, y=210, w=230, h=190) ---
Draw-Card $g 1010 210 230 190 10 ([System.Drawing.Color]::FromArgb(243, 232, 255)) ([System.Drawing.Color]::FromArgb(216, 180, 254)) "4. Normalizer & Sanitize" ([System.Drawing.Color]::FromArgb(107, 33, 168)) ([System.Drawing.Color]::FromArgb(233, 213, 255))
$g.DrawString("• Strip currency glyphs: ₹, INR`n• Remove commas and spaces`n• Regex extraction: (\d+(\.\d+)?)`n• Sanity Range Validation:`n  Ensure price > 0 & realistic`n• Cast to PostgreSQL`n  DECIMAL(12,2) format", $fBody, $bMuted, 1020, 255)

# If YES from Decision 1 -> go to Step 4
Draw-ArrowLine $g $penGreen 970 192 1010 270 "YES" ([System.Drawing.Color]::FromArgb(16, 185, 129))

# Arrow 3B Puppeteer -> Step 4
Draw-ArrowLine $g $penFlow 800 460 1010 330 "Hydrated Price" ([System.Drawing.Color]::FromArgb(107, 33, 168))

# --- STEP 5: PERSISTENCE & RESULTS (x=1280, y=90, w=250, h=480) ---
Draw-Card $g 1280 90 250 480 10 ([System.Drawing.Color]::FromArgb(248, 250, 252)) ([System.Drawing.Color]::FromArgb(203, 213, 225)) "5. Persistence & Outcomes" ([System.Drawing.Color]::FromArgb(30, 41, 59)) ([System.Drawing.Color]::FromArgb(226, 232, 240))

# Sub-card: Success Branch (Top)
Draw-Card $g 1295 140 220 185 8 ([System.Drawing.Color]::FromArgb(236, 253, 245)) ([System.Drawing.Color]::FromArgb(110, 231, 183)) "SUCCESS BRANCH" ([System.Drawing.Color]::FromArgb(6, 95, 70)) ([System.Drawing.Color]::FromArgb(209, 250, 229))
$g.DrawString("• INSERT INTO price_history:`n  (product_id, price, scraped_at)`n• UPDATE products:`n  SET last_scraped_at = NOW(),`n      image_url = scraped_img,`n      last_scrape_error = NULL`n• Return HTTP 200 OK`n  { price, scrapedAt, method }", $fBody, $bMuted, 1305, 185)

# Sub-card: Failure Branch (Bottom)
Draw-Card $g 1295 350 220 195 8 ([System.Drawing.Color]::FromArgb(254, 242, 242)) ([System.Drawing.Color]::FromArgb(252, 165, 165)) "FAILURE BRANCH" ([System.Drawing.Color]::FromArgb(153, 27, 27)) ([System.Drawing.Color]::FromArgb(254, 226, 226))
$g.DrawString("• If both Cheerio and Puppeteer fail:`n• UPDATE products:`n  SET last_scrape_error = '...'`n• Preserves existing history`n  No data corruption or loss`n• Real-Time Alert in UI:`n  Badge turns red to alert user`n• Ready for retry on next cron", $fBody, $bMuted, 1305, 395)

# Arrow 4 -> Success (Top)
Draw-ArrowLine $g $penGreen 1240 270 1295 210 "Valid Price" ([System.Drawing.Color]::FromArgb(16, 185, 129))

# Arrow 4 -> Failure (Bottom)
Draw-ArrowLine $g $penRed 1240 330 1295 420 "Invalid / Null" ([System.Drawing.Color]::FromArgb(239, 68, 68))

$fTitle.Dispose()
$fBody.Dispose()
$bDark.Dispose()
$bMuted.Dispose()
$penFlow.Dispose()
$penGreen.Dispose()
$penRed.Dispose()
$bDia.Dispose()
$pDia.Dispose()
$fDia.Dispose()

$bmp.Save("$PSScriptRoot\diagram_10_scraping_pipeline.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "Generated diagram_10_scraping_pipeline.png successfully!"
