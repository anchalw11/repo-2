# Production Deployment Guide for Trading Journal

## Current Issue
The production server at `traderedgepro.com` is only serving static frontend files but doesn't have the Flask backend API running, causing 405 Method Not Allowed errors.

## Solution: Deploy Flask Backend

### Option 1: Single Server Deployment (Recommended)

1. **Upload all files to your server** including:
   - All Python files (`journal/`, `wsgi_production.py`, etc.)
   - Built frontend files (`dist/` folder)
   - Environment configuration (`.env.production`)

2. **Install Python dependencies on server**:
   ```bash
   pip install -r journal/requirements.txt
   ```

3. **Configure your web server (Apache/Nginx) to:**
   - Serve static files from `dist/` folder for the frontend
   - Proxy `/api/*` requests to the Flask backend
   - Run the Flask app using WSGI

### Option 2: Apache Configuration Example

Add this to your Apache virtual host:

```apache
<VirtualHost *:80>
    ServerName traderedgepro.com
    DocumentRoot /path/to/your/project/dist
    
    # Serve static frontend files
    <Directory "/path/to/your/project/dist">
        AllowOverride All
        Require all granted
    </Directory>
    
    # Proxy API requests to Flask backend
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:5000/api/
    ProxyPassReverse /api/ http://localhost:5000/api/
    
    # WSGI Configuration for Flask
    WSGIDaemonProcess tradingjournal python-path=/path/to/your/project
    WSGIProcessGroup tradingjournal
    WSGIScriptAlias /api /path/to/your/project/wsgi_production.py
</VirtualHost>
```

### Option 3: Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name traderedgepro.com;
    
    # Serve static frontend files
    location / {
        root /path/to/your/project/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to Flask backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 4: Quick Fix - Run Flask Backend

If you have SSH access to your server, you can quickly start the Flask backend:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Install dependencies
pip install -r journal/requirements.txt

# Create database
python3 create_db.py

# Start Flask backend
python3 wsgi_production.py
```

## Environment Variables

Make sure your `.env.production` file has the correct values:

```env
FLASK_ENV=production
SECRET_KEY=your_actual_secret_key_here
JWT_SECRET_KEY=your_actual_jwt_secret_here
DATABASE_URL=sqlite:///instance/production.db
CORS_ORIGINS=https://traderedgepro.com
```

## Testing

After deployment, test these endpoints:
- `https://traderedgepro.com/` - Should load the frontend
- `https://traderedgepro.com/api/auth/register` - Should accept POST requests
- `https://traderedgepro.com/admin` - Should load admin login

## Troubleshooting

1. **405 Method Not Allowed**: Flask backend is not running
2. **CORS errors**: Check CORS_ORIGINS in environment variables
3. **Database errors**: Run `python3 create_db.py` on the server
4. **Static files not loading**: Check web server configuration for serving `dist/` folder

## Security Notes

- Change default secret keys in production
- Use HTTPS in production
- Set proper CORS origins
- Use a production database (PostgreSQL recommended)
