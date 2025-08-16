# PRODUCTION SERVER FIX - COPY AND PASTE THESE COMMANDS

SSH into your production server and run these commands in order:

## 1. Check Current Status
```bash
sudo systemctl status caddy
ps aux | grep gunicorn
sudo cat /etc/caddy/Caddyfile
```

## 2. Fix Caddyfile Configuration
```bash
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
```

## 3. Validate and Reload Caddy
```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 4. Start Flask Backend
```bash
cd /var/www/trading-journal
sudo pkill -f gunicorn || true
sudo -u www-data gunicorn --bind 127.0.0.1:5000 --workers 2 wsgi_production_fixed:app &
```

## 5. Test the Fix
```bash
sleep 3
curl -X POST https://traderedgepro.com/api/auth/register -H "Content-Type: application/json" -d '{"test":"data"}'
```

## Expected Result
After running these commands, you should see a JSON response instead of a 405 error.

The Amplify frontend will then work properly as it's configured to call your production backend.
