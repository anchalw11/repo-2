#!/usr/bin/env python3
import os
from journal import create_app

if __name__ == "__main__":
    os.environ["FLASK_APP"] = "wsgi.py"
    os.environ["FLASK_ENV"] = "development"
    os.environ["DATABASE_URL"] = "sqlite:///instance/dev.db"
    os.environ["SECRET_KEY"] = "dev-secret-key"
    os.environ["JWT_SECRET_KEY"] = "jwt-dev-secret-key"
    
    app = create_app('journal.config.DevelopmentConfig')
    app.run(host='0.0.0.0', port=5000, debug=True)
