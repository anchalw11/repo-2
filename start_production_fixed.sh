#!/bin/bash

# Production startup script for Trading Journal
echo "Starting Trading Journal Production Server..."

# Set environment
export FLASK_ENV=production
export PYTHONPATH="/var/www/trading-journal:$PYTHONPATH"

# Change to application directory
cd /var/www/trading-journal

# Kill any existing processes
pkill -f "gunicorn.*wsgi_production_fixed"
sleep 2

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "Virtual environment activated"
fi

# Install/update dependencies
pip install -r requirements.txt

# Create database if it doesn't exist
python create_db.py

# Test Flask app startup
echo "Testing Flask app..."
python -c "from journal import create_production_app; app = create_production_app(); print('Flask app created successfully')"

# Start Gunicorn with verbose logging
echo "Starting Gunicorn server..."
gunicorn --bind 0.0.0.0:5000 --workers 1 --timeout 120 --keep-alive 5 --max-requests 1000 --max-requests-jitter 100 --preload --log-level debug --access-logfile /var/log/trading-journal/access.log --error-logfile /var/log/trading-journal/error.log wsgi_production_fixed:application &

# Wait a moment and check if it started
sleep 3
if pgrep -f "gunicorn.*wsgi_production_fixed" > /dev/null; then
    echo "Production server started successfully!"
    echo "Testing auth endpoint..."
    curl -X GET http://localhost:5000/api/auth/test || echo "Auth test failed"
else
    echo "Failed to start production server!"
    exit 1
fi
