Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff\Export_2026-09-11_225309.zip"
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entry = $archive.GetEntry("Products.csv")

$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)

# Helper function to parse CSV line
function Parse-CsvLine($line) {
    $vals = New-Object System.Collections.Generic.List[string]
    $sb = New-Object System.Text.StringBuilder
    $inQuotes = $false
    for ($i = 0; $i -lt $line.Length; $i++) {
        $c = $line[$i]
        if ($c -eq '"') {
            if ($inQuotes -and $i + 1 -lt $line.Length -and $line[$i + 1] -eq '"') {
                [void]$sb.Append('"')
                $i++
            } else {
                $inQuotes = -not $inQuotes
            }
        } elseif ($c -eq ',' -and -not $inQuotes) {
            $vals.Add($sb.ToString())
            $sb.Clear() | Out-Null
        } else {
            [void]$sb.Append($c)
        }
    }
    $vals.Add($sb.ToString())
    return $vals
}

$headerLine = $reader.ReadLine()
$headers = Parse-CsvLine($headerLine)

$colTopRow = $headers.IndexOf("Top Row")
$colID = $headers.IndexOf("ID")
$colHandle = $headers.IndexOf("Handle")
$colTitle = $headers.IndexOf("Title")
$colVariantID = $headers.IndexOf("Variant ID")
$colImageSrc = $headers.IndexOf("Image Src")
$colPrice = $headers.IndexOf("Variant Price")
$colComparePrice = $headers.IndexOf("Variant Compare At Price")
$colSKU = $headers.IndexOf("Variant SKU")
$colOpt1Name = $headers.IndexOf("Option1 Name")
$colOpt1Val = $headers.IndexOf("Option1 Value")
$colOpt2Name = $headers.IndexOf("Option2 Name")
$colOpt2Val = $headers.IndexOf("Option2 Value")
$colOpt3Name = $headers.IndexOf("Option3 Name")
$colOpt3Val = $headers.IndexOf("Option3 Value")

Write-Host "Columns mapped successfully."

$prodCount = 0
$variantCount = 0
$imageCount = 0
$blankSkuCount = 0
$zeroPriceCount = 0
$multiOptionCount = 0

$productHandles = New-Object 'System.Collections.Generic.HashSet[string]'
$variantIds = New-Object 'System.Collections.Generic.HashSet[string]'

$lineNum = 0
$sw = [System.Diagnostics.Stopwatch]::StartNew()

while (($line = $reader.ReadLine()) -ne $null) {
    $lineNum++
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $row = Parse-CsvLine($line)
    if ($row.Count -le $colVariantID) { continue }

    $isTopRow = $row[$colTopRow] -eq "true"
    if ($isTopRow) {
        $prodCount++
        $h = $row[$colHandle]
        if (-not [string]::IsNullOrEmpty($h)) {
            [void]$productHandles.Add($h)
        }
    }

    $varId = $row[$colVariantID]
    if (-not [string]::IsNullOrEmpty($varId)) {
        $variantCount++
        [void]$variantIds.Add($varId)

        $sku = $row[$colSKU]
        if ([string]::IsNullOrEmpty($sku)) { $blankSkuCount++ }

        $price = $row[$colPrice]
        if ([string]::IsNullOrEmpty($price) -or $price -eq "0" -or $price -eq "0.00") { $zeroPriceCount++ }

        if (-not [string]::IsNullOrEmpty($row[$colOpt2Name]) -or -not [string]::IsNullOrEmpty($row[$colOpt3Name])) {
            $multiOptionCount++
        }
    }

    $img = $row[$colImageSrc]
    if (-not [string]::IsNullOrEmpty($img)) {
        $imageCount++
    }

    if ($lineNum % 250000 -eq 0) {
        Write-Host "Processed $lineNum rows in $([math]::Round($sw.Elapsed.TotalSeconds, 1))s: Products=$prodCount, Variants=$variantCount, Images=$imageCount"
    }
}

$sw.Stop()
Write-Host "`n=== Products.csv Audit Complete ==="
Write-Host "Execution time: $([math]::Round($sw.Elapsed.TotalSeconds, 1)) seconds"
Write-Host "Total CSV rows: $lineNum"
Write-Host "Total Products (Top Row = true): $prodCount"
Write-Host "Unique Product Handles: $($productHandles.Count)"
Write-Host "Total Variants (non-empty Variant ID): $variantCount"
Write-Host "Unique Variant IDs: $($variantIds.Count)"
Write-Host "Total Images (non-empty Image Src): $imageCount"
Write-Host "Variants with Blank SKU: $blankSkuCount"
Write-Host "Variants with Zero/Blank Price: $zeroPriceCount"
Write-Host "Variants with Multi-Option: $multiOptionCount"

$reader.Close()
$stream.Close()
$archive.Dispose()
