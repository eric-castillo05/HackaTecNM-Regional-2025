#!/bin/bash

# 🚀 STEPVOICE AI Development Script
# Starts all required services for development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    print_color $BLUE "🚀 ========================================"
    print_color $BLUE "   STEPVOICE AI - Development Setup"
    print_color $BLUE "========================================"
    echo
}

check_dependencies() {
    print_color $CYAN "🔍 Checking dependencies..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_color $RED "❌ Python 3 is required but not installed."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_color $RED "❌ Node.js is required but not installed."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_color $RED "❌ npm is required but not installed."
        exit 1
    fi
    
    print_color $GREEN "✅ All dependencies found"
}

install_dependencies() {
    print_color $CYAN "📦 Installing dependencies..."
    
    # Install Python dependencies for AI service
    if [ -f "$PROJECT_ROOT/services/ai-service/requirements.txt" ]; then
        print_color $YELLOW "Installing Python AI service dependencies..."
        cd "$PROJECT_ROOT/services/ai-service"
        python3 -m pip install -r requirements.txt
    fi
    
    # Install Node.js dependencies for mobile app
    if [ -f "$PROJECT_ROOT/apps/mobile/package.json" ]; then
        print_color $YELLOW "Installing React Native dependencies..."
        cd "$PROJECT_ROOT/apps/mobile"
        npm install
    fi
    
    # Install Node.js dependencies for Node API (if exists)
    if [ -f "$PROJECT_ROOT/services/node-api/package.json" ]; then
        print_color $YELLOW "Installing Node API dependencies..."
        cd "$PROJECT_ROOT/services/node-api"
        npm install
    fi
    
    print_color $GREEN "✅ Dependencies installed"
}

start_ai_service() {
    print_color $CYAN "🤖 Starting AI Service..."
    
    cd "$PROJECT_ROOT/services/ai-service"
    
    # Kill any existing process on port 8052
    lsof -ti:8052 | xargs kill -9 2>/dev/null || true
    
    # Start AI service in background
    python3 ai_service.py &
    AI_SERVICE_PID=$!
    
    print_color $GREEN "✅ AI Service started (PID: $AI_SERVICE_PID)"
    print_color $YELLOW "   Service URL: http://127.0.0.1:8052"
    
    # Wait a moment for service to start
    sleep 3
    
    # Test if service is running
    if curl -s "http://127.0.0.1:8052/ai/health" > /dev/null; then
        print_color $GREEN "✅ AI Service is healthy"
    else
        print_color $RED "❌ AI Service health check failed"
    fi
}

start_mobile_app() {
    print_color $CYAN "📱 Starting React Native App..."
    
    cd "$PROJECT_ROOT/apps/mobile"
    
    print_color $YELLOW "Starting Expo development server..."
    print_color $YELLOW "You can now:"
    print_color $YELLOW "  - Press 'a' to open Android"
    print_color $YELLOW "  - Press 'i' to open iOS simulator"
    print_color $YELLOW "  - Press 'w' to open web"
    print_color $YELLOW "  - Scan QR code with Expo Go app"
    echo
    
    # Start Expo (this will run in foreground)
    npx expo start
}

cleanup() {
    print_color $YELLOW "🛑 Shutting down services..."
    
    # Kill AI service if it's running
    if [ ! -z "$AI_SERVICE_PID" ]; then
        kill $AI_SERVICE_PID 2>/dev/null || true
    fi
    
    # Kill any process on port 8052
    lsof -ti:8052 | xargs kill -9 2>/dev/null || true
    
    print_color $GREEN "✅ Cleanup completed"
}

# Set up cleanup trap
trap cleanup EXIT

# Main execution
main() {
    print_header
    check_dependencies
    
    # Check if --install flag is provided
    if [[ "$1" == "--install" || "$1" == "-i" ]]; then
        install_dependencies
    fi
    
    start_ai_service
    
    print_color $GREEN "🎉 All services are starting up!"
    print_color $BLUE "Press Ctrl+C to stop all services"
    echo
    
    # Start mobile app (this will block until user exits)
    start_mobile_app
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo
    print_color $BLUE "STEPVOICE AI Development Script"
    echo
    print_color $YELLOW "Usage:"
    print_color $CYAN "  ./dev.sh              # Start all services"
    print_color $CYAN "  ./dev.sh --install    # Install dependencies and start services"
    print_color $CYAN "  ./dev.sh --help       # Show this help"
    echo
    print_color $YELLOW "Services started:"
    print_color $CYAN "  - AI Service (Python Flask) on port 8052"
    print_color $CYAN "  - React Native App (Expo) on port 19000+"
    echo
    exit 0
fi

# Run main function
main "$@"
