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

    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Add method not allowed handler
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Method not allowed",
            "message": f"The method {request.method} is not allowed for this endpoint",
            "allowed_methods": error.description if hasattr(error, 'description') else []
        }), 405

    # Register blueprints
    app.register_blueprint(trades_bp, url_prefix='/api')
    app.register_blueprint(risk_plan_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
    app.register_blueprint(telegram_bp, url_prefix='/api/telegram')
    app.register_blueprint(plan_generation_bp, url_prefix='/api')
    app.register_blueprint(account_bp, url_prefix='/api/accounts')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # Skip API routes - let them be handled by blueprints
        if path.startswith('api/'):
            return jsonify({"error": "API endpoint not found"}), 404
            
        if app.static_folder is None:
            # In production, serve a simple HTML if no static folder
            if app.config.get('ENV') == 'production':
                return '''
                <!DOCTYPE html>
                <html>
                <head><title>Trading Journal</title></head>
                <body>
                    <div id="root">Loading...</div>
                    <script>
                        // Simple client-side routing fallback
                        if (window.location.pathname.startsWith('/admin')) {
                            window.location.hash = '#/admin';
                        }
                    </script>
                </body>
                </html>
                '''
            raise RuntimeError("Static folder is not configured.")
        
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
                </head>
                <body>
                    <div id="root">
                        <div style="text-align: center; padding: 50px;">
                            <h1>Trading Journal</h1>
                            <p>Application is loading...</p>
                        </div>
                    </div>
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
