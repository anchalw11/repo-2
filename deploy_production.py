#!/usr/bin/env python3
"""
Production deployment script for Flask application
Fixes HTTP 405 Method Not Allowed errors
"""

import os
import subprocess
import sys
from pathlib import Path

def create_production_env():
    """Create production environment file"""
    env_content = """# Production Environment Variables
FLASK_ENV=production
SECRET_KEY=your_super_secret_production_key_change_this
JWT_SECRET_KEY=your_jwt_secret_production_key_change_this
DATABASE_URL=your_production_database_url
CORS_ORIGINS=*

# Database Configuration
SQLALCHEMY_DATABASE_URI=your_production_database_url
SQLALCHEMY_TRACK_MODIFICATIONS=False

# Security
WTF_CSRF_ENABLED=True
WTF_CSRF_TIME_LIMIT=None
"""
    
    with open('.env.production', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env.production file")
    print("⚠️  IMPORTANT: Update the secret keys and database URL in .env.production")

def create_wsgi_file():
    """Create WSGI file for production deployment"""
    wsgi_content = """#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Set environment variables
os.environ.setdefault('FLASK_ENV', 'production')

# Import the application
from journal import create_production_app

application = create_production_app()

if __name__ == "__main__":
    application.run()
"""
    
    with open('wsgi.py', 'w') as f:
        f.write(wsgi_content)
    
    print("✅ Created wsgi.py file")

def create_gunicorn_config():
    """Create Gunicorn configuration file"""
    gunicorn_content = """# Gunicorn configuration file
import multiprocessing

# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = 'trading_journal_app'

# Server mechanics
preload_app = True
daemon = False
pidfile = '/tmp/gunicorn.pid'
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
# keyfile = '/path/to/keyfile'
# certfile = '/path/to/certfile'
"""
    
    with open('gunicorn.conf.py', 'w') as f:
        f.write(gunicorn_content)
    
    print("✅ Created gunicorn.conf.py file")

def create_nginx_config():
    """Create Nginx configuration template"""
    nginx_content = """# Nginx configuration for Flask app
# Save this as /etc/nginx/sites-available/your-domain.com

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS (optional but recommended)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration (update paths)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static files
    location /static/ {
        alias /path/to/your/app/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers for preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Add CORS headers to all responses
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }
    
    # Frontend routes (React Router)
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle client-side routing
        try_files $uri $uri/ @fallback;
    }
    
    location @fallback {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""
    
    with open('nginx.conf.template', 'w') as f:
        f.write(nginx_content)
    
    print("✅ Created nginx.conf.template file")

def create_systemd_service():
    """Create systemd service file"""
    service_content = """[Unit]
Description=Trading Journal Flask App
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
RuntimeDirectory=trading-journal
WorkingDirectory=/path/to/your/app
Environment=PATH=/path/to/your/app/venv/bin
EnvironmentFile=/path/to/your/app/.env.production
ExecStart=/path/to/your/app/venv/bin/gunicorn --config gunicorn.conf.py wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
"""
    
    with open('trading-journal.service', 'w') as f:
        f.write(service_content)
    
    print("✅ Created trading-journal.service file")

def install_production_dependencies():
    """Install production dependencies"""
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'gunicorn'], check=True)
        print("✅ Installed Gunicorn")
    except subprocess.CalledProcessError:
        print("❌ Failed to install Gunicorn")

def build_frontend():
    """Build the frontend for production"""
    try:
        subprocess.run(['npm', 'run', 'build'], check=True)
        print("✅ Built frontend successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to build frontend")

def test_production_config():
    """Test the production configuration"""
    try:
        # Set environment to production
        os.environ['FLASK_ENV'] = 'production'
        
        # Import and test the app
        from journal import create_production_app
        app = create_production_app()
        
        with app.test_client() as client:
            # Test a simple route
            response = client.get('/')
            if response.status_code in [200, 404]:  # 404 is OK if no static files
                print("✅ Production app configuration is valid")
            else:
                print(f"⚠️  Production app returned status code: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Error testing production config: {e}")

def main():
    """Main deployment function"""
    print("🚀 Setting up production deployment...")
    print("=" * 50)
    
    # Create configuration files
    create_production_env()
    create_wsgi_file()
    create_gunicorn_config()
    create_nginx_config()
    create_systemd_service()
    
    # Install dependencies
    install_production_dependencies()
    
    # Build frontend
    build_frontend()
    
    # Test configuration
    test_production_config()
    
    print("\n" + "=" * 50)
    print("🎉 Production setup complete!")
    print("\nNext steps:")
    print("1. Update .env.production with your actual values")
    print("2. Update nginx.conf.template with your domain and paths")
    print("3. Update trading-journal.service with correct paths")
    print("4. Copy nginx config to /etc/nginx/sites-available/")
    print("5. Copy service file to /etc/systemd/system/")
    print("6. Enable and start the service:")
    print("   sudo systemctl enable trading-journal")
    print("   sudo systemctl start trading-journal")
    print("7. Enable nginx site:")
    print("   sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/")
    print("   sudo nginx -t && sudo systemctl reload nginx")
    
    print("\n🔧 To test locally with production config:")
    print("   export FLASK_ENV=production")
    print("   gunicorn --config gunicorn.conf.py wsgi:application")

if __name__ == "__main__":
    main()
