#!/usr/bin/env python3
"""
WSGI Production Configuration for Trading Journal
This file serves both the Flask API and static frontend files
"""
import os
import sys
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env.production')

# Set production environment
os.environ['FLASK_ENV'] = 'production'
os.environ['FLASK_DEBUG'] = 'False'

# Import the Flask application
from journal import create_production_app

# Create the WSGI application
application = create_production_app()

if __name__ == "__main__":
    # For development testing of production config
    print("🚀 Starting Trading Journal Production Server...")
    print("📊 Application will be available at: http://localhost:8000")
    print("🔐 Admin MPIN: 180623")
    print("⚡ Press Ctrl+C to stop the server")
    application.run(host='0.0.0.0', port=8000, debug=False)
