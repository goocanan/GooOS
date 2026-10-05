#!/bin/bash
# Setup script untuk development environment

echo "🚀 GooOS Development Setup"
echo ""

# 1. Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install Docker Desktop for Windows."
    exit 1
fi

echo "✓ Docker found"

# 2. Start PostgreSQL
echo "📦 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for DB ready
echo "⏳ Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
        echo "✓ PostgreSQL ready"
        break
    fi
    sleep 1
done

# 3. Run migrations
echo "🔄 Running database migrations..."
cd packages/db
pnpm db:push
cd ../..

echo ""
echo "✅ Setup complete!"
echo "   Database: postgresql://postgres:postgres@localhost:5432/gooos"
echo "   Dev server: pnpm dev (from apps/studio)"
echo ""
echo "To stop: docker-compose down"
