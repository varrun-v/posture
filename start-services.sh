#!/bin/bash

# Posture Monitor - Quick Start Script

echo "=================================="
echo "Posture Monitor - Quick Start"
echo "=================================="
echo ""

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
    echo "❌ podman-compose not found. Please install it first."
    exit 1
fi

# Start containers
echo "🚀 Starting PostgreSQL and Redis containers..."
podman-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check status
echo ""
echo "📊 Container Status:"
podman-compose ps

echo ""
echo "=================================="
echo "✅ Services are running!"
echo "=================================="
echo ""
echo "PostgreSQL: localhost:5432"
echo "  User: posture_user"
echo "  Password: posture_pass"
echo "  Database: posture_db"
echo ""
echo "Redis: localhost:6379"
echo ""
echo "Next steps:"
echo "1. cd backend"
echo "2. source venv/bin/activate"
echo "3. python setup_db.py"
echo "4. uvicorn app.main:app --reload"
echo ""
