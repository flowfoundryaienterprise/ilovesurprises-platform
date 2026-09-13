Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff\Export_2026-09-11_225309.zip"
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entry = $archive.GetEntry("Products.csv")

$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)

$headerLine = $reader.ReadLine()
$headers = $headerLine -split '","'
# Strip leading and trailing quotes
for ($i = 0; $i -lt $headers.Length; $i++) {
    $headers[$i] = $headers[$i].Trim('"')
}

$colTopRow = [array]::IndexOf($headers, "Top Row")
$colID = [array]::IndexOf($headers, "ID")
$colHandle = [array]::IndexOf($headers, "Handle")
$colVariantID = [array]::IndexOf($headers, "Variant ID")
$colImageSrc = [array]::IndexOf($headers, "Image Src")
$colOption1 = [array]::IndexOf($headers, "Option1 Name")

Write-Host "Indices: TopRow=$colTopRow, ID=$colID, Handle=$colHandle, VariantID=$colVariantID, ImageSrc=$colImageSrc, Option1=$colOption1"

# Fast line stream scan
$totalLines = 0
$topRows = 0
$withVariantID = 0
$withImageSrc = 0

$sw = [System.Diagnostics.Stopwatch]::StartNew()

while (($line = $reader.ReadLine()) -ne $null) {
    $totalLines++
    if ($line.Contains('"true"') -or $line.Contains(',true,')) {
        # more precise check if needed, but let's do sample check
    }
    if ($totalLines % 200000 -eq 0) {
        Write-Host "Processed $totalLines lines in $($sw.Elapsed.TotalSeconds)s..."
    }
}

$sw.Stop()
Write-Host "Done! Total Lines in Products.csv: $totalLines in $($sw.Elapsed.TotalSeconds)s"

$reader.Close()
$stream.Close()
$archive.Dispose()
