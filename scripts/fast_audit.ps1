Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.IO.Compression;
using System.Collections.Generic;

#pragma warning disable
public class FastAudit
{
    public static void Run(string zipPath)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        using (var archive = ZipFile.OpenRead(zipPath))
        {
            var entry = archive.GetEntry("Products.csv");
            using (var stream = entry.Open())
            using (var reader = new StreamReader(stream))
            {
                string headerLine = reader.ReadLine();
                var headers = headerLine.Split(new string[] { "\",\"" }, StringSplitOptions.None);
                for (int i = 0; i < headers.Length; i++) headers[i] = headers[i].Trim('"');

                int colTopRow = Array.IndexOf(headers, "Top Row");
                int colID = Array.IndexOf(headers, "ID");
                int colHandle = Array.IndexOf(headers, "Handle");
                int colVariantID = Array.IndexOf(headers, "Variant ID");
                int colImageSrc = Array.IndexOf(headers, "Image Src");
                int colPrice = Array.IndexOf(headers, "Variant Price");
                int colSku = Array.IndexOf(headers, "Variant SKU");

                int totalLines = 0;
                int topRowCount = 0;
                int variantCount = 0;
                int imageCount = 0;
                int blankSkuCount = 0;
                int zeroPriceCount = 0;

                var handles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var variantIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                string line;
                while ((line = reader.ReadLine()) != null)
                {
                    totalLines++;
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    int col = 0;
                    bool inQuotes = false;
                    int start = 0;

                    string valTopRow = "";
                    string valHandle = "";
                    string valVarId = "";
                    string valImg = "";
                    string valPrice = "";
                    string valSku = "";

                    for (int i = 0; i < line.Length; i++)
                    {
                        char c = line[i];
                        if (c == '"') inQuotes = !inQuotes;
                        else if (c == ',' && !inQuotes)
                        {
                            int len = i - start;
                            string val = (len > 0) ? line.Substring(start, len).Trim('"') : "";
                            if (col == colTopRow) valTopRow = val;
                            else if (col == colHandle) valHandle = val;
                            else if (col == colVariantID) valVarId = val;
                            else if (col == colImageSrc) valImg = val;
                            else if (col == colPrice) valPrice = val;
                            else if (col == colSku) valSku = val;

                            col++;
                            start = i + 1;
                        }
                    }

                    if (valTopRow == "true")
                    {
                        topRowCount++;
                        if (!string.IsNullOrEmpty(valHandle)) handles.Add(valHandle);
                    }

                    if (!string.IsNullOrEmpty(valVarId))
                    {
                        variantCount++;
                        variantIds.Add(valVarId);
                        if (string.IsNullOrEmpty(valSku)) blankSkuCount++;
                        if (string.IsNullOrEmpty(valPrice) || valPrice == "0" || valPrice == "0.00") zeroPriceCount++;
                    }

                    if (!string.IsNullOrEmpty(valImg))
                    {
                        imageCount++;
                    }
                }

                sw.Stop();
                Console.WriteLine("=== FAST AUDIT COMPLETE ===");
                Console.WriteLine("Execution Time: " + sw.Elapsed.TotalSeconds.ToString("F1") + "s");
                Console.WriteLine("Total Lines: " + totalLines);
                Console.WriteLine("Top Row Products: " + topRowCount);
                Console.WriteLine("Unique Handles: " + handles.Count);
                Console.WriteLine("Total Variants: " + variantCount);
                Console.WriteLine("Unique Variant IDs: " + variantIds.Count);
                Console.WriteLine("Total Images: " + imageCount);
                Console.WriteLine("Blank SKUs: " + blankSkuCount);
                Console.WriteLine("Zero/Blank Price: " + zeroPriceCount);
            }
        }
    }
}
"@ -ReferencedAssemblies System.IO.Compression, System.IO.Compression.FileSystem

[FastAudit]::Run("Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff\Export_2026-09-11_225309.zip")
