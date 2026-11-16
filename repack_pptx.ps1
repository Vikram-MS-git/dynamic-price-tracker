Add-Type -AssemblyName System.IO.Compression.FileSystem

$sourceDir = "$PWD\pptx_extracted"
$destZip = "$PWD\Dynamic_Price_Tracker_Updated.pptx"

if (Test-Path $destZip) {
    Remove-Item $destZip -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($sourceDir, $destZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Write-Host "Created $destZip successfully. Size: $((Get-Item $destZip).Length) bytes"
