#!/bin/bash

echo "🤖 Starting STEPVOICE AI Service..."
echo "================================================"

# Get current directory
CURRENT_DIR=$(pwd)
AI_SERVICE_DIR="../../services/ai-service"

# Check if we're in the right place
if [ ! -d "$AI_SERVICE_DIR" ]; then
    echo "❌ Error: AI service directory not found at $AI_SERVICE_DIR"
    echo "   Make sure you're running this script from apps/mobile directory"
    exit 1
fi

# Check if service is already running
if lsof -ti:8052 > /dev/null; then
    echo "⚠️  Service already running on port 8052"
    echo "   Stopping existing service..."
    pkill -f "python3.*ai_service.py" 2>/dev/null || true
    sleep 2
fi

# Start the AI service
echo "🚀 Starting AI service on port 8052..."
cd "$AI_SERVICE_DIR"

# Check Python dependencies
python3 -c "import flask, flask_cors" 2>/dev/null || {
    echo "❌ Missing Python dependencies. Installing..."
    python3 -m pip install flask flask-cors
}

# Start service in background
nohup python3 ai_service.py > ai_service.log 2>&1 &
AI_PID=$!

# Wait for service to start
sleep 3

# Test connection
echo "🔍 Testing AI service connection..."
if curl -s http://192.168.0.39:8052/ai/health > /dev/null; then
    echo "✅ AI Service started successfully!"
    echo "📡 Service URL: http://192.168.0.39:8052"
    echo "📋 Process ID: $AI_PID"
    echo "📄 Logs: $AI_SERVICE_DIR/ai_service.log"
    echo ""
    echo "🎯 Your React Native app should now connect successfully!"
else
    echo "❌ Failed to start AI service"
    exit 1
fi

# Return to original directory  
cd "$CURRENT_DIR"
echo "================================================"
