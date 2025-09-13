# Premium Chat App Setup Script for Windows
Write-Host "🚀 Setting up Premium Chat App..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ .env file created. Please review and update the configuration." -ForegroundColor Green
}

# Generate secure JWT secrets
Write-Host "🔐 Generating secure JWT secrets..." -ForegroundColor Yellow
$JWT_SECRET = [System.Web.Security.Membership]::GeneratePassword(32, 0)
$JWT_REFRESH_SECRET = [System.Web.Security.Membership]::GeneratePassword(32, 0)

# Update .env file with generated secrets
$envContent = Get-Content ".env"
$envContent = $envContent -replace "your-super-secret-jwt-key-change-this-in-production", $JWT_SECRET
$envContent = $envContent -replace "your-super-secret-refresh-key-change-this-in-production", $JWT_REFRESH_SECRET
$envContent | Set-Content ".env"

Write-Host "✅ JWT secrets generated and updated in .env file" -ForegroundColor Green

# Start the application
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if services are running
$runningServices = docker-compose ps | Select-String "Up"
if ($runningServices) {
    Write-Host "✅ Services are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Setup complete! Your chat app is ready:" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Cyan
    Write-Host "   MinIO:    http://localhost:9001" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Sample accounts:" -ForegroundColor Yellow
    Write-Host "   Email: alice@example.com | Password: password123" -ForegroundColor White
    Write-Host "   Email: bob@example.com   | Password: password123" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 To stop the application: docker-compose down" -ForegroundColor Gray
    Write-Host "📊 To view logs: docker-compose logs -f" -ForegroundColor Gray
} else {
    Write-Host "❌ Some services failed to start. Check logs with: docker-compose logs" -ForegroundColor Red
    exit 1
}
