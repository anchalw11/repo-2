#!/bin/bash

# Direct production server fix for 405 error
echo "=== PRODUCTION SERVER 405 FIX ==="

# Check current server status
echo "1. Checking current server configuration..."
echo "Current Caddyfile:"
sudo cat /etc/caddy/Caddyfile

echo -e "\n2. Checking if Flask is running..."
ps aux | grep -E "(gunicorn|flask|python.*wsgi)" | grep -v grep

echo -e "\n3. Checking Caddy status..."
sudo systemctl status caddy --no-pager

echo -e "\n4. Testing current API endpoint..."
curl -v -X POST https://traderedgepro.com/api/auth/test -H "Content-Type: application/json" -d '{"test": "data"}' 2>&1 | head -20

echo -e "\n5. Applying Caddy fix..."
sudo tee /etc/caddy/Caddyfile > /dev/null << 'EOF'
traderedgepro.com {
    # Handle API requests - proxy to Flask backend
    handle /api/* {
        reverse_proxy localhost:5000
    }
    
    # Handle debug routes - proxy to Flask backend  
    handle /debug/* {
        reverse_proxy localhost:5000
    }
    
    # Serve static files for everything else
    handle {
        root * /var/www/trading-journal/dist
        try_files {path} /index.html
        file_server
    }
    
    # Security headers
    header {
        X-Frame-Options SAMEORIGIN
        X-Content-Type-Options nosniff
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "no-referrer-when-downgrade"
        Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network https://s3.tradingview.com; style-src 'self' 'unsafe-inline' 'unsafe-hashes' https://m.stripe.network; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://m.stripe.network; connect-src 'self' https://api.stripe.com https://m.stripe.network; img-src 'self' data: https:; font-src 'self' data: https:;"
    }
    
    # Enable compression
    encode gzip
    
    # Logging
    log {
        output file /var/log/caddy/access.log
        format json
    }
}
EOF

echo -e "\n6. Validating Caddy configuration..."
sudo caddy validate --config /etc/caddy/Caddyfile

if [ $? -eq 0 ]; then
    echo "✓ Caddy config valid"
    
    echo -e "\n7. Reloading Caddy..."
    sudo systemctl reload caddy
    
    echo -e "\n8. Checking if Flask backend is running..."
    if ! pgrep -f "gunicorn.*wsgi" > /dev/null; then
        echo "Starting Flask backend..."
        cd /var/www/trading-journal
        
        # Kill any existing processes
        sudo pkill -f gunicorn || true
        
        # Start Flask with proper config
        sudo -u www-data gunicorn --bind 127.0.0.1:5000 --workers 3 --timeout 120 --access-logfile /var/log/gunicorn/access.log --error-logfile /var/log/gunicorn/error.log wsgi_production_fixed:app &
        
        sleep 3
    fi
    
    echo -e "\n9. Testing fixed API endpoint..."
    sleep 2
    curl -v -X POST https://traderedgepro.com/api/auth/register -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"TestPassword123!"}' 2>&1 | head -30
    
    echo -e "\n=== FIX COMPLETE ==="
else
    echo "✗ Caddy config invalid - fix failed"
    exit 1
fi
