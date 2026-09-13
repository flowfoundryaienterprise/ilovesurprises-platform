Add-Type -AssemblyName System.IO.Compression.FileSystem

$dir = "Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff"

$z1 = [System.IO.Compression.ZipFile]::OpenRead("$dir\Export_2026-09-11_225309.zip")
$e1 = $z1.GetEntry("Export Summary.csv")
$s1 = $e1.Open()
$r1 = New-Object System.IO.StreamReader($s1)
Write-Host "=== Export Summary (Products) ==="
Write-Host $r1.ReadToEnd()
$r1.Close()
$s1.Close()
$z1.Dispose()

$z2 = [System.IO.Compression.ZipFile]::OpenRead("$dir\Export_2026-09-11_202642.zip")
$e2 = $z2.GetEntry("Export Summary.csv")
$s2 = $e2.Open()
$r2 = New-Object System.IO.StreamReader($s2)
Write-Host "=== Export Summary (Collections) ==="
Write-Host $r2.ReadToEnd()
$r2.Close()
$s2.Close()
$z2.Dispose()
