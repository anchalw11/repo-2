#!/bin/bash

# EMERGENCY 405 FIX - Run this on your production server
echo "=== EMERGENCY 405 FIX ==="

# Check if we're on the production server
if [ ! -d "/var/www/trading-journal" ]; then
    echo "ERROR: This must be run on the production server"
    exit 1
fi

# 1. Backup current Caddyfile
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup.$(date +%s)

# 2. Create new working Caddyfile
sudo tee /etc/caddy/Caddyfile > /dev/null << 'EOF'
traderedgepro.com {
    handle /api/* {
        reverse_proxy localhost:5000
    }
    
    handle {
        root * /var/www/trading-journal/dist
        try_files {path} /index.html
        file_server
    }
    
    encode gzip
}
EOF

# 3. Validate and reload
sudo caddy validate --config /etc/caddy/Caddyfile
if [ $? -ne 0 ]; then
    echo "Caddy config invalid - restoring backup"
    sudo cp /etc/caddy/Caddyfile.backup.* /etc/caddy/Caddyfile
    exit 1
fi

sudo systemctl reload caddy

# 4. Ensure Flask is running on port 5000
cd /var/www/trading-journal
sudo pkill -f "gunicorn.*5000" || true

# Start Flask backend
sudo -u www-data nohup gunicorn --bind 127.0.0.1:5000 --workers 2 wsgi_production_fixed:app > /var/log/gunicorn.log 2>&1 &

sleep 5

# 5. Test the fix
echo "Testing API endpoint..."
curl -s -X POST https://traderedgepro.com/api/auth/register -H "Content-Type: application/json" -d '{"test":"data"}' | head -5

echo "Fix applied. Check if 405 error is resolved."
