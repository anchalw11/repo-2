#!/bin/bash

echo "=== AWS BACKEND DEPLOYMENT FIX ==="

# Get current directory (should be the project root)
PROJECT_DIR=$(pwd)
echo "Project directory: $PROJECT_DIR"

# 1. Install required Python packages if not already installed
echo "1. Installing Python dependencies..."
pip3 install --user flask flask-cors flask-jwt-extended python-dotenv gunicorn

# 2. Stop any existing Flask/gunicorn processes
echo "2. Stopping existing processes..."
pkill -f gunicorn || true
pkill -f flask || true
sleep 2

# 3. Set up environment variables
echo "3. Setting up environment..."
export FLASK_ENV=production
export FLASK_DEBUG=False

# 4. Start the Flask backend using gunicorn
echo "4. Starting Flask backend..."
gunicorn \
    --bind 127.0.0.1:5000 \
    --workers 3 \
    --timeout 120 \
    --daemon \
    --access-logfile /tmp/gunicorn_access.log \
    --error-logfile /tmp/gunicorn_error.log \
    wsgi_aws:application

sleep 3

# 5. Check if the process is running
echo "5. Checking if backend is running..."
if pgrep -f "gunicorn.*wsgi_aws" > /dev/null; then
    echo "✓ Flask backend started successfully"
    ps aux | grep -E "(gunicorn|wsgi_aws)" | grep -v grep
else
    echo "✗ Failed to start Flask backend"
    echo "Checking error logs..."
    tail -10 /tmp/gunicorn_error.log
    exit 1
fi

# 6. Test the API endpoint
echo "6. Testing API endpoint..."
sleep 2
curl -s -X GET http://localhost:5000/api/auth/test || echo "Local test failed"

echo "7. Testing external endpoint..."
curl -s -X POST https://traderedgepro.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"TestPassword123!","plan_type":"basic"}' \
    | head -100

echo -e "\n=== DEPLOYMENT COMPLETE ==="
echo "Backend should now be running on port 5000"
echo "Check logs: tail -f /tmp/gunicorn_error.log"
