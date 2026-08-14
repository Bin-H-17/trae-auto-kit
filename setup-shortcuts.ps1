# Rebuild desktop + Startup shortcuts for Trae Auto Kit
# 迁机：先改下面 $Paths，再执行本脚本。说明见 交接说明.md

$ErrorActionPreference = "Stop"
$KitRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Desktop = [Environment]::GetFolderPath("Desktop")
$Startup = [Environment]::GetFolderPath("Startup")
$Wsh = New-Object -ComObject WScript.Shell

# ========== 新电脑请改这里 ==========
$Paths = @{
  TraeCnExe   = "D:\Apps\TraeCN\Trae CN.exe"
  TraeWorkExe = "D:\AI\Trae_Work\TRAE SOLO CN.exe"
  TraeData1   = "D:\TraeData1"
  TraeData2   = "D:\TraeData2"
  WorkData1   = "D:\TraeWorkData1"
  WorkData2   = "D:\TraeWorkData2"
}
# ==================================

function Set-Lnk {
  param(
    [string]$LnkPath,
    [string]$Target,
    [string]$Arguments = "",
    [string]$WorkDir = ""
  )
  $s = $Wsh.CreateShortcut($LnkPath)
  $s.TargetPath = $Target
  $s.Arguments = $Arguments
  if ($WorkDir) { $s.WorkingDirectory = $WorkDir }
  elseif (Test-Path $Target) { $s.WorkingDirectory = Split-Path $Target }
  $s.Save()
  Write-Host "OK $LnkPath"
}

Write-Host "KitRoot = $KitRoot"
Write-Host ""

if (Test-Path $Paths.TraeCnExe) {
  Set-Lnk (Join-Path $Desktop "Trae cn.lnk") $Paths.TraeCnExe "--remote-debugging-port=39241"
  Set-Lnk (Join-Path $Desktop "Trae_cn_2.lnk") $Paths.TraeCnExe "--user-data-dir=`"$($Paths.TraeData1)`" --remote-debugging-port=39242"
  Set-Lnk (Join-Path $Desktop "Trae_cn_3.lnk") $Paths.TraeCnExe "--user-data-dir=`"$($Paths.TraeData2)`" --remote-debugging-port=39243"
} else {
  Write-Host "SKIP CN exe missing: $($Paths.TraeCnExe)"
}

if (Test-Path $Paths.TraeWorkExe) {
  Set-Lnk (Join-Path $Desktop "TRAE Work CN.lnk") $Paths.TraeWorkExe "--remote-debugging-port=39341"
  Set-Lnk (Join-Path $Desktop "TRAE Work CN 2.lnk") $Paths.TraeWorkExe "--user-data-dir=`"$($Paths.WorkData1)`" --remote-debugging-port=39342"
  Set-Lnk (Join-Path $Desktop "TRAE Work CN 3.lnk") $Paths.TraeWorkExe "--user-data-dir=`"$($Paths.WorkData2)`" --remote-debugging-port=39343"
} else {
  Write-Host "SKIP Work exe missing: $($Paths.TraeWorkExe)"
}

Set-Lnk (Join-Path $Desktop "TraeCN-常驻监视.lnk") (Join-Path $KitRoot "cn\常驻监视.bat")
Set-Lnk (Join-Path $Desktop "TraeCN-停止监视.lnk") (Join-Path $KitRoot "cn\停止.bat")
Set-Lnk (Join-Path $Desktop "TraeWork-常驻监视.lnk") (Join-Path $KitRoot "work\常驻监视.bat")
Set-Lnk (Join-Path $Desktop "TraeWork-停止监视.lnk") (Join-Path $KitRoot "work\停止.bat")

Set-Lnk (Join-Path $Startup "TraeCN-AutoClick.lnk") (Join-Path $KitRoot "cn\常驻监视.bat")
Set-Lnk (Join-Path $Startup "TraeWork-AutoClick.lnk") (Join-Path $KitRoot "work\常驻监视.bat")

Write-Host ""
Write-Host "Done. 请结束旧 Trae 进程后，用新快捷方式重新打开，再跑常驻监视。"
