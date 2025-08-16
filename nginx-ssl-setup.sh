#!/bin/bash

# SSL Setup Script for Trading Journal
echo "Setting up SSL certificates..."

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Replace with your actual domain
DOMAIN="your-domain.com"
EMAIL="your-email@domain.com"

# Generate SSL certificate
echo "Generating SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Update nginx configuration with SSL paths
echo "Updating nginx configuration..."
sudo sed -i 's|# ssl_certificate /path/to/your/certificate.crt;|ssl_certificate /etc/letsencrypt/live/'$DOMAIN'/fullchain.pem;|' /etc/nginx/sites-available/trading-journal
sudo sed -i 's|# ssl_certificate_key /path/to/your/private.key;|ssl_certificate_key /etc/letsencrypt/live/'$DOMAIN'/privkey.pem;|' /etc/nginx/sites-available/trading-journal

# Test nginx configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid. Reloading..."
    sudo systemctl reload nginx
    echo "SSL setup complete!"
else
    echo "Nginx configuration error. Please check the config file."
    exit 1
fi

# Set up auto-renewal
echo "Setting up SSL certificate auto-renewal..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

echo "SSL setup completed successfully!"
echo "Your site should now be accessible via HTTPS"
