Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff\Export_2026-09-11_202642.zip"
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entry = $archive.GetEntry("Collections.csv")

$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)

$header = $reader.ReadLine()
Write-Host "Header: $header"

$totalLines = 0
$sw = [System.Diagnostics.Stopwatch]::StartNew()

while (($line = $reader.ReadLine()) -ne $null) {
    $totalLines++
    if ($totalLines % 200000 -eq 0) {
        Write-Host "Processed $totalLines lines in $($sw.Elapsed.TotalSeconds)s..."
    }
}

$sw.Stop()
Write-Host "Done! Total Lines in Collections.csv: $totalLines in $($sw.Elapsed.TotalSeconds)s"

$reader.Close()
$stream.Close()
$archive.Dispose()
