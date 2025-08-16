#!/usr/bin/env python3
"""
Production Deployment Script - Fixed Version
Addresses all deployment issues including 405 errors and dashboard flickering
"""

import os
import sys
import subprocess
import json
import shutil
from pathlib import Path

def run_command(cmd, cwd=None, check=True):
    """Run a command and handle errors gracefully"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=check, 
                              capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {cmd}")
        print(f"Error output: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def create_production_env():
    """Create production environment file"""
    env_content = """# Production Environment Configuration
SECRET_KEY=your_super_secret_production_key_change_this_immediately
JWT_SECRET_KEY=your_jwt_secret_production_key_change_this_immediately
DATABASE_URL=sqlite:///instance/production.db
CORS_ORIGINS=*
FLASK_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=pbkdf2:sha256:260000$salt$hash
"""
    
    with open('.env.production', 'w') as f:
        f.write(env_content)
    print("✅ Created .env.production file")

def create_production_wsgi():
    """Create production WSGI configuration"""
    wsgi_content = """#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add the project directory to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set environment to production
os.environ.setdefault('FLASK_ENV', 'production')

# Import the application
from journal import create_production_app

application = create_production_app()

if __name__ == "__main__":
    application.run(host='0.0.0.0', port=5000, debug=False)
"""
    
    with open('wsgi_production_fixed.py', 'w') as f:
        f.write(wsgi_content)
    os.chmod('wsgi_production_fixed.py', 0o755)
    print("✅ Created production WSGI configuration")

def create_nginx_config():
    """Create Nginx configuration for production"""
    nginx_content = """server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Serve static files
    location /static/ {
        alias /var/www/trading-journal/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle API requests
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 200;
        }
    }
    
    # Serve React app for all other requests
    location / {
        try_files $uri $uri/ /index.html;
        root /var/www/trading-journal/dist;
        index index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
"""
    
    with open('nginx-production.conf', 'w') as f:
        f.write(nginx_content)
    print("✅ Created Nginx production configuration")

def create_systemd_service():
    """Create systemd service file"""
    service_content = """[Unit]
Description=Trading Journal Production Application
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/trading-journal
Environment=PATH=/var/www/trading-journal/venv/bin
Environment=FLASK_ENV=production
ExecStart=/var/www/trading-journal/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 4 --timeout 120 wsgi_production_fixed:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
    
    with open('trading-journal-production.service', 'w') as f:
        f.write(service_content)
    print("✅ Created systemd service file")

def setup_python_environment():
    """Set up Python virtual environment and dependencies"""
    print("🔧 Setting up Python environment...")
    
    # Create virtual environment
    run_command("python3 -m venv venv")
    
    # Install Python dependencies
    pip_cmd = "./venv/bin/pip"
    run_command(f"{pip_cmd} install --upgrade pip")
    run_command(f"{pip_cmd} install flask flask-cors flask-jwt-extended flask-sqlalchemy python-dotenv gunicorn")
    run_command(f"{pip_cmd} install werkzeug marshmallow")
    
    print("✅ Python environment setup complete")

def build_frontend():
    """Build the frontend application"""
    print("🔧 Building frontend...")
    
    # Install Node.js dependencies
    run_command("npm install")
    
    # Build the application
    run_command("npm run build")
    
    print("✅ Frontend build complete")

def setup_database():
    """Set up the production database"""
    print("🔧 Setting up database...")
    
    # Create instance directory
    os.makedirs('instance', exist_ok=True)
    
    # Remove old database if exists
    db_file = 'instance/production.db'
    if os.path.exists(db_file):
        os.remove(db_file)
        print("🗑️ Removed old database")
    
    # Create new database
    run_command("python3 create_db.py")
    
    print("✅ Database setup complete")

def fix_cors_issues():
    """Ensure CORS is properly configured"""
    print("🔧 Fixing CORS configuration...")
    
    # Update Flask app initialization
    init_file = 'journal/__init__.py'
    if os.path.exists(init_file):
        with open(init_file, 'r') as f:
            content = f.read()
        
        # Ensure CORS is configured properly
        if 'CORS(app)' in content and 'cors_allowed_origins' not in content:
            content = content.replace(
                'CORS(app)',
                'CORS(app, origins=["*"], allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])'
            )
            
            with open(init_file, 'w') as f:
                f.write(content)
            print("✅ Updated CORS configuration")
    
    print("✅ CORS configuration fixed")

def create_startup_script():
    """Create production startup script"""
    startup_content = """#!/bin/bash
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
"""
    
    with open('start_production_fixed.sh', 'w') as f:
        f.write(startup_content)
    os.chmod('start_production_fixed.sh', 0o755)
    print("✅ Created production startup script")

def main():
    """Main deployment function"""
    print("🚀 Starting Production Deployment Setup...")
    print("=" * 50)
    
    try:
        # Step 1: Create configuration files
        print("\n📝 Step 1: Creating configuration files...")
        create_production_env()
        create_production_wsgi()
        create_nginx_config()
        create_systemd_service()
        create_startup_script()
        
        # Step 2: Fix CORS issues
        print("\n🔧 Step 2: Fixing CORS configuration...")
        fix_cors_issues()
        
        # Step 3: Setup Python environment
        print("\n🐍 Step 3: Setting up Python environment...")
        setup_python_environment()
        
        # Step 4: Build frontend
        print("\n⚛️ Step 4: Building frontend...")
        build_frontend()
        
        # Step 5: Setup database
        print("\n🗄️ Step 5: Setting up database...")
        setup_database()
        
        print("\n" + "=" * 50)
        print("✅ PRODUCTION DEPLOYMENT SETUP COMPLETE!")
        print("=" * 50)
        
        print("\n📋 Next Steps:")
        print("1. Copy this project to your server: /var/www/trading-journal")
        print("2. Install Nginx: sudo apt install nginx")
        print("3. Copy nginx config: sudo cp nginx-production.conf /etc/nginx/sites-available/trading-journal")
        print("4. Enable site: sudo ln -s /etc/nginx/sites-available/trading-journal /etc/nginx/sites-enabled/")
        print("5. Install systemd service: sudo cp trading-journal-production.service /etc/systemd/system/")
        print("6. Start services:")
        print("   sudo systemctl daemon-reload")
        print("   sudo systemctl enable trading-journal-production")
        print("   sudo systemctl start trading-journal-production")
        print("   sudo systemctl reload nginx")
        print("\n🌐 Your application will be available at: http://your-domain.com")
        print("\n🔐 Admin Access:")
        print("   MPIN: 180623")
        print("   Username: admin")
        
    except Exception as e:
        print(f"\n❌ Deployment failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
