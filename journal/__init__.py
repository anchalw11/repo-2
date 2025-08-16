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
from dotenv import load_dotenv

def create_app(config_object='journal.config.DevelopmentConfig'):
    load_dotenv()
    app = Flask(__name__, static_folder='../dist', static_url_path='')
    
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
    CORS(app, 
         origins=["*"], 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
         supports_credentials=True,
         expose_headers=["Content-Type", "Authorization"],
         max_age=3600)
    socketio.init_app(app, cors_allowed_origins="*")

    # Add comprehensive CORS preflight handler for all routes
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = jsonify({"status": "ok"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
            response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS,PATCH")
            response.headers.add('Access-Control-Max-Age', "3600")
            return response, 200
    
    # Add after_request handler for all responses
    @app.after_request
    def after_request(response):
        # Allow requests from any origin in development, but restrict in production
        allowed_origins = [
            'http://localhost:5173',  # Local development
            'https://main.d2at8owu9hshr.amplifyapp.com',  # Amplify domain
            'https://traderedgepro.com'  # Production domain
        ]
        
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
        
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
        import urllib
        output = []
        for rule in app.url_map.iter_rules():
            methods = ','.join(rule.methods)
            line = urllib.parse.unquote("{:50s} {:20s} {}".format(rule.endpoint, methods, rule))
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
        print(f"  {rule.endpoint}: {rule.rule} [{','.join(rule.methods)}]")

    # Move catch-all route to the very end, after all blueprints
    @app.route('/', defaults={'path': ''}, methods=['GET'])
    @app.route('/<path:path>', methods=['GET'])
    def serve(path):
        # Only handle non-API routes for static files and SPA routing
        if path.startswith('api'):
            # Let Flask handle API routes through blueprints
            from flask import abort
            abort(404)
        
        # Handle static files
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            # For SPA routing, always serve index.html for non-API routes
            try:
                return send_from_directory(app.static_folder, 'index.html')
            except Exception:
                # Fallback HTML if index.html doesn't exist
                return '''
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Trading Journal</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        .loading-container { text-align: center; padding: 50px; }
                    </style>
                </head>
                <body>
                    <div id="root">
                        <div class="loading-container">
                            <h1>Trading Journal</h1>
                            <p>Application is loading...</p>
                        </div>
                    </div>
                    <script>
                        if (window.location.pathname.startsWith('/admin')) {
                            window.location.hash = '#/admin';
                        }
                    </script>
                </body>
                </html>
                '''

    # Database tables are created via create_db.py

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
