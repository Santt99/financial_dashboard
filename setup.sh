#!/bin/bash

# Financial Dashboard - Quick Setup Script

echo "🚀 Setting up Financial Dashboard..."

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend

if [ ! -d "backend-venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend-venv
fi

echo "Activating virtual environment..."
source backend-venv/bin/activate

echo "Installing Python packages..."
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your GEMINI_API_KEY"
    echo "   Get your key from: https://aistudio.google.com/app/apikey"
fi

cd ..

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo "node_modules already exists, skipping npm install"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  source backend-venv/bin/activate"
echo "  uvicorn app.main:app --reload --port 8000"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "🌟 Don't forget to configure your GEMINI_API_KEY in backend/.env for AI-powered statement processing!"
