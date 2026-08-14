$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
New-Item -ItemType Directory -Path (Join-Path $Root "logs") -Force | Out-Null

$existing = Get-CimInstance Win32_Process -Filter "name='node.exe'" |
  Where-Object { $_.CommandLine -and $_.CommandLine -match "trae-auto-kit\\work-intl\\watch\.mjs" }

if ($existing) {
  Write-Host "Already running PID $($existing.ProcessId)"
  exit 0
}

$out = Join-Path $Root "logs\watch-stdout.log"
$err = Join-Path $Root "logs\watch-stderr.log"
$script = Join-Path $Root "watch.mjs"

Start-Process -FilePath "node" `
  -ArgumentList $script `
  -WorkingDirectory $Root `
  -WindowStyle Minimized `
  -RedirectStandardOutput $out `
  -RedirectStandardError $err

Start-Sleep -Seconds 1

$n = Get-CimInstance Win32_Process -Filter "name='node.exe'" |
  Where-Object { $_.CommandLine -and $_.CommandLine -match "trae-auto-kit\\work-intl\\watch\.mjs" }

if ($n) {
  Write-Host "Started WorkIntl watch PID $($n.ProcessId)"
  exit 0
}

Write-Host "Start failed"
if (Test-Path $err) { Get-Content $err -Tail 30 }
exit 1