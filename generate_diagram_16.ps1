Add-Type -AssemblyName System.Drawing
. "$PSScriptRoot\drawing_helpers.ps1"

$bmp = New-Object System.Drawing.Bitmap 1600, 672
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))

# Background container card
Draw-Card $g 20 20 1560 632 16 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(226, 232, 240)) "SYSTEM ARCHITECTURE & CLOUD DEPLOYMENT" ([System.Drawing.Color]::FromArgb(30, 41, 59)) ([System.Drawing.Color]::FromArgb(241, 245, 249)) 2

# Sub-banner
$fSub = New-Object System.Drawing.Font("Segoe UI", 9.5)
$bSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
$g.DrawString("Production Cloud Infrastructure Topology: Vercel Global Edge | Railway API Container | Neon Serverless PostgreSQL", $fSub, $bSub, 460, 28)
$fSub.Dispose()
$bSub.Dispose()

$fBody = New-Object System.Drawing.Font("Segoe UI", 8.3)
$bMuted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))

# --- COLUMN 1: CLIENT ENVIRONMENT (x=45, y=75, w=320, h=550) ---
Draw-Card $g 45 75 320 550 12 ([System.Drawing.Color]::FromArgb(245, 247, 255)) ([System.Drawing.Color]::FromArgb(199, 210, 254)) "1. CLIENT ENVIRONMENT" ([System.Drawing.Color]::FromArgb(67, 56, 202)) ([System.Drawing.Color]::FromArgb(224, 231, 255)) 2
Draw-Badge $g 240 82 "Web & Mobile" ([System.Drawing.Color]::FromArgb(79, 70, 229)) ([System.Drawing.Color]::White) | Out-Null

$boxY = 130
Draw-Card $g 60 $boxY 290 115 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(224, 231, 255)) "Modern Browser Engine" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Google Chrome, Mozilla Firefox, Safari, Edge`n• Mobile Responsive Viewport (iOS / Android)`n• Single-Page App DOM Rendering`n• WebSocket & Fetch API Communication", $fBody, $bMuted, 70, ($boxY + 30))

$boxY += 130
Draw-Card $g 60 $boxY 290 125 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(224, 231, 255)) "User Interface & Experience" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Interactive Product Catalogs & Grouping UI`n• Multi-Platform Comparison Analytics (RQ1)`n• Real-Time Recharts Dynamic Visualisations`n• Dark / Light Theme Mode with Persistence", $fBody, $bMuted, 70, ($boxY + 30))

$boxY += 140
Draw-Card $g 60 $boxY 290 115 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(224, 231, 255)) "Client Security & Caching" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• HTTPS Strict Transport Security (HSTS)`n• In-Memory Application State Management`n• Zero Credential Exposure / Secure CORS", $fBody, $bMuted, 70, ($boxY + 30))


# --- COLUMN 2: EDGE CDN & FRONTEND HOSTING (x=410, y=75, w=330, h=550) ---
Draw-Card $g 410 75 330 550 12 ([System.Drawing.Color]::FromArgb(240, 249, 255)) ([System.Drawing.Color]::FromArgb(186, 230, 253)) "2. FRONTEND HOSTING" ([System.Drawing.Color]::FromArgb(3, 105, 161)) ([System.Drawing.Color]::FromArgb(224, 242, 254)) 2
Draw-Badge $g 620 82 "Vercel Platform" ([System.Drawing.Color]::FromArgb(2, 132, 199)) ([System.Drawing.Color]::White) | Out-Null

$boxY = 130
Draw-Card $g 425 $boxY 300 115 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(186, 230, 253)) "Global Edge CDN Network" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Anycast Global Content Delivery Network`n• Ultra-Low Latency Static Asset Delivery`n• Automated Brotli & Gzip Compression`n• Automated Git Continuous Deployment (CI/CD)", $fBody, $bMuted, 435, ($boxY + 30))

$boxY += 130
Draw-Card $g 425 $boxY 300 125 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(186, 230, 253)) "Reverse Proxy & Routing" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• vercel.json Rewrite Configuration`n• Proxies /api/* requests to Railway Backend`n• Prevents Cross-Origin Resource Sharing issues`n• Edge TLS Termination & Automatic SSL Certs", $fBody, $bMuted, 435, ($boxY + 30))

$boxY += 140
Draw-Card $g 425 $boxY 300 115 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(186, 230, 253)) "Production Build Bundles" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Vite Production Bundler & Tree-Shaking`n• Code-Split Chunks (App, Recharts, Icons)`n• Cache-Busting Hashed Asset Delivery", $fBody, $bMuted, 435, ($boxY + 30))


# --- COLUMN 3: BACKEND API & SCRAPER CONTAINER (x=780, y=75, w=390, h=550) ---
Draw-Card $g 780 75 390 550 12 ([System.Drawing.Color]::FromArgb(240, 253, 250)) ([System.Drawing.Color]::FromArgb(153, 246, 228)) "3. APPLICATION SERVER" ([System.Drawing.Color]::FromArgb(15, 118, 110)) ([System.Drawing.Color]::FromArgb(204, 251, 241)) 2
Draw-Badge $g 1020 82 "Railway PaaS" ([System.Drawing.Color]::FromArgb(13, 148, 136)) ([System.Drawing.Color]::White) | Out-Null

$boxY = 130
Draw-Card $g 795 $boxY 360 115 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(153, 246, 228)) "Containerized Node.js 18 LTS" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Dockerized Runtime on Railway PaaS`n• Express.js Framework with Helmet & CORS`n• express-rate-limit IP Burst Protection`n• Dynamic Environment Configurations via .env", $fBody, $bMuted, 805, ($boxY + 30))

$boxY += 130
Draw-Card $g 795 $boxY 360 135 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(153, 246, 228)) "Scraping Subsystem & Daemon" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• node-cron Daemon (0 */6 * * * scheduled runs)`n• Fast-Path Axios/Cheerio Parser (JSON-LD + DOM)`n• Headless Chrome Worker (Puppeteer Dynamic Path)`n• Anti-Scrape Mitigation: Rotating User-Agents`n• Amazon Strike-Through MRP Removal Filter", $fBody, $bMuted, 805, ($boxY + 30))

$boxY += 150
Draw-Card $g 795 $boxY 360 105 8 ([System.Drawing.Color]::White) ([System.Drawing.Color]::FromArgb(153, 246, 228)) "Statistical Analytics Engine" ([System.Drawing.Color]::FromArgb(30, 41, 59)) $null
$g.DrawString("• Aggregation Algorithms (Min, Max, Mean, StdDev)`n• Volatility Percentage Calculations (RQ1)`n• JSON Response Marshalling with Error Isolation", $fBody, $bMuted, 805, ($boxY + 30))


# --- COLUMN 4: DATABASE & TARGET PLATFORMS (x=1210, y=75, w=345, h=550) ---
# Sub-card: Neon Database (Top)
Draw-Card $g 1210 75 345 270 12 ([System.Drawing.Color]::FromArgb(254, 242, 242)) ([System.Drawing.Color]::FromArgb(254, 202, 202)) "4. DATABASE TIER" ([System.Drawing.Color]::FromArgb(185, 28, 28)) ([System.Drawing.Color]::FromArgb(254, 226, 226)) 2
Draw-Badge $g 1410 82 "Neon PostgreSQL" ([System.Drawing.Color]::FromArgb(220, 38, 38)) ([System.Drawing.Color]::White) | Out-Null

$g.DrawString("• Serverless PostgreSQL 16 on Neon Cloud`n• SSL/TLS Encrypted Transactions`n• pg Connection Pooling for High Concurrency`n• Relational Schema with Foreign Key Constraints:`n  - product_groups (Group Names)`n  - products (URL, Category, Platform, Errors)`n  - price_history (DECIMAL Time-Series)", $fBody, $bMuted, 1225, 125)

# Sub-card: External Retailers (Bottom)
Draw-Card $g 1210 365 345 260 12 ([System.Drawing.Color]::FromArgb(255, 251, 235)) ([System.Drawing.Color]::FromArgb(253, 230, 138)) "5. TARGET RETAILERS" ([System.Drawing.Color]::FromArgb(180, 83, 9)) ([System.Drawing.Color]::FromArgb(254, 243, 199)) 2
Draw-Badge $g 1430 372 "Retail Sites" ([System.Drawing.Color]::FromArgb(217, 119, 6)) ([System.Drawing.Color]::White) | Out-Null

$g.DrawString("• Amazon India (amazon.in):`n  - Festive Deals, Lightning Discounts`n  - HTML Parsing & JSON-LD Structured Data`n• Flipkart (flipkart.com):`n  - Big Billion Days, Flash Offer Prices`n  - React Hydration Nodes & Script Extractors`n• Polite Request Intervals to respect servers", $fBody, $bMuted, 1225, 415)


# --- INTER-TIER ARROWS ---
$penConn = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(79, 70, 229), 2.2)

# Col 1 -> Col 2
Draw-ArrowLine $g $penConn 365 200 410 200 "HTTPS / CDN" ([System.Drawing.Color]::FromArgb(67, 56, 202))

# Col 2 -> Col 3
Draw-ArrowLine $g $penConn 740 200 780 200 "/api Proxy" ([System.Drawing.Color]::FromArgb(3, 105, 161))

# Col 3 -> Col 4 DB
$penSql = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 38, 38), 2.2)
Draw-ArrowLine $g $penSql 1170 190 1210 190 "SQL / Pooler" ([System.Drawing.Color]::FromArgb(185, 28, 28))

# Col 3 -> Col 4 External
$penScrape = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(217, 119, 6), 2.2)
Draw-ArrowLine $g $penScrape 1170 480 1210 480 "Scrape Jobs" ([System.Drawing.Color]::FromArgb(180, 83, 9))

$fBody.Dispose()
$bMuted.Dispose()
$penConn.Dispose()
$penSql.Dispose()
$penScrape.Dispose()

$bmp.Save("$PSScriptRoot\diagram_16_system_architecture.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "Generated diagram_16_system_architecture.png successfully!"
