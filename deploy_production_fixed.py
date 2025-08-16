#!/usr/bin/env python3
"""
Fixed Production deployment script for Flask application
Addresses page flickering and admin login issues
"""

import os
import subprocess
import sys
import shutil
from pathlib import Path

def setup_environment():
    """Setup production environment"""
    print("🔧 Setting up production environment...")
    
    # Load production environment
    if os.path.exists('.env.production'):
        print("✅ Found .env.production file")
        # Copy to .env for production use
        shutil.copy('.env.production', '.env')
        print("✅ Copied .env.production to .env")
    else:
        print("❌ .env.production file not found!")
        return False
    
    return True

def build_frontend():
    """Build the frontend for production"""
    print("🏗️  Building frontend...")
    try:
        # Install dependencies if needed
        if not os.path.exists('node_modules'):
            print("📦 Installing npm dependencies...")
            subprocess.run(['npm', 'install'], check=True)
        
        # Build the frontend
        subprocess.run(['npm', 'run', 'build'], check=True)
        print("✅ Frontend built successfully")
        
        # Verify dist folder exists
        if os.path.exists('dist'):
            print("✅ Dist folder created successfully")
            return True
        else:
            print("❌ Dist folder not found after build")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to build frontend: {e}")
        return False

def setup_database():
    """Setup production database"""
    print("🗄️  Setting up production database...")
    try:
        # Create instance directory if it doesn't exist
        os.makedirs('instance', exist_ok=True)
        
        # Run database creation script
        if os.path.exists('create_db.py'):
            subprocess.run([sys.executable, 'create_db.py'], check=True)
            print("✅ Database setup completed")
        else:
            print("⚠️  create_db.py not found, skipping database setup")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to setup database: {e}")
        return False

def install_production_dependencies():
    """Install production dependencies"""
    print("📦 Installing production dependencies...")
    try:
        # Install gunicorn for production server
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'gunicorn'], check=True)
        print("✅ Installed Gunicorn")
        
        # Install other production dependencies
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'python-dotenv'], check=True)
        print("✅ Installed python-dotenv")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def create_production_runner():
    """Create production runner script"""
    runner_content = '''#!/usr/bin/env python3
"""
Production runner for Trading Journal Flask App
"""
import os
import sys
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env')

# Set Flask environment
os.environ['FLASK_ENV'] = 'production'

# Import and run the application
from journal import create_production_app

app = create_production_app()

if __name__ == "__main__":
    # For development testing
    app.run(host='0.0.0.0', port=5000, debug=False)
'''
    
    with open('run_production.py', 'w') as f:
        f.write(runner_content)
    
    # Make it executable
    os.chmod('run_production.py', 0o755)
    print("✅ Created run_production.py")

def create_wsgi_file():
    """Create WSGI file for production deployment"""
    wsgi_content = '''#!/usr/bin/env python3
"""
WSGI file for Trading Journal Flask App
"""
import os
import sys
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env')

# Set Flask environment
os.environ['FLASK_ENV'] = 'production'

# Import the application
from journal import create_production_app

application = create_production_app()

if __name__ == "__main__":
    application.run()
'''
    
    with open('wsgi.py', 'w') as f:
        f.write(wsgi_content)
    
    print("✅ Created wsgi.py file")

def test_production_setup():
    """Test the production setup"""
    print("🧪 Testing production setup...")
    try:
        # Set environment to production
        os.environ['FLASK_ENV'] = 'production'
        
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv('.env')
        
        # Import and test the app
        from journal import create_production_app
        app = create_production_app()
        
        with app.test_client() as client:
            # Test the main route
            response = client.get('/')
            if response.status_code == 200:
                print("✅ Main route working")
            else:
                print(f"⚠️  Main route returned status: {response.status_code}")
            
            # Test API route
            response = client.get('/api/nonexistent')
            if response.status_code == 404:
                print("✅ API routing working")
            else:
                print(f"⚠️  API routing returned status: {response.status_code}")
        
        print("✅ Production setup test completed")
        return True
        
    except Exception as e:
        print(f"❌ Error testing production setup: {e}")
        return False

def create_deployment_instructions():
    """Create deployment instructions"""
    instructions = '''# Production Deployment Instructions

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
'''
    
    with open('DEPLOYMENT_INSTRUCTIONS.md', 'w') as f:
        f.write(instructions)
    
    print("✅ Created DEPLOYMENT_INSTRUCTIONS.md")

def main():
    """Main deployment function"""
    print("🚀 Starting Production Deployment Fix...")
    print("=" * 60)
    
    success = True
    
    # Step 1: Setup environment
    if not setup_environment():
        success = False
    
    # Step 2: Install dependencies
    if success and not install_production_dependencies():
        success = False
    
    # Step 3: Build frontend
    if success and not build_frontend():
        success = False
    
    # Step 4: Setup database
    if success and not setup_database():
        success = False
    
    # Step 5: Create production files
    if success:
        create_production_runner()
        create_wsgi_file()
        create_deployment_instructions()
    
    # Step 6: Test setup
    if success and not test_production_setup():
        success = False
    
    print("\n" + "=" * 60)
    
    if success:
        print("🎉 Production deployment setup completed successfully!")
        print("\n📋 Next Steps:")
        print("1. Update secret keys in .env.production")
        print("2. Test locally: python3 run_production.py")
        print("3. Deploy to server using DEPLOYMENT_INSTRUCTIONS.md")
        print("4. Admin MPIN: 180623")
        print("\n🔧 Quick Test Command:")
        print("   python3 run_production.py")
    else:
        print("❌ Production deployment setup failed!")
        print("Please check the errors above and try again.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
