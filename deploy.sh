#!/bin/bash

# SkillGap AI Deployment Script
echo "🚀 Starting SkillGap AI Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Build frontend
print_status "Building frontend for production..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi
print_success "Frontend built successfully"

# Go back to root
cd ..

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Build backend
print_status "Building backend for production..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Backend build failed"
    exit 1
fi
print_success "Backend built successfully"

# Go back to root
cd ..

# Copy frontend build to backend public folder
print_status "Copying frontend build to backend..."
mkdir -p backend/public
cp -r frontend/dist/* backend/public/
print_success "Frontend copied to backend public folder"

# Check for environment variables
print_status "Checking environment configuration..."
if [ ! -f "backend/.env" ]; then
    print_warning "No .env file found in backend directory"
    print_status "Creating sample .env file..."
    cat > backend/.env << EOF
PORT=4000
NODE_ENV=production
GROQ_API_KEY=your_groq_api_key_here
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
JSEARCH_API_KEY=your_jsearch_api_key
EOF
    print_warning "Please update backend/.env with your actual API keys"
fi

print_success "🎉 Deployment preparation completed!"
print_status "To start the application:"
print_status "  cd backend && npm start"
print_status ""
print_status "The application will be available at:"
print_status "  http://localhost:4000"
print_status ""
print_status "Health check endpoint:"
print_status "  http://localhost:4000/health"