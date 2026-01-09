@echo off
REM SkillGap AI Deployment Script for Windows

echo 🚀 Starting SkillGap AI Deployment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version check passed: 
node --version

REM Install root dependencies
echo 📦 Installing root dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Build frontend
echo 🔨 Building frontend for production...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)
echo ✅ Frontend built successfully

REM Go back to root
cd ..

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Build backend
echo 🔨 Building backend for production...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Backend build failed
    pause
    exit /b 1
)
echo ✅ Backend built successfully

REM Go back to root
cd ..

REM Copy frontend build to backend public folder
echo 📁 Copying frontend build to backend...
if not exist "backend\public" mkdir backend\public
xcopy /E /I /Y frontend\dist\* backend\public\
echo ✅ Frontend copied to backend public folder

REM Check for environment variables
echo 🔧 Checking environment configuration...
if not exist "backend\.env" (
    echo ⚠️ No .env file found in backend directory
    echo 📝 Creating sample .env file...
    (
        echo PORT=4000
        echo NODE_ENV=production
        echo GROQ_API_KEY=your_groq_api_key_here
        echo ADZUNA_APP_ID=your_adzuna_app_id
        echo ADZUNA_API_KEY=your_adzuna_api_key
        echo JSEARCH_API_KEY=your_jsearch_api_key
    ) > backend\.env
    echo ⚠️ Please update backend\.env with your actual API keys
)

echo.
echo 🎉 Deployment preparation completed!
echo.
echo To start the application:
echo   cd backend ^&^& npm start
echo.
echo The application will be available at:
echo   http://localhost:4000
echo.
echo Health check endpoint:
echo   http://localhost:4000/health
echo.
pause