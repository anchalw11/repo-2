#!/usr/bin/env python3
"""
Backend Production Deployment Script for Trading Journal Application
"""

import os
import subprocess
import sys
import shutil
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"🚀 {title}")
    print("=" * 60)

def print_step(step, description):
    """Print a formatted step"""
    print(f"\n📋 Step {step}: {description}")
    print("-" * 40)

def run_command(command, description, check=True):
    """Run a command with error handling"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print(f"✅ {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(f"Error details: {e.stderr}")
        return False

def setup_environment():
    """Setup production environment variables"""
    print_step(1, "Setting up backend environment")
    
    env_prod_path = Path('.env.production')
    if not env_prod_path.exists():
        env_content = """# Production Environment Variables
SECRET_KEY=your_super_secret_production_key_change_this
JWT_SECRET_KEY=your_jwt_secret_production_key_change_this
DATABASE_URL=sqlite:///instance/production.db
CORS_ORIGINS=*
FLASK_ENV=production
"""
        with open(env_prod_path, 'w') as f:
            f.write(env_content)
        print("✅ Created .env.production file")
    else:
        print("✅ .env.production already exists")
    
    shutil.copy('.env.production', '.env')
    print("✅ Copied .env.production to .env")
    
    return True

def install_dependencies():
    """Install Python dependencies"""
    print_step(2, "Installing backend dependencies")
    
    requirements_path = Path('journal/requirements.txt')
    if requirements_path.exists():
        if not run_command(f"python3 -m pip install -r {requirements_path}", "Installing dependencies from requirements.txt"):
            return False
    else:
        print("❌ journal/requirements.txt not found.")
        return False
        
    if not run_command("python3 -m pip install gunicorn", "Installing gunicorn"):
        return False
    
    print("✅ All backend dependencies installed")
    return True

def setup_database():
    """Setup production database"""
    print_step(3, "Setting up production database")
    
    instance_dir = Path('instance')
    instance_dir.mkdir(exist_ok=True)
    print("✅ Instance directory created")
    
    if Path('create_db.py').exists():
        if not run_command("python3 create_db.py", "Creating database tables"):
            print("⚠️  Database creation script failed.")
            return False
    else:
        print("⚠️  create_db.py not found, skipping database setup")
    
    return True

def create_wsgi_file():
    """Create WSGI file for Gunicorn"""
    print_step(4, "Creating WSGI file")
    
    wsgi_content = '''#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

load_dotenv('.env')
os.environ['FLASK_ENV'] = 'production'

from journal import create_production_app

application = create_production_app()
'''
    
    with open('wsgi.py', 'w') as f:
        f.write(wsgi_content)
    print("✅ Created wsgi.py")
    
    return True

def main():
    """Main deployment function"""
    print_header("Backend Production Deployment")
    
    success = True
    
    steps = [
        setup_environment,
        install_dependencies,
        setup_database,
        create_wsgi_file
    ]
    
    for step in steps:
        if not step():
            success = False
            print(f"❌ Step failed: {step.__name__}")
            break
    
    print_header("Deployment Summary")
    
    if success:
        print("🎉 Backend deployment setup completed successfully!")
        print("\n🚀 To run the backend in production, use:")
        print("   gunicorn --bind 0.0.0.0:5000 wsgi:application")
        
    else:
        print("❌ Backend deployment failed!")
        print("Please check the errors above and try again.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
