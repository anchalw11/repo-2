#!/bin/bash

echo "=== FIXING PRODUCTION BACKEND ==="

# 1. Check current status
echo "1. Checking current Flask backend status..."
if pgrep -f "gunicorn.*wsgi" > /dev/null; then
    echo "✓ Flask backend is running"
    ps aux | grep -E "(gunicorn|flask|python.*wsgi)" | grep -v grep
else
    echo "✗ Flask backend is NOT running"
fi

echo -e "\n2. Checking Caddy status..."
sudo systemctl status caddy --no-pager | head -10

echo -e "\n3. Testing current API endpoint..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://traderedgepro.com/api/auth/test

echo -e "\n4. Stopping any existing Flask processes..."
sudo pkill -f gunicorn || true
sudo pkill -f wsgi || true
sleep 2

echo -e "\n5. Starting Flask backend..."
cd /var/www/trading-journal

# Ensure the wsgi file exists
if [ ! -f "wsgi_production_fixed.py" ]; then
    echo "Creating wsgi_production_fixed.py..."
    cat > wsgi_production_fixed.py << 'EOF'
#!/usr/bin/env python3
"""
WSGI Production Configuration for Trading Journal
"""
import os
import sys
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env.production')

# Set production environment
os.environ['FLASK_ENV'] = 'production'
os.environ['FLASK_DEBUG'] = 'False'

# Import the Flask application
from journal import create_app

# Create the WSGI application
application = create_app('journal.config.ProductionConfig')

if __name__ == "__main__":
    application.run(host='0.0.0.0', port=5000, debug=False)
EOF
fi

# Start gunicorn with proper configuration
echo "Starting gunicorn..."
sudo -u www-data gunicorn \
    --bind 127.0.0.1:5000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile /var/log/gunicorn/access.log \
    --error-logfile /var/log/gunicorn/error.log \
    --daemon \
    wsgi_production_fixed:application

sleep 5

echo -e "\n6. Verifying Flask backend is running..."
if pgrep -f "gunicorn.*wsgi" > /dev/null; then
    echo "✓ Flask backend started successfully"
    ps aux | grep -E "(gunicorn|flask|python.*wsgi)" | grep -v grep
else
    echo "✗ Failed to start Flask backend"
    echo "Checking error logs..."
    sudo tail -20 /var/log/gunicorn/error.log
    exit 1
fi

echo -e "\n7. Testing API endpoints..."
echo "Testing auth test endpoint:"
curl -s -X GET https://traderedgepro.com/api/auth/test | head -100

echo -e "\nTesting auth register endpoint:"
curl -s -X POST https://traderedgepro.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"TestPassword123!","plan_type":"basic"}' \
    | head -100

echo -e "\n=== BACKEND FIX COMPLETE ==="
