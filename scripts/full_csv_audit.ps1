Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.IO.Compression;
using System.Collections.Generic;
using System.Text;

public class FullMatrixifyProductAudit
{
    public static void Audit(string zipPath)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        using (var archive = ZipFile.OpenRead(zipPath))
        {
            var entry = archive.GetEntry("Products.csv");
            using (var stream = entry.Open())
            using (var reader = new StreamReader(stream, Encoding.UTF8, true, 65536))
            {
                // Parse header
                var headerCols = ReadNextRecord(reader);
                if (headerCols == null) { Console.WriteLine("Empty CSV"); return; }

                int colID = headerCols.IndexOf("ID");
                int colHandle = headerCols.IndexOf("Handle");
                int colTitle = headerCols.IndexOf("Title");
                int colTopRow = headerCols.IndexOf("Top Row");
                int colVarID = headerCols.IndexOf("Variant ID");
                int colVarPrice = headerCols.IndexOf("Variant Price");
                int colVarComparePrice = headerCols.IndexOf("Variant Compare At Price");
                int colVarSku = headerCols.IndexOf("Variant SKU");
                int colImgSrc = headerCols.IndexOf("Image Src");
                int colOpt1Name = headerCols.IndexOf("Option1 Name");
                int colOpt1Val = headerCols.IndexOf("Option1 Value");
                int colOpt2Name = headerCols.IndexOf("Option2 Name");
                int colOpt2Val = headerCols.IndexOf("Option2 Value");
                int colOpt3Name = headerCols.IndexOf("Option3 Name");
                int colOpt3Val = headerCols.IndexOf("Option3 Value");

                long recordCount = 0;
                var productIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var productHandles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var variantIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var imageSrcs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                
                // Track options per product: Key = product_id + ":" + position + ":" + name
                var productOptions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                // Track option values: Key = product_id + ":" + option_name + ":" + value
                var optionValues = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                long topRowTrueCount = 0;
                long variantRows = 0;
                long imageRows = 0;
                long blankSkuCount = 0;
                long zeroPriceCount = 0;
                long missingVariantIdCount = 0;

                List<string> record;
                while ((record = ReadNextRecord(reader)) != null)
                {
                    recordCount++;

                    string id = colID >= 0 && colID < record.Count ? record[colID].Trim() : "";
                    string handle = colHandle >= 0 && colHandle < record.Count ? record[colHandle].Trim() : "";
                    string topRow = colTopRow >= 0 && colTopRow < record.Count ? record[colTopRow].Trim() : "";
                    string varId = colVarID >= 0 && colVarID < record.Count ? record[colVarID].Trim() : "";
                    string imgSrc = colImgSrc >= 0 && colImgSrc < record.Count ? record[colImgSrc].Trim() : "";
                    string price = colVarPrice >= 0 && colVarPrice < record.Count ? record[colVarPrice].Trim() : "";
                    string sku = colVarSku >= 0 && colVarSku < record.Count ? record[colVarSku].Trim() : "";

                    string opt1Name = colOpt1Name >= 0 && colOpt1Name < record.Count ? record[colOpt1Name].Trim() : "";
                    string opt1Val = colOpt1Val >= 0 && colOpt1Val < record.Count ? record[colOpt1Val].Trim() : "";
                    string opt2Name = colOpt2Name >= 0 && colOpt2Name < record.Count ? record[colOpt2Name].Trim() : "";
                    string opt2Val = colOpt2Val >= 0 && colOpt2Val < record.Count ? record[colOpt2Val].Trim() : "";
                    string opt3Name = colOpt3Name >= 0 && colOpt3Name < record.Count ? record[colOpt3Name].Trim() : "";
                    string opt3Val = colOpt3Val >= 0 && colOpt3Val < record.Count ? record[colOpt3Val].Trim() : "";

                    if (topRow.Equals("true", StringComparison.OrdinalIgnoreCase))
                    {
                        topRowTrueCount++;
                    }

                    if (!string.IsNullOrEmpty(id))
                    {
                        productIds.Add(id);
                    }
                    if (!string.IsNullOrEmpty(handle))
                    {
                        productHandles.Add(handle);
                    }

                    // Variant processing
                    if (!string.IsNullOrEmpty(varId))
                    {
                        variantRows++;
                        variantIds.Add(varId);
                        if (string.IsNullOrEmpty(sku)) blankSkuCount++;
                        if (string.IsNullOrEmpty(price) || price == "0" || price == "0.00") zeroPriceCount++;

                        // Options
                        if (!string.IsNullOrEmpty(opt1Name) && !string.IsNullOrEmpty(id))
                        {
                            productOptions.Add(id + ":1:" + opt1Name);
                            if (!string.IsNullOrEmpty(opt1Val)) optionValues.Add(id + ":" + opt1Name + ":" + opt1Val);
                        }
                        if (!string.IsNullOrEmpty(opt2Name) && !string.IsNullOrEmpty(id))
                        {
                            productOptions.Add(id + ":2:" + opt2Name);
                            if (!string.IsNullOrEmpty(opt2Val)) optionValues.Add(id + ":" + opt2Name + ":" + opt2Val);
                        }
                        if (!string.IsNullOrEmpty(opt3Name) && !string.IsNullOrEmpty(id))
                        {
                            productOptions.Add(id + ":3:" + opt3Name);
                            if (!string.IsNullOrEmpty(opt3Val)) optionValues.Add(id + ":" + opt3Name + ":" + opt3Val);
                        }
                    }
                    else if (topRow.Equals("true", StringComparison.OrdinalIgnoreCase) && string.IsNullOrEmpty(varId))
                    {
                        missingVariantIdCount++;
                    }

                    // Image processing
                    if (!string.IsNullOrEmpty(imgSrc))
                    {
                        imageRows++;
                        if (!string.IsNullOrEmpty(id))
                        {
                            imageSrcs.Add(id + ":" + imgSrc);
                        }
                    }
                }

                sw.Stop();
                Console.WriteLine("======================================================================");
                Console.WriteLine("=== AUTHORITATIVE PRODUCTS.CSV MULTI-LINE STREAM AUDIT ===");
                Console.WriteLine("======================================================================");
                Console.WriteLine("Parse Time: " + sw.Elapsed.TotalSeconds.ToString("F1") + " seconds");
                Console.WriteLine("Total Normalized Logical Records: " + recordCount);
                Console.WriteLine("Products with Top Row = true: " + topRowTrueCount);
                Console.WriteLine("Unique Product IDs: " + productIds.Count);
                Console.WriteLine("Unique Product Handles: " + productHandles.Count);
                Console.WriteLine("Total Variant Rows: " + variantRows);
                Console.WriteLine("Unique Variant IDs: " + variantIds.Count);
                Console.WriteLine("Unique Images (product_id + image_url): " + imageSrcs.Count);
                Console.WriteLine("Total Image Rows: " + imageRows);
                Console.WriteLine("Unique Product Options (product_id + position + name): " + productOptions.Count);
                Console.WriteLine("Unique Option Values (product_id + name + value): " + optionValues.Count);
                Console.WriteLine("Variants with Blank SKU: " + blankSkuCount);
                Console.WriteLine("Variants with Zero/Blank Price: " + zeroPriceCount);
                Console.WriteLine("Products Missing Variant ID on Top Row: " + missingVariantIdCount);
                Console.WriteLine("======================================================================");
            }
        }
    }

    // RFC 4180 compliant CSV stream reader handling multi-line quoted fields
    private static List<string> ReadNextRecord(StreamReader reader)
    {
        var fields = new List<string>();
        var sb = new StringBuilder();
        bool inQuotes = false;
        bool hasData = false;

        while (true)
        {
            int ch = reader.Read();
            if (ch == -1)
            {
                if (hasData || fields.Count > 0)
                {
                    fields.Add(sb.ToString());
                    return fields;
                }
                return null;
            }

            char c = (char)ch;
            hasData = true;

            if (c == '"')
            {
                if (inQuotes)
                {
                    int next = reader.Peek();
                    if (next == '"')
                    {
                        reader.Read(); // Consume second quote
                        sb.Append('"');
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    inQuotes = true;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                fields.Add(sb.ToString());
                sb.Clear();
            }
            else if ((c == '\r' || c == '\n') && !inQuotes)
            {
                if (c == '\r' && reader.Peek() == '\n')
                {
                    reader.Read(); // consume LF
                }
                fields.Add(sb.ToString());
                return fields;
            }
            else
            {
                sb.Append(c);
            }
        }
    }
}
"@ -ReferencedAssemblies System.IO.Compression, System.IO.Compression.FileSystem

[FullMatrixifyProductAudit]::Audit("Backend_Data\I Love Surprises Backend Data\ILoveSurprises_Final_Developer_Handoff\Export_2026-09-11_225309.zip")
