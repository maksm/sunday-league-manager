#!/bin/bash

# Sunday League Manager - Quick Deployment Script
# This script helps you deploy the application quickly

set -e

echo "🏃 Sunday League Manager - Deployment Script"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Run: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found. Creating from example..."
    cp .env.production.example .env.production

    # Generate NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)

    # Update .env.production with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|NEXTAUTH_SECRET=\".*\"|NEXTAUTH_SECRET=\"$SECRET\"|g" .env.production
    else
        sed -i "s|NEXTAUTH_SECRET=\".*\"|NEXTAUTH_SECRET=\"$SECRET\"|g" .env.production
    fi

    echo "✅ Created .env.production with generated NEXTAUTH_SECRET"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.production and update:"
    echo "   - NEXTAUTH_URL (your domain or IP)"
    echo "   - DATABASE_URL (if using PostgreSQL)"
    echo ""
    read -p "Press Enter to continue after updating .env.production..."
fi

# Load environment variables
set -a
source .env.production
set +a

echo "📦 Building Docker image..."
docker compose build

echo ""
echo "🚀 Starting containers..."
docker compose up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 5

echo ""
echo "🗄️  Running database migrations..."
docker compose exec app npx prisma migrate deploy

echo ""
echo "👤 Creating admin user..."
echo "   You'll be prompted to enter admin credentials"
docker compose exec -it app npx tsx scripts/setup-admin.ts

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Application Status:"
docker compose ps

echo ""
echo "🌐 Your application should be running at:"
echo "   http://localhost:3000"
if [ ! -z "$NEXTAUTH_URL" ]; then
    echo "   or $NEXTAUTH_URL"
fi

echo ""
echo "📝 Useful commands:"
echo "   View logs:        docker compose logs -f"
echo "   Stop app:         docker compose down"
echo "   Restart app:      docker compose restart"
echo "   Update app:       git pull && ./deploy.sh"
echo ""
