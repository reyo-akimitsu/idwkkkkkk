#!/bin/bash

# Premium Chat App Setup Script
echo "🚀 Setting up Premium Chat App..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please review and update the configuration."
fi

# Generate secure JWT secrets
echo "🔐 Generating secure JWT secrets..."
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Update .env file with generated secrets
sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" .env
sed -i.bak "s/your-super-secret-refresh-key-change-this-in-production/$JWT_REFRESH_SECRET/g" .env
rm .env.bak

echo "✅ JWT secrets generated and updated in .env file"

# Start the application
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🎉 Setup complete! Your chat app is ready:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo "   MinIO:    http://localhost:9001"
    echo ""
    echo "📝 Sample accounts:"
    echo "   Email: alice@example.com | Password: password123"
    echo "   Email: bob@example.com   | Password: password123"
    echo ""
    echo "🔧 To stop the application: docker-compose down"
    echo "📊 To view logs: docker-compose logs -f"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
