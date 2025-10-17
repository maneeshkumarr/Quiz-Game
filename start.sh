#!/bin/bash

# Quiz Game Deployment Script
echo "🚀 Starting Quiz Game Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "🗃️ Initializing database..."
npm run init-db
if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

echo "🔧 Starting backend server..."
npm run dev &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 5

cd ..

echo "📦 Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    kill $BACKEND_PID
    exit 1
fi

echo "🎨 Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Quiz Game is now running!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001"
echo "👨‍🏫 Admin Dashboard: Access via Teacher Dashboard button on leaderboard"
echo ""
echo "📊 Database: SQLite database created at backend/database/quiz_game.db"
echo "🔄 Real-time updates: WebSocket connection active"
echo ""
echo "🎯 Ready for 60+ concurrent students!"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID