# HTTP 405 Method Not Allowed - Deployment Fix Guide

## Problem Analysis

Based on your Flask application structure, the 405 error is likely caused by one or more of these issues:

### 1. **Missing Production Configuration**
Your `ProductionConfig` class doesn't specify CORS origins, which can cause method restrictions.

### 2. **Server Configuration Issues**
The deployment server may not be configured to handle all HTTP methods (GET, POST, PUT, DELETE) properly.

### 3. **Route Method Mismatches**
Some routes may be expecting different HTTP methods than what the frontend is sending.

### 4. **Static File Serving Conflicts**
The catch-all route `@app.route('/<path:path>')` might be interfering with API routes.

## Immediate Fixes

### Fix 1: Update Production Configuration

```python
# journal/config.py - Add this to ProductionConfig class
class ProductionConfig(Config):
    """Production configuration."""
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://user:password@host/db')
    DEBUG = False
    CORS_ORIGINS = ["*"]  # Or specify your domain: ["https://yourdomain.com"]
    
    # Add these for better production handling
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
```

### Fix 2: Add Method Handling Middleware

```python
# journal/__init__.py - Add after CORS initialization
from flask import request, jsonify

def create_app(config_object='journal.config.DevelopmentConfig'):
    # ... existing code ...
    
    # Add OPTIONS method handler for CORS preflight
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = jsonify()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add('Access-Control-Allow-Headers', "*")
            response.headers.add('Access-Control-Allow-Methods', "*")
            return response
    
    # Add method not allowed handler
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Method not allowed",
            "message": f"The method {request.method} is not allowed for this endpoint",
            "allowed_methods": error.description if hasattr(error, 'description') else []
        }), 405
    
    # ... rest of existing code ...
```

### Fix 3: Fix Route Order Issue

```python
# journal/__init__.py - Modify the catch-all route
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Skip API routes - let them be handled by blueprints
    if path.startswith('api/'):
        return jsonify({"error": "API endpoint not found"}), 404
        
    if app.static_folder is None:
        raise RuntimeError("Static folder is not configured.")
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')
```

### Fix 4: Add Deployment-Specific Route Fixes

```python
# journal/routes.py - Add missing OPTIONS methods
@risk_plan_bp.route('/risk-plan', methods=['POST', 'OPTIONS'])
def create_or_update_risk_plan():
    if request.method == 'OPTIONS':
        return '', 200
    # ... existing code ...

@trades_bp.route('/trades', methods=['GET', 'POST', 'OPTIONS'])
@jwt_required()
def handle_trades():
    if request.method == 'OPTIONS':
        return '', 200
    
    if request.method == 'GET':
        return get_trades()
    elif request.method == 'POST':
        return add_trade()

# Split the existing trades route into separate functions
def get_trades():
    # ... existing GET logic ...

def add_trade():
    # ... existing POST logic ...
```

## Server Configuration Fixes

### For Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/ - [L]
RewriteRule . /index.html [L]

# Allow all HTTP methods
<Limit GET POST PUT DELETE OPTIONS>
    Allow from all
</Limit>
```

### For Nginx
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Allow all methods
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
}
```

## Environment Variables for Production

```bash
# .env for production
FLASK_ENV=production
SECRET_KEY=your_super_secret_production_key
JWT_SECRET_KEY=your_jwt_secret_production_key
DATABASE_URL=your_production_database_url
CORS_ORIGINS=https://yourdomain.com
```

## Testing the Fixes

1. **Test locally first:**
   ```bash
   export FLASK_ENV=production
   python3 journal/run_journal.py
   ```

2. **Test specific endpoints:**
   ```bash
   curl -X POST http://your-domain.com/api/trades \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_token" \
     -d '{"test": "data"}'
   ```

3. **Check server logs** for specific error messages

## Common Deployment Issues

1. **WSGI Configuration**: Ensure your WSGI server (Gunicorn, uWSGI) is configured correctly
2. **File Permissions**: Check that your server has proper read/write permissions
3. **Port Conflicts**: Ensure no port conflicts with other services
4. **Database Connections**: Verify database connectivity in production
5. **Static Files**: Ensure static files are served correctly

## Quick Diagnostic Commands

```bash
# Check if your API endpoints are accessible
curl -I http://your-domain.com/api/trades

# Check server logs
tail -f /var/log/nginx/error.log  # For Nginx
tail -f /var/log/apache2/error.log  # For Apache

# Test CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://your-domain.com/api/trades
```

The most likely cause is the missing CORS configuration in production and the catch-all route interfering with API endpoints. Apply fixes 1-3 first, then test your deployment.
