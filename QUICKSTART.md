# ⚡ Quick Start Guide

Get your Premium Chat App running in **under 5 minutes**!

## 🚀 One-Command Setup

### Windows (PowerShell)
```powershell
# Run the setup script
.\scripts\setup.ps1

# Or manually:
docker-compose up -d
```

### macOS/Linux
```bash
# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Or manually:
docker-compose up -d
```

## 🎯 What Happens Next

1. **Docker containers start** (PostgreSQL, Redis, MinIO, Backend, Frontend)
2. **Database is initialized** with sample data
3. **Secure JWT secrets** are generated automatically
4. **Application is ready** at http://localhost:3000

## 👥 Test Accounts

The setup creates sample accounts you can use immediately:

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | password123 | Product Designer |
| bob@example.com | password123 | Full-stack Developer |
| charlie@example.com | password123 | DevOps Engineer |
| diana@example.com | password123 | UX Researcher |

## 🎨 First Steps

1. **Open** http://localhost:3000
2. **Login** with any test account
3. **Start chatting** in the "General Discussion" room
4. **Create new rooms** or send direct messages
5. **Upload files** and share images
6. **Try reactions** and see typing indicators

## 🔧 Development Commands

```powershell
# Start infrastructure only
.\scripts\dev.ps1 start

# View logs
.\scripts\dev.ps1 logs

# Reset database
.\scripts\dev.ps1 db-reset

# Stop everything
.\scripts\dev.ps1 stop
```

## 🆘 Troubleshooting

### Services won't start?
```bash
# Check Docker is running
docker --version

# Check logs
docker-compose logs

# Restart services
docker-compose restart
```

### Can't access the app?
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **MinIO**: http://localhost:9001 (admin/minioadmin)

### Database issues?
```bash
# Reset database
.\scripts\dev.ps1 db-reset

# Or manually:
docker-compose exec backend npx prisma db push
docker-compose exec backend npx prisma db seed
```

## 🎉 You're Ready!

Your premium chat app is now running with:
- ✅ Real-time messaging
- ✅ User authentication
- ✅ File sharing
- ✅ Modern UI/UX
- ✅ Production-ready architecture

**Happy chatting! 💬**
