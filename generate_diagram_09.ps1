Add-Type -AssemblyName System.Drawing
. "$PSScriptRoot\drawing_helpers.ps1"

$bmp = New-Object System.Drawing.Bitmap 1600, 672
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))

# Background container card
Draw-Card $g 20 20 1560 632 16 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(226, 232, 240)) "THREE-TIER SYSTEM ARCHITECTURE" ([System.Drawing.Color]::FromArgb(30, 41, 59)) ([System.Drawing.Color]::FromArgb(241, 245, 249)) 2

# Top sub-banner
$fSub = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Regular)
$bSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
$g.DrawString("End-to-End Modular Layering: React Single-Page Frontend | Express.js REST Engine | PostgreSQL Relational Persistence", $fSub, $bSub, 360, 28)
$fSub.Dispose()
$bSub.Dispose()

# --- TIER 1: PRESENTATION TIER (Left) ---
$tier1X = 50; $tier1Y = 75; $tier1W = 440; $tier1H = 550
Draw-Card $g $tier1X $tier1Y $tier1W $tier1H 12 ([System.Drawing.Color]::FromArgb(245, 247, 255)) ([System.Drawing.Color]::FromArgb(199, 210, 254)) "PRESENTATION TIER (Client)" ([System.Drawing.Color]::FromArgb(67, 56, 202)) ([System.Drawing.Color]::FromArgb(224, 231, 255)) 2

# Badge inside Tier 1
Draw-Badge $g ($tier1X + 270) ($tier1Y + 7) "React 18 + Vite" ([System.Drawing.Color]::FromArgb(79, 70, 229)) ([System.Drawing.Color]::White) | Out-Null

# UI Modules
$boxY = $tier1Y + 50
Draw-Card $g ($tier1X + 15) $boxY ($tier1W - 30) 95 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(224, 231, 255)) "User Interface Components" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$fText = New-Object System.Drawing.Font("Segoe UI", 8.5)
$bText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))
$g.DrawString("• HomePage (Product Catalog, Live Filters, Status Badges)`n• ComparePage (Cross-Platform Price Volatility Analyser)`n• ProductDetailPage (Historical Price Trends & Min/Max)", $fText, $bText, ($tier1X + 25), ($boxY + 30))

$boxY += 110
Draw-Card $g ($tier1X + 15) $boxY ($tier1W - 30) 85 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(224, 231, 255)) "Visual Analytics & Charting" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Recharts Responsive SVG Engine`n• Multi-Series Line Charts (Amazon vs Flipkart Curves)`n• Real-Time Tooltips, Cartesian Grid & Volatility Metrics", $fText, $bText, ($tier1X + 25), ($boxY + 30))

$boxY += 100
Draw-Card $g ($tier1X + 15) $boxY ($tier1W - 30) 80 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(224, 231, 255)) "State & Navigation Management" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• React Router v6 Client-Side Routing`n• Context API (Global App State & Theme Engine)`n• Axios HTTP Client with Centralised Error Interceptors", $fText, $bText, ($tier1X + 25), ($boxY + 30))

$boxY += 95
Draw-Card $g ($tier1X + 15) $boxY ($tier1W - 30) 85 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(224, 231, 255)) "User Action Handlers" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Register Product URL (Amazon / Flipkart)`n• Assign to Logical Product Group for RQ1 Comparison`n• Trigger Manual Refresh All & On-Demand Re-Scraping", $fText, $bText, ($tier1X + 25), ($boxY + 30))

# --- TIER 2: APPLICATION TIER (Center) ---
$tier2X = 570; $tier2Y = 75; $tier2W = 460; $tier2H = 550
Draw-Card $g $tier2X $tier2Y $tier2W $tier2H 12 ([System.Drawing.Color]::FromArgb(240, 253, 250)) ([System.Drawing.Color]::FromArgb(153, 246, 228)) "APPLICATION TIER (REST API)" ([System.Drawing.Color]::FromArgb(15, 118, 110)) ([System.Drawing.Color]::FromArgb(204, 251, 241)) 2

Draw-Badge $g ($tier2X + 290) ($tier2Y + 7) "Node.js + Express" ([System.Drawing.Color]::FromArgb(13, 148, 136)) ([System.Drawing.Color]::White) | Out-Null

$boxY = $tier2Y + 50
Draw-Card $g ($tier2X + 15) $boxY ($tier2W - 30) 90 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(204, 251, 241)) "RESTful API Controllers & Routes" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• /products (CRUD, List, Details, Delete)`n• /products/:id/scrape & /scrape-all (Manual Scraping)`n• /groups & /groups/:id/compare (Aggregated RQ1 Analytics)", $fText, $bText, ($tier2X + 25), ($boxY + 30))

$boxY += 105
Draw-Card $g ($tier2X + 15) $boxY ($tier2W - 30) 115 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(204, 251, 241)) "Dual-Strategy Scraping Subsystem" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Fast Path: Axios + Cheerio HTML & JSON-LD Parser`n• Strike-Through MRP Filter: Eliminates Amazon list price`n• Dynamic Fallback: Puppeteer Headless Chrome Engine`n• Regex Currency Cleaner: Normalises to DECIMAL(12,2)", $fText, $bText, ($tier2X + 25), ($boxY + 30))

$boxY += 130
Draw-Card $g ($tier2X + 15) $boxY ($tier2W - 30) 75 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(204, 251, 241)) "Automated Background Scheduler" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• node-cron Daemon executing every 6 hours (0 */6 * * *)`n• Sequential queue execution to prevent IP throttling", $fText, $bText, ($tier2X + 25), ($boxY + 30))

$boxY += 90
Draw-Card $g ($tier2X + 15) $boxY ($tier2W - 30) 80 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(204, 251, 241)) "Statistical & Comparison Engine" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Min, Max, Arithmetic Mean (μ), Standard Deviation (σ)`n• Percentage Fluctuation Δ% = ((Last - First) / First) * 100`n• Cross-platform spread and volatility interpretation", $fText, $bText, ($tier2X + 25), ($boxY + 30))

# --- TIER 3: DATA TIER & EXTERNAL SITES (Right) ---
$tier3X = 1110; $tier3Y = 75; $tier3W = 440; $tier3H = 310
Draw-Card $g $tier3X $tier3Y $tier3W $tier3H 12 ([System.Drawing.Color]::FromArgb(254, 242, 242)) ([System.Drawing.Color]::FromArgb(254, 202, 202)) "DATA TIER (Persistence)" ([System.Drawing.Color]::FromArgb(185, 28, 28)) ([System.Drawing.Color]::FromArgb(254, 226, 226)) 2

Draw-Badge $g ($tier3X + 270) ($tier3Y + 7) "PostgreSQL / Neon" ([System.Drawing.Color]::FromArgb(220, 38, 38)) ([System.Drawing.Color]::White) | Out-Null

$boxY = $tier3Y + 50
Draw-Card $g ($tier3X + 15) $boxY ($tier3W - 30) 75 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(254, 202, 202)) "product_groups" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• id (PK), group_name (UNIQUE)`n• Links equivalent Amazon & Flipkart product listings", $fText, $bText, ($tier3X + 25), ($boxY + 30))

$boxY += 85
Draw-Card $g ($tier3X + 15) $boxY ($tier3W - 30) 75 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(254, 202, 202)) "products" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• id (PK), name, url, platform, category, group_id (FK)`n• last_scraped_at, last_scrape_error (diagnostic flag)", $fText, $bText, ($tier3X + 25), ($boxY + 30))

$boxY += 85
Draw-Card $g ($tier3X + 15) $boxY ($tier3W - 30) 75 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(254, 202, 202)) "price_history (Time-Series)" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• id (PK), product_id (FK ON DELETE CASCADE)`n• price (DECIMAL 12,2), scraped_at (TIMESTAMP)", $fText, $bText, ($tier3X + 25), ($boxY + 30))

# --- EXTERNAL TARGET SITES (Bottom Right) ---
$extY = 405; $extH = 220
Draw-Card $g $tier3X $extY $tier3W $extH 12 ([System.Drawing.Color]::FromArgb(255, 251, 235)) ([System.Drawing.Color]::FromArgb(253, 230, 138)) "EXTERNAL E-COMMERCE SITES" ([System.Drawing.Color]::FromArgb(180, 83, 9)) ([System.Drawing.Color]::FromArgb(254, 243, 199)) 2

Draw-Badge $g ($tier3X + 280) ($extY + 7) "Target Retailers" ([System.Drawing.Color]::FromArgb(217, 119, 6)) ([System.Drawing.Color]::White) | Out-Null

$boxY = $extY + 45
Draw-Card $g ($tier3X + 15) $boxY ($tier3W - 30) 75 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(253, 230, 138)) "Amazon India (amazon.in)" ([System.Drawing.Color]::FromArgb(217, 119, 6)) $null
$g.DrawString("• Product landing pages, Lightning Deals, Great Indian Festival`n• Structured schema.org/Product JSON-LD + dynamic DOM", $fText, $bText, ($tier3X + 25), ($boxY + 30))

$boxY += 85
Draw-Card $g ($tier3X + 15) $boxY ($tier3W - 30) 75 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(253, 230, 138)) "Flipkart (flipkart.com)" ([System.Drawing.Color]::FromArgb(29, 78, 216)) $null
$g.DrawString("• Big Billion Days campaigns, seller flash discounts`n• Embedded __NEXT_DATA__ JSON script blocks & price nodes", $fText, $bText, ($tier3X + 25), ($boxY + 30))

# --- CONNECTING ARROWS ---
$penHttp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(79, 70, 229), 2.5)
$penSql = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(13, 148, 136), 2.5)
$penScrape = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(217, 119, 6), 2.5)

# Tier 1 <-> Tier 2 (Bi-directional)
Draw-ArrowLine $g $penHttp ($tier1X + $tier1W) ($tier1Y + 150) ($tier2X) ($tier2Y + 150) "HTTPS / REST API JSON" ([System.Drawing.Color]::FromArgb(67, 56, 202))
Draw-ArrowLine $g $penHttp ($tier2X) ($tier1Y + 380) ($tier1X + $tier1W) ($tier1Y + 380) "Price Data & Analytics" ([System.Drawing.Color]::FromArgb(67, 56, 202))

# Tier 2 <-> Tier 3 DB
Draw-ArrowLine $g $penSql ($tier2X + $tier2W) ($tier3Y + 150) ($tier3X) ($tier3Y + 150) "SQL Queries (pg Pool / SSL)" ([System.Drawing.Color]::FromArgb(15, 118, 110))

# Tier 2 <-> External Sites
Draw-ArrowLine $g $penScrape ($tier2X + $tier2W) ($extY + 90) ($tier3X) ($extY + 90) "HTTP GET / Headless Chrome" ([System.Drawing.Color]::FromArgb(180, 83, 9))

$fText.Dispose()
$bText.Dispose()
$penHttp.Dispose()
$penSql.Dispose()
$penScrape.Dispose()

$bmp.Save("$PSScriptRoot\diagram_09_architecture.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "Generated diagram_09_architecture.png successfully!"
