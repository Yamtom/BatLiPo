param(
  [string]$Root = ".",
  [int]$MaxGrok = 20,
  [int]$MaxClaude = 20,
  [int]$MaxChatGPT = 20,
  [int]$MaxGemini = 20,
  [switch]$ChangedOnly
)

$ErrorActionPreference = "Stop"

function Get-Score {
  param([string]$Text)

  $t = $Text
  $scores = @{ ChatGPT = 0.0; Gemini = 0.0; Grok = 0.0; Claude = 0.0; Human = 0.0 }

  # ChatGPT-like markers
  $scores.ChatGPT += ([regex]::Matches($t, 'try\s*\{').Count * 1.8)
  $scores.ChatGPT += ([regex]::Matches($t, 'catch\s*\(').Count * 1.6)
  $scores.ChatGPT += ([regex]::Matches($t, 'if\s*\(!\w+\)\s*return').Count * 1.2)
  $scores.ChatGPT += ([regex]::Matches($t, 'normalize|validate|helper|fallback|guard', 'IgnoreCase').Count * 0.7)

  # Gemini-like markers
  $scores.Gemini += ([regex]::Matches($t, 'forEach\s*\(').Count * 1.2)
  $scores.Gemini += ([regex]::Matches($t, 'map\s*\(|filter\s*\(|reduce\s*\(', 'IgnoreCase').Count * 1.0)
  $scores.Gemini += ([regex]::Matches($t, 'const\s+\w+\s*=\s*\(.*\)\s*=>').Count * 1.0)
  $scores.Gemini += ([regex]::Matches($t, 'TODO|quick|simple', 'IgnoreCase').Count * 0.5)

  # Grok-like markers (over-casual or flashy quick-fix style)
  $scores.Grok += ([regex]::Matches($t, 'hack|quickfix|magic|super|ultra|lol', 'IgnoreCase').Count * 3.0)
  $scores.Grok += ([regex]::Matches($t, 'console\.log\(').Count * 0.8)
  $scores.Grok += ([regex]::Matches($t, '!\!\!|\?\?\?', 'IgnoreCase').Count * 1.5)

  # Claude-like markers (verbose explanatory/doc-heavy structures)
  $scores.Claude += ([regex]::Matches($t, '/\*\*[\s\S]*?\*/').Count * 0.9)
  $scores.Claude += ([regex]::Matches($t, 'rationale|trade-off|assumption|note:', 'IgnoreCase').Count * 1.2)
  $scores.Claude += ([regex]::Matches($t, 'Step\s*\d+|Крок\s*\d+', 'IgnoreCase').Count * 1.1)

  # Human/team-style baseline (domain naming + structural variety)
  $lineCount = [regex]::Matches($t, "`n").Count + 1
  $fnMatches = [regex]::Matches($t, 'function\s+([A-Za-z_\$][A-Za-z0-9_\$]*)')
  $uniqueFns = @{}
  foreach ($m in $fnMatches) { $uniqueFns[$m.Groups[1].Value] = $true }
  $domainHits = [regex]::Matches($t, 'CONFIG|COLS|sheet|row|col|date|risk|flight|board', 'IgnoreCase').Count
  $scores.Human += 8
  $scores.Human += [math]::Min(15, $lineCount / 40)
  $scores.Human += [math]::Min(12, $uniqueFns.Count * 0.8)
  $scores.Human += [math]::Min(10, $domainHits * 0.2)

  $sum = $scores.ChatGPT + $scores.Gemini + $scores.Grok + $scores.Claude + $scores.Human
  if ($sum -lt 0.01) {
    return [pscustomobject]@{ ChatGPT = 0; Gemini = 0; Grok = 0; Claude = 0; Human = 100; Confidence = 10 }
  }

  $chat = [math]::Round(($scores.ChatGPT / $sum) * 100, 1)
  $gem  = [math]::Round(($scores.Gemini  / $sum) * 100, 1)
  $grok = [math]::Round(($scores.Grok    / $sum) * 100, 1)
  $clau = [math]::Round(($scores.Claude  / $sum) * 100, 1)
  $human = [math]::Round(($scores.Human / $sum) * 100, 1)

  # Confidence depends on amount of signal
  $signal = ([regex]::Matches($t, 'function\s+|=>|try\s*\{|catch\s*\(|/\*\*|if\s*\(', 'IgnoreCase').Count)
  $confidence = [math]::Min(95, [math]::Max(20, [math]::Round(20 + ($signal * 1.5), 0)))

  return [pscustomobject]@{
    ChatGPT = $chat; Gemini = $gem; Grok = $grok; Claude = $clau; Human = $human; Confidence = $confidence
  }
}

function Get-Files {
  param([string]$Base, [switch]$OnlyChanged)

  if ($OnlyChanged) {
    Push-Location $Base
    try {
      $unstaged = @(git diff --name-only)
      $staged = @(git diff --name-only --cached)
      $untracked = @(git ls-files --others --exclude-standard)
    } finally {
      Pop-Location
    }
    $gitOut = @($unstaged + $staged + $untracked) | Sort-Object -Unique
    if (-not $gitOut -or $gitOut.Count -eq 0) { return @() }
    return $gitOut |
      Where-Object { $_ -match '\.(gs|html)$' } |
      ForEach-Object { Join-Path $Base $_ } |
      Where-Object { Test-Path $_ }
  }

  return Get-ChildItem -Path $Base -Recurse -File |
    Where-Object { $_.Extension -in '.gs', '.html' } |
    Select-Object -ExpandProperty FullName
}

$basePath = (Resolve-Path $Root).Path
$files = Get-Files -Base $basePath -OnlyChanged:$ChangedOnly

if (-not $files -or $files.Count -eq 0) {
  Write-Host "No matching files found."
  exit 0
}

$results = @()
foreach ($f in $files) {
  $content = Get-Content -Path $f -Raw -Encoding UTF8
  $score = Get-Score -Text $content
  $full = (Resolve-Path $f).Path
  $rel = $full
  if ($full.StartsWith($basePath, [System.StringComparison]::OrdinalIgnoreCase)) {
    $rel = $full.Substring($basePath.Length).TrimStart('\\')
  }

  $status = "OK"
  $issues = @()

  if ($score.Grok -gt $MaxGrok) { $status = "FAIL"; $issues += "Grok>$MaxGrok" }
  if ($score.Claude -gt $MaxClaude) { $status = "FAIL"; $issues += "Claude>$MaxClaude" }
  if ($score.ChatGPT -gt $MaxChatGPT) { $status = "WARN"; $issues += "ChatGPT>$MaxChatGPT" }
  if ($score.Gemini -gt $MaxGemini) { $status = "WARN"; $issues += "Gemini>$MaxGemini" }

  $results += [pscustomobject]@{
    File = $rel
    ChatGPT = $score.ChatGPT
    Gemini = $score.Gemini
    Grok = $score.Grok
    Claude = $score.Claude
    Human = $score.Human
    Confidence = $score.Confidence
    Status = $status
    Notes = ($issues -join '; ')
  }
}

$results = $results | Sort-Object File
$results | Format-Table -AutoSize

$folderSummary = $results |
  ForEach-Object {
    $folder = ($_.File -split '\\')[0]
    [pscustomobject]@{ Folder = $folder; ChatGPT = $_.ChatGPT; Gemini = $_.Gemini; Grok = $_.Grok; Claude = $_.Claude; Human = $_.Human }
  } |
  Group-Object Folder |
  ForEach-Object {
    [pscustomobject]@{
      Folder = $_.Name
      ChatGPT = [math]::Round((($_.Group | Measure-Object ChatGPT -Average).Average), 1)
      Gemini  = [math]::Round((($_.Group | Measure-Object Gemini  -Average).Average), 1)
      Grok    = [math]::Round((($_.Group | Measure-Object Grok    -Average).Average), 1)
      Claude  = [math]::Round((($_.Group | Measure-Object Claude  -Average).Average), 1)
      Human   = [math]::Round((($_.Group | Measure-Object Human   -Average).Average), 1)
    }
  } | Sort-Object Folder

Write-Host "`nFolder averages:"
$folderSummary | Format-Table -AutoSize

$hardFail = ($results | Where-Object { $_.Status -eq 'FAIL' }).Count -gt 0
if ($hardFail) {
  Write-Error "Style gate failed: at least one file exceeds hard limits (Grok/Claude)."
  exit 2
}

Write-Host "`nStyle audit completed."
exit 0
