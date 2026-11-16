Add-Type -AssemblyName System.Drawing

function Create-RoundedPath($rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-Card($g, $x, $y, $w, $h, $radius, $bgColor, $borderColor, $title, $titleColor, $headerBgColor, $borderWidth=1) {
    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $path = Create-RoundedPath $rect $radius
    
    $brush = New-Object System.Drawing.SolidBrush $bgColor
    $g.FillPath($brush, $path)
    $brush.Dispose()

    if ($headerBgColor -ne $null) {
        $headerRect = New-Object System.Drawing.Rectangle $x, $y, $w, 36
        $headerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $radius * 2
        $headerPath.AddArc($x, $y, $d, $d, 180, 90)
        $headerPath.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
        $headerPath.AddLine($x + $w, $y + 36, $x, $y + 36)
        $headerPath.CloseFigure()
        $hBrush = New-Object System.Drawing.SolidBrush $headerBgColor
        $g.FillPath($hBrush, $headerPath)
        $hBrush.Dispose()
        $headerPath.Dispose()
    }

    $pen = New-Object System.Drawing.Pen $borderColor, $borderWidth
    $g.DrawPath($pen, $path)
    $pen.Dispose()
    $path.Dispose()

    if ($title -ne $null -and $title -ne "") {
        $font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
        $tBrush = New-Object System.Drawing.SolidBrush $titleColor
        $g.DrawString($title, $font, $tBrush, ($x + 14), ($y + 8))
        $font.Dispose()
        $tBrush.Dispose()
    }
}

function Draw-Badge($g, $x, $y, $text, $bgColor, $textColor) {
    $font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $size = $g.MeasureString($text, $font)
    $w = [int]$size.Width + 14
    $h = 22
    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $path = Create-RoundedPath $rect 6
    $brush = New-Object System.Drawing.SolidBrush $bgColor
    $g.FillPath($brush, $path)
    $tBrush = New-Object System.Drawing.SolidBrush $textColor
    $g.DrawString($text, $font, $tBrush, ($x + 7), ($y + 3))
    $font.Dispose()
    $size = $null
    $path.Dispose()
    $brush.Dispose()
    $tBrush.Dispose()
    return ($x + $w)
}

function Draw-ArrowLine($g, $pen, $x1, $y1, $x2, $y2, $label, $labelColor) {
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
    # Draw arrow head
    $angle = [Math]::Atan2($y2 - $y1, $x2 - $x1)
    $arrowLength = 12.0
    $arrowAngle = [Math]::PI / 6.0

    $x3 = $x2 - $arrowLength * [Math]::Cos($angle - $arrowAngle)
    $y3 = $y2 - $arrowLength * [Math]::Sin($angle - $arrowAngle)
    $x4 = $x2 - $arrowLength * [Math]::Cos($angle + $arrowAngle)
    $y4 = $y2 - $arrowLength * [Math]::Sin($angle + $arrowAngle)

    $brush = New-Object System.Drawing.SolidBrush $pen.Color
    $pts = @(
        [System.Drawing.PointF]::new($x2, $y2),
        [System.Drawing.PointF]::new($x3, $y3),
        [System.Drawing.PointF]::new($x4, $y4)
    )
    $g.FillPolygon($brush, $pts)
    $brush.Dispose()

    if ($label -ne $null -and $label -ne "") {
        $font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $tBrush = New-Object System.Drawing.SolidBrush $labelColor
        $midX = ($x1 + $x2) / 2
        $midY = ($y1 + $y2) / 2
        $size = $g.MeasureString($label, $font)
        # Background pill for label
        $rect = New-Object System.Drawing.Rectangle ([int]($midX - $size.Width/2 - 4)), ([int]($midY - $size.Height/2 - 2)), ([int]($size.Width + 8)), ([int]($size.Height + 4))
        $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(250, 255, 255, 255))
        $p = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(203, 213, 225), 1)
        $g.FillRectangle($bg, $rect)
        $g.DrawRectangle($p, $rect)
        $bg.Dispose()
        $p.Dispose()
        $g.DrawString($label, $font, $tBrush, ($midX - $size.Width/2), ($midY - $size.Height/2))
        $font.Dispose()
        $tBrush.Dispose()
    }
}

Write-Host "Helper functions loaded."
