# Start NGO Platform Backend
Write-Host "Starting NGO Donations Platform Backend..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
APP_ENV=dev
DATABASE_URL=postgresql://postgres:postgres%40123@localhost:5432/ngo_db
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
EXTERNAL_BASE_URL=http://localhost:8000
"@ | Out-File -FilePath ".env" -Encoding ASCII
}

# Start the backend
Write-Host "Starting FastAPI server on http://localhost:8000..." -ForegroundColor Cyan
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

