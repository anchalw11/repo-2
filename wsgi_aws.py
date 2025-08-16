#!/usr/bin/env python3
"""
WSGI Configuration for AWS Amazon Linux 2023 Deployment
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
from journal import create_app

# Create the WSGI application
application = create_app('journal.config.ProductionConfig')

if __name__ == "__main__":
    print("🚀 Starting Trading Journal Backend...")
    application.run(host='0.0.0.0', port=5000, debug=False)
