from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .extensions import db, socketio
from .routes import trades_bp, risk_plan_bp, plan_generation_bp
from .auth import auth_bp
from .user_routes import user_bp
from .admin_auth import admin_auth_bp
from .telegram_routes import telegram_bp
from .account_routes import account_bp
import os
import sys
import urllib.parse
from dotenv import load_dotenv

def create_app(config_object='journal.config.DevelopmentConfig'):
    load_dotenv()
    app = Flask(__name__, 
               static_folder='static',
               static_url_path='',
               template_folder='static')
    
    try:
        app.config.from_object(config_object)
    except ImportError:
        print(f"Error: Configuration object '{config_object}' not found.")
        sys.exit(1)
        

    # Validate DATABASE_URL
    db_url = app.config.get('SQLALCHEMY_DATABASE_URI')
    if not db_url:
        print("Error: SQLALCHEMY_DATABASE_URI is not set.")
        sys.exit(1)
    
    print(f"Database URL: {db_url}")

    # Initialize extensions with comprehensive CORS
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Configure CORS
    allowed_origins = [
        "https://main.d2rt49p7nhfpv7.amplifyapp.com",  # Your Amplify domain
        "http://localhost:3000"  # For local development
    ]
    
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": allowed_origins,
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                 "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
                 "supports_credentials": True,
                 "expose_headers": ["Content-Type", "Authorization"],
                 "max_age": 3600
             }
         })
    socketio.init_app(app, cors_allowed_origins="*")

    # Add comprehensive CORS preflight handler for all routes
    @app.after_request
    def after_request(response):
        # Get the origin from the request
        origin = request.headers.get('Origin', '')
        
        # Define allowed origins
        allowed_origins = [
            'https://main.d2rt49p7nhfpv7.amplifyapp.com',  # Your Amplify domain
            'https://traderedgepro.com',                   # Production domain
            'http://localhost:3000',                       # Local development
            'http://localhost:5173'                        # Vite dev server
        ]
        
        # Set CORS headers if origin is allowed
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Allow-Headers', 
                              'Content-Type, Authorization, X-Requested-With, Accept, Origin')
            response.headers.add('Access-Control-Allow-Methods', 
                              'GET, POST, PUT, DELETE, OPTIONS, PATCH')
            response.headers.add('Access-Control-Max-Age', '3600')
        
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response.status_code = 200
            
        return response
    
    # Handle 405 Method Not Allowed errors - REMOVE THIS TO AVOID CONFLICTS
    # @app.errorhandler(405)
    # def method_not_allowed(e):
    #     response = jsonify({
    #         "error": "Method Not Allowed",
    #         "message": "The method is not allowed for the requested URL.",
    #         "allowed_methods": list(e.valid_methods) if hasattr(e, 'valid_methods') else []
    #     })
    #     response.headers.add("Access-Control-Allow-Origin", "*")
    #     response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With")
    #     response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
    #     return response, 405

    # Add a debug route to check registered routes
    @app.route('/debug/routes')
    def list_routes():
        output = []
        for rule in app.url_map.iter_rules():
            methods = ','.join(rule.methods or [])
            line = urllib.parse.unquote("{:50s} {:20s} {}".format(rule.endpoint, methods, str(rule)))
            output.append(line)
        return '<br>'.join(sorted(output))

    # Register blueprints - AUTH FIRST to ensure it's properly registered
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
    app.register_blueprint(trades_bp, url_prefix='/api')
    app.register_blueprint(risk_plan_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(telegram_bp, url_prefix='/api/telegram')
    app.register_blueprint(plan_generation_bp, url_prefix='/api')
    app.register_blueprint(account_bp, url_prefix='/api/accounts')
    
    # Log registered routes for debugging
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule.rule} [{','.join(rule.methods or [])}]")


    # Database tables are created via create_db.py

    @app.errorhandler(404)
    def not_found(e):
        # If the path is not for an API, serve the frontend's index.html.
        # This allows the client-side router to handle the route.
        if not request.path.startswith('/api/'):
            static_folder = app.static_folder
            if static_folder is not None:
                return send_from_directory(static_folder, 'index.html')
        # For API routes, return a standard 404 JSON response.
        return jsonify(error="Not found"), 404

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Return JSON instead of HTML for any other server error."""
        import traceback
        traceback.print_exc()
        response = { "msg": "An unexpected error occurred. Please try again." }
        return jsonify(response), 500

    return app

def create_production_app():
    return create_app('journal.config.ProductionConfig')
