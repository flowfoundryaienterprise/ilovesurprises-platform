Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = "Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff\Export_2026-09-11_225309.zip"
$destDir = "Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff"
$destFile = Join-Path $destDir "Products.csv"

if (Test-Path $destFile) {
    Write-Host "Products.csv already exists ($(([math]::Round((Get-Item $destFile).Length / 1MB, 2))) MB)."
} else {
    Write-Host "Opening zip: $zipPath ..."
    $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    $entry = $archive.GetEntry("Products.csv")
    Write-Host "Extracting Products.csv to $destFile ..."
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destFile, $true)
    $archive.Dispose()
    Write-Host "Extraction complete. File size: $([math]::Round((Get-Item $destFile).Length / 1MB, 2)) MB"
}
