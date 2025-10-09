# Start NGO Platform Frontend
Write-Host "Starting NGO Donations Platform Frontend..." -ForegroundColor Green

# Check if .env.local file exists
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    @"
VITE_API_BASE_URL=http://localhost:8000
"@ | Out-File -FilePath ".env.local" -Encoding ASCII
}

# Start the frontend
Write-Host "Starting Vite dev server on http://localhost:5173..." -ForegroundColor Cyan
npm run dev

