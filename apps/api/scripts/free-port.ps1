param([int]$Port = 3001)

$connections = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
if (-not $connections) {
  Write-Host "Puerto $Port ya está libre."
  exit 0
}

$pids = $connections | ForEach-Object {
  ($_ -split '\s+')[-1]
} | Select-Object -Unique

foreach ($procId in $pids) {
  Write-Host "Cerrando proceso $procId en puerto $Port..."
  taskkill /PID $procId /F 2>$null
}

Write-Host "Puerto $Port liberado."
