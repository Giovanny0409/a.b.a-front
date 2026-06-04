$ErrorActionPreference = 'Stop'

$backendPath = 'C:\Users\carte\OneDrive\Desktop\backend aba'

if (-not (Test-Path $backendPath)) {
  Write-Error "No se encontro el backend en: $backendPath"
}

$backendListening = $false
try {
  $response = Invoke-WebRequest -UseBasicParsing -Method Head -Uri 'http://localhost:5028/swagger' -TimeoutSec 2
  $backendListening = $response.StatusCode -lt 500
} catch {
  $backendListening = $false
}

if ($backendListening) {
  Write-Host 'Backend ya esta activo en http://localhost:5028'
} else {
  Write-Host 'Iniciando backend en http://localhost:5028...'
  Start-Process -FilePath 'dotnet' -ArgumentList 'run' -WorkingDirectory $backendPath -WindowStyle Hidden
  Start-Sleep -Seconds 4
}

Write-Host 'Iniciando frontend en http://localhost:4200...'
ng serve --host 127.0.0.1 --port 4200
