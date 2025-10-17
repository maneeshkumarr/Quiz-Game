@echo off
echo 🚀 Starting Quiz Game Deployment...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 📦 Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo 🗃️ Initializing database...
call npm run init-db
if errorlevel 1 (
    echo ❌ Failed to initialize database
    pause
    exit /b 1
)

echo 🔧 Starting backend server...
start "Backend Server" cmd /k "npm run dev"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak

cd ..

echo 📦 Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo 🎨 Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Quiz Game is now running!
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:3001
echo 👨‍🏫 Admin Dashboard: Access via Teacher Dashboard button on leaderboard
echo.
echo 📊 Database: SQLite database created at backend/database/quiz_game.db
echo 🔄 Real-time updates: WebSocket connection active
echo.
echo 🎯 Ready for 60+ concurrent students!
echo.
echo Press any key to exit...
pause