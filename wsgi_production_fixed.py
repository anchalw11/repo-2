#!/usr/bin/env python3
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
