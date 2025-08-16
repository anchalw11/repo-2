#!/usr/bin/env python3
"""
Simple backend starter for AWS deployment
"""
import os
import sys
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Set environment variables
os.environ['FLASK_ENV'] = 'production'
os.environ['FLASK_DEBUG'] = 'False'

try:
    # Try to load environment variables
    from dotenv import load_dotenv
    load_dotenv('.env.production')
except ImportError:
    print("Warning: python-dotenv not installed, using default environment")

try:
    # Import the Flask application
    from journal import create_app
    
    # Create the application
    app = create_app()
    
    if __name__ == "__main__":
        print("🚀 Starting Trading Journal Backend on AWS...")
        print("📊 Backend will be available at: http://localhost:5000")
        print("⚡ Press Ctrl+C to stop the server")
        app.run(host='0.0.0.0', port=5000, debug=False)
        
except Exception as e:
    print(f"Error starting application: {e}")
    print("Trying alternative import...")
    
    # Alternative startup method
    try:
        import sys
        sys.path.append('.')
        from journal.app import create_app
        app = create_app()
        app.run(host='0.0.0.0', port=5000, debug=False)
    except Exception as e2:
        print(f"Alternative startup failed: {e2}")
        print("Please check your Flask application setup")
