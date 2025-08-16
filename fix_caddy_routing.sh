#!/bin/bash

# Fix Caddy routing to properly handle Flask API endpoints
echo "Fixing Caddy routing configuration..."

# Backup current Caddyfile
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup

# Copy the fixed Caddyfile
sudo cp Caddyfile-fixed /etc/caddy/Caddyfile

# Test Caddy configuration
echo "Testing Caddy configuration..."
sudo caddy validate --config /etc/caddy/Caddyfile

if [ $? -eq 0 ]; then
    echo "Caddy configuration is valid. Reloading..."
    sudo systemctl reload caddy
    
    # Check if Flask is running
    if ! pgrep -f "gunicorn.*wsgi_production_fixed" > /dev/null; then
        echo "Starting Flask application..."
        sudo ./start_production_fixed.sh
    fi
    
    echo "Caddy routing fixed successfully!"
    echo "Testing API endpoint..."
    sleep 3
    curl -X POST https://traderedgepro.com/api/auth/test -H "Content-Type: application/json" || echo "API test failed"
else
    echo "Caddy configuration error. Restoring backup..."
    sudo cp /etc/caddy/Caddyfile.backup /etc/caddy/Caddyfile
    exit 1
fi
