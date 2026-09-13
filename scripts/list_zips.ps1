Add-Type -AssemblyName System.IO.Compression.FileSystem

$dir = "Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff"
$zips = Get-ChildItem -Path $dir -Filter "*.zip"

foreach ($z in $zips) {
    Write-Host "Archive: $($z.Name) ($($z.Length) bytes)"
    $archive = [System.IO.Compression.ZipFile]::OpenRead($z.FullName)
    foreach ($entry in $archive.Entries) {
        Write-Host "  - $($entry.FullName) ($($entry.Length) bytes, compressed: $($entry.CompressedLength) bytes)"
    }
    $archive.Dispose()
}
