Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff\Export_2026-09-11_225309.zip"
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entry = $archive.GetEntry("Products.csv")

$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)

Write-Host "=== Products.csv Header ==="
$header = $reader.ReadLine()
Write-Host $header

Write-Host "`n=== Sample Row 1 ==="
$row1 = $reader.ReadLine()
Write-Host $row1

$reader.Close()
$stream.Close()
$archive.Dispose()
