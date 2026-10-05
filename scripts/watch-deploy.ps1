# Theo dõi thư mục dự án; khi bạn tự sửa file (không qua Claude), đợi 5 giây yên tĩnh rồi tự commit + push.
# Chạy: powershell -ExecutionPolicy Bypass -File scripts\watch-deploy.ps1   (Ctrl+C để dừng)
$root = Split-Path $PSScriptRoot -Parent
$watcher = New-Object IO.FileSystemWatcher $root, '*'
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
Write-Host "Đang theo dõi $root ... (Ctrl+C để dừng)"

$last = $null
while ($true) {
  $e = $watcher.WaitForChanged([IO.WatcherChangeTypes]::All, 1000)
  if (-not $e.TimedOut) {
    if ($e.Name -notmatch '^\.git([\\/]|$)') { $last = Get-Date }
  } elseif ($last -and ((Get-Date) - $last).TotalSeconds -ge 5) {
    $last = $null
    Push-Location $root
    & bash scripts/auto-deploy.sh
    Pop-Location
  }
}
