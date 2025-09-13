# Development Helper Script
param(
    [string]$Action = "help"
)

switch ($Action.ToLower()) {
    "start" {
        Write-Host "🚀 Starting development environment..." -ForegroundColor Green
        docker-compose up -d postgres redis minio
        Write-Host "✅ Infrastructure services started" -ForegroundColor Green
        Write-Host "Now run: npm run dev" -ForegroundColor Yellow
    }
    "stop" {
        Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✅ All services stopped" -ForegroundColor Green
    }
    "restart" {
        Write-Host "🔄 Restarting services..." -ForegroundColor Yellow
        docker-compose restart
        Write-Host "✅ Services restarted" -ForegroundColor Green
    }
    "logs" {
        Write-Host "📊 Showing logs..." -ForegroundColor Yellow
        docker-compose logs -f
    }
    "db" {
        Write-Host "🗄️ Database operations..." -ForegroundColor Yellow
        Write-Host "Available commands:" -ForegroundColor Cyan
        Write-Host "  reset    - Reset database" -ForegroundColor White
        Write-Host "  seed     - Seed with sample data" -ForegroundColor White
        Write-Host "  studio   - Open Prisma Studio" -ForegroundColor White
    }
    "db-reset" {
        Write-Host "🗄️ Resetting database..." -ForegroundColor Yellow
        cd backend
        npx prisma migrate reset --force
        npx prisma db push
        npx prisma db seed
        cd ..
        Write-Host "✅ Database reset complete" -ForegroundColor Green
    }
    "db-seed" {
        Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
        cd backend
        npx prisma db seed
        cd ..
        Write-Host "✅ Database seeded" -ForegroundColor Green
    }
    "db-studio" {
        Write-Host "🎨 Opening Prisma Studio..." -ForegroundColor Yellow
        cd backend
        npx prisma studio
    }
    "clean" {
        Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
        docker-compose down -v
        docker system prune -f
        Write-Host "✅ Cleanup complete" -ForegroundColor Green
    }
    default {
        Write-Host "🔧 Premium Chat App Development Helper" -ForegroundColor Green
        Write-Host ""
        Write-Host "Available commands:" -ForegroundColor Cyan
        Write-Host "  start     - Start infrastructure services" -ForegroundColor White
        Write-Host "  stop      - Stop all services" -ForegroundColor White
        Write-Host "  restart   - Restart all services" -ForegroundColor White
        Write-Host "  logs      - Show service logs" -ForegroundColor White
        Write-Host "  db        - Database operations help" -ForegroundColor White
        Write-Host "  db-reset  - Reset database" -ForegroundColor White
        Write-Host "  db-seed   - Seed database" -ForegroundColor White
        Write-Host "  db-studio - Open Prisma Studio" -ForegroundColor White
        Write-Host "  clean     - Clean up everything" -ForegroundColor White
        Write-Host ""
        Write-Host "Usage: .\scripts\dev.ps1 <command>" -ForegroundColor Yellow
    }
}
