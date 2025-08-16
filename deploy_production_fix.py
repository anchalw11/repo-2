#!/usr/bin/env python3
"""
Quick Production Deployment Fix Script
Run this on your production server to start the Flask backend
"""
import os
import sys
import subprocess
import signal
from pathlib import Path

def signal_handler(sig, frame):
    print('\n🛑 Stopping production server...')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def main():
    print("🚀 Trading Journal Production Deployment Fix")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path('journal').exists():
        print("❌ Error: journal directory not found!")
        print("Please run this script from the project root directory.")
        sys.exit(1)
    
    # Install dependencies
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'journal/requirements.txt'], 
                      check=True, capture_output=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        print("Please install manually: pip install -r journal/requirements.txt")
    
    # Create database
    print("🗄️  Setting up database...")
    try:
        subprocess.run([sys.executable, 'create_db.py'], check=True, capture_output=True)
        print("✅ Database created successfully")
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Database setup warning: {e}")
        print("Database might already exist, continuing...")
    
    # Build frontend
    print("🏗️  Building frontend...")
    try:
        subprocess.run(['npm', 'run', 'build'], check=True, capture_output=True)
        print("✅ Frontend built successfully")
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Frontend build warning: {e}")
        print("Make sure Node.js and npm are installed")
    
    # Set environment variables
    os.environ['FLASK_ENV'] = 'production'
    os.environ['FLASK_DEBUG'] = 'False'
    
    print("\n🌟 Starting Production Server...")
    print("📊 Frontend: Serve the 'dist' folder with your web server")
    print("🔧 Backend API: Starting on port 5000")
    print("🔐 Admin MPIN: 180623")
    print("⚡ Press Ctrl+C to stop")
    print("=" * 50)
    
    # Import and run Flask app
    try:
        from journal import create_production_app
        app = create_production_app()
        
        # Run the Flask app
        app.run(host='0.0.0.0', port=5000, debug=False)
        
    except ImportError as e:
        print(f"❌ Failed to import Flask app: {e}")
        print("Make sure all dependencies are installed")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
