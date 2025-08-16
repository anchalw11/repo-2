# Production Deployment Instructions

## Quick Start

1. **Run the deployment script:**
   ```bash
   python3 deploy_production_fixed.py
   ```

2. **Start the production server:**
   ```bash
   # Option 1: Using the production runner (for testing)
   python3 run_production.py
   
   # Option 2: Using Gunicorn (recommended for production)
   gunicorn --bind 0.0.0.0:5000 --workers 4 wsgi:application
   ```

## Server Deployment

### Using Gunicorn + Nginx

1. **Install Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Create Nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/trading-journal
   ```
   
   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/trading-journal /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Start Gunicorn:**
   ```bash
   gunicorn --bind 127.0.0.1:5000 --workers 4 --daemon wsgi:application
   ```

### Using systemd service

1. **Create service file:**
   ```bash
   sudo nano /etc/systemd/system/trading-journal.service
   ```
   
   Add:
   ```ini
   [Unit]
   Description=Trading Journal Flask App
   After=network.target
   
   [Service]
   Type=exec
   User=www-data
   Group=www-data
   WorkingDirectory=/path/to/your/app
   Environment=PATH=/path/to/your/app/venv/bin
   EnvironmentFile=/path/to/your/app/.env
   ExecStart=/path/to/your/app/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 4 wsgi:application
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```

2. **Enable and start service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable trading-journal
   sudo systemctl start trading-journal
   ```

## Troubleshooting

### Page Flickering Issues
- Ensure the `dist` folder is properly built and accessible
- Check that static files are being served correctly
- Verify React Router is handling client-side routing

### Admin Login Issues
- The admin MPIN is: **180623**
- Admin login works offline (no backend validation required)
- Clear browser localStorage if experiencing issues

### API Issues
- Check that Flask app is running on the correct port
- Verify CORS settings in production config
- Ensure all API routes are properly registered

## Environment Variables

Update `.env.production` with your actual values:
- `SECRET_KEY`: Change to a secure random string
- `JWT_SECRET_KEY`: Change to a secure random string
- `DATABASE_URL`: Update if using external database
- `CORS_ORIGINS`: Set to your actual domain

## Security Notes

1. Change all default secret keys in `.env.production`
2. Use HTTPS in production
3. Consider changing the admin MPIN
4. Regularly update dependencies
5. Monitor server logs for security issues
