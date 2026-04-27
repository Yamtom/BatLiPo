param(
    [string]$SourceDir = "",
    [string]$OutputDir = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Convert-HtmlFragmentToText {
    param([string]$Html)

    if ([string]::IsNullOrEmpty($Html)) {
        return ""
    }

    $result = $Html

    # Preserve line breaks from cell content.
    $result = [regex]::Replace($result, "<br\s*/?>", "`n", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

    # Convert links before removing all tags.
    $result = [regex]::Replace(
        $result,
        '<a\b[^>]*href\s*=\s*(["''])(.*?)\1[^>]*>(.*?)</a>',
        {
            param($m)
            $href = $m.Groups[2].Value
            $text = [System.Net.WebUtility]::HtmlDecode(($m.Groups[3].Value -replace "<.*?>", "").Trim())
            if ([string]::IsNullOrWhiteSpace($text)) {
                $text = $href
            }
            return "[$text]($href)"
        },
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    $result = [regex]::Replace($result, "<[^>]+>", "")
    $result = [System.Net.WebUtility]::HtmlDecode($result)
    $result = $result -replace "`r", ""

    [string[]]$lines = @($result -split "`n" | ForEach-Object { $_.Trim() })

    if ($lines.Length -eq 0) {
        return ""
    }

    $start = 0
    $end = $lines.Length - 1

    while ($start -le $end -and [string]::IsNullOrWhiteSpace($lines[$start])) {
        $start++
    }

    while ($end -ge $start -and [string]::IsNullOrWhiteSpace($lines[$end])) {
        $end--
    }

    if ($start -gt $end) {
        return ""
    }

    return ((@($lines[$start..$end])) -join "<br>")
}

function Escape-MarkdownCell {
    param([string]$Value)

    if ($null -eq $Value) {
        return ""
    }

    $escaped = $Value -replace "\|", "\\|"
    return $escaped.Trim()
}

function New-CellGridFromTable {
    param($Table)

    $grid = @{}
    $occupied = @{}
    $maxCol = -1

    $rows = @($Table.rows)
    for ($r = 0; $r -lt $rows.Count; $r++) {
        $row = $rows[$r]
        $cells = @($row.cells)
        $col = 0

        foreach ($cell in $cells) {
            $className = ""
            if ($cell.className) {
                $className = [string]$cell.className
            }

            if ($className -match "row-header" -or $className -match "freezebar-cell") {
                continue
            }

            while ($occupied.ContainsKey("$r,$col")) {
                $col++
            }

            $rowSpan = 1
            $colSpan = 1
            if ($cell.rowSpan -and [int]$cell.rowSpan -gt 1) {
                $rowSpan = [int]$cell.rowSpan
            }
            if ($cell.colSpan -and [int]$cell.colSpan -gt 1) {
                $colSpan = [int]$cell.colSpan
            }

            $value = Convert-HtmlFragmentToText -Html ([string]$cell.innerHTML)

            for ($rs = 0; $rs -lt $rowSpan; $rs++) {
                for ($cs = 0; $cs -lt $colSpan; $cs++) {
                    $targetR = $r + $rs
                    $targetC = $col + $cs

                    if (-not $grid.ContainsKey($targetR)) {
                        $grid[$targetR] = @{}
                    }

                    $grid[$targetR][$targetC] = $value

                    if ($rs -gt 0 -or $cs -gt 0) {
                        $occupied["$targetR,$targetC"] = $true
                    }

                    if ($targetC -gt $maxCol) {
                        $maxCol = $targetC
                    }
                }
            }

            $col += $colSpan
        }
    }

    $ordered = @()
    foreach ($rKey in ($grid.Keys | Sort-Object)) {
        $rowOut = @()
        for ($c = 0; $c -le $maxCol; $c++) {
            if ($grid[$rKey].ContainsKey($c)) {
                $rowOut += [string]$grid[$rKey][$c]
            }
            else {
                $rowOut += ""
            }
        }
        $ordered += ,$rowOut
    }

    return $ordered
}

function Get-HeaderIndex {
    param([object[]]$Rows)

    if ($Rows.Count -eq 0) {
        return 0
    }

    $limit = [Math]::Min(10, $Rows.Count)
    $bestIndex = 0
    $bestScore = -1

    for ($i = 0; $i -lt $limit; $i++) {
        $nonEmpty = 0
        foreach ($cell in $Rows[$i]) {
            if (-not [string]::IsNullOrWhiteSpace($cell)) {
                $nonEmpty++
            }
        }
        if ($nonEmpty -gt $bestScore) {
            $bestScore = $nonEmpty
            $bestIndex = $i
        }
    }

    return $bestIndex
}

if ([string]::IsNullOrWhiteSpace($SourceDir)) {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    $chartRoot = Join-Path $repoRoot "chart"
    $candidate = Get-ChildItem -Path $chartRoot -Directory |
        Where-Object { Test-Path (Join-Path $_.FullName "Lasar.html") } |
        Select-Object -First 1

    if ($null -eq $candidate) {
        throw "Could not auto-discover source folder with HTML exports under: $chartRoot"
    }

    $SourceDir = $candidate.FullName
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path $SourceDir "_markdown_exports"
}

if (-not (Test-Path -LiteralPath $SourceDir)) {
    throw "Source directory not found: $SourceDir"
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$htmlFiles = Get-ChildItem -Path $SourceDir -Filter "*.html" -File | Sort-Object Name

foreach ($file in $htmlFiles) {
    $html = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8

    $doc = New-Object -ComObject "HTMLFile"
    $doc.IHTMLDocument2_write($html)
    $doc.Close()

    $tables = @($doc.getElementsByTagName("table"))
    if ($tables.Count -eq 0) {
        continue
    }

    $targetTable = $null
    foreach ($t in $tables) {
        $cls = ""
        if ($t.className) {
            $cls = [string]$t.className
        }
        if ($cls -match "waffle") {
            $targetTable = $t
            break
        }
    }

    if ($null -eq $targetTable) {
        $targetTable = $tables[0]
    }

    $rows = New-CellGridFromTable -Table $targetTable
    if ($rows.Count -eq 0) {
        continue
    }

    $headerIndex = Get-HeaderIndex -Rows $rows
    $headers = @($rows[$headerIndex])

    for ($i = 0; $i -lt $headers.Count; $i++) {
        if ([string]::IsNullOrWhiteSpace($headers[$i])) {
            $headers[$i] = "Column$($i + 1)"
        }
        $headers[$i] = Escape-MarkdownCell -Value $headers[$i]
    }

    $dataRows = @()
    for ($r = $headerIndex + 1; $r -lt $rows.Count; $r++) {
        $row = @($rows[$r])
        $isEmpty = $true
        for ($c = 0; $c -lt $headers.Count; $c++) {
            if ($c -ge $row.Count) {
                $row += ""
            }
            $row[$c] = Escape-MarkdownCell -Value $row[$c]
            if (-not [string]::IsNullOrWhiteSpace($row[$c])) {
                $isEmpty = $false
            }
        }
        if (-not $isEmpty) {
            $dataRows += ,$row
        }
    }

    $hasMerged = $false
    foreach ($row in @($targetTable.rows)) {
        foreach ($cell in @($row.cells)) {
            if (([int]$cell.rowSpan -gt 1) -or ([int]$cell.colSpan -gt 1)) {
                $hasMerged = $true
                break
            }
        }
        if ($hasMerged) {
            break
        }
    }

    $sheetName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $outName = "$sheetName`_export.md"
    $outPath = Join-Path -Path $OutputDir -ChildPath $outName

    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("# $sheetName")
    [void]$sb.AppendLine()
    [void]$sb.AppendLine("## Metadata")
    [void]$sb.AppendLine("- Source: $($file.Name)")
    [void]$sb.AppendLine("- Exported: $([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))")
    [void]$sb.AppendLine("- Header row index (0-based in extracted table): $headerIndex")
    [void]$sb.AppendLine("- Columns: $($headers.Count)")
    [void]$sb.AppendLine("- Data rows: $($dataRows.Count)")
    [void]$sb.AppendLine("- Merged cells expanded: $hasMerged")
    [void]$sb.AppendLine()
    [void]$sb.AppendLine("## Table Data")

    [void]$sb.AppendLine("| " + ($headers -join " | ") + " |")
    [void]$sb.AppendLine("| " + (($headers | ForEach-Object { "---" }) -join " | ") + " |")

    foreach ($row in $dataRows) {
        [void]$sb.AppendLine("| " + ($row -join " | ") + " |")
    }

    [void]$sb.AppendLine()
    [void]$sb.AppendLine("## Conversion Notes")
    [void]$sb.AppendLine("- Extracted from Google Sheets HTML table (table.waffle when available).")
    [void]$sb.AppendLine("- Row and column spans were expanded into a flat rectangular table.")
    [void]$sb.AppendLine("- Service row-header/freezebar cells were skipped.")
    [void]$sb.AppendLine("- Empty trailing rows were removed from output.")

    [System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.UTF8Encoding]::new($true))
    Write-Host "Converted: $($file.Name) -> $outName"
}

Write-Host "Done. Output folder: $OutputDir"
