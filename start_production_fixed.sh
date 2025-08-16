#!/bin/bash
set -e

echo "🚀 Starting Trading Journal Production Deployment..."

# Change to project directory
cd /var/www/trading-journal

# Activate virtual environment
source venv/bin/activate

# Set production environment
export FLASK_ENV=production

# Start the application with Gunicorn
exec gunicorn --bind 127.0.0.1:5000 --workers 4 --timeout 120 --access-logfile - --error-logfile - wsgi_production_fixed:application
