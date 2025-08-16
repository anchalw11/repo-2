from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash
import os
import logging

admin_auth_bp = Blueprint('admin_auth_bp', __name__)

# Setup logging
logging.basicConfig(level=logging.INFO)

# It's better to store the hash of the password, not the password itself.
# For a real application, this hash should be stored securely, not in the code.
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD_HASH = os.environ.get('ADMIN_PASSWORD_HASH', generate_password_hash('Str0ngP@ssw0rd!', method='pbkdf2:sha256'))

@admin_auth_bp.route('/validate-token', methods=['POST', 'OPTIONS'])
@jwt_required()
def validate_token():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify(success=True), 200

@admin_auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def admin_login():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    logging.info(f"Admin login attempt for username: {username}")

    if not username or not password:
        logging.warning("Admin login attempt with missing username or password.")
        return jsonify({"msg": "Missing username or password"}), 400

    if username == ADMIN_USERNAME and check_password_hash(ADMIN_PASSWORD_HASH, password):
        logging.info(f"Admin login successful for username: {username}")
        access_token = create_access_token(identity=username, expires_delta=False)
        return jsonify(access_token=access_token), 200
    
    logging.warning(f"Failed admin login attempt for username: {username}")
    return jsonify({"msg": "Bad username or password"}), 401
