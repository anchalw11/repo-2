import uuid
import logging
from flask import Blueprint, request, jsonify
from .models import db, User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.exceptions import BadRequest
from .schemas import RegisterSchema
from marshmallow import ValidationError

auth_bp = Blueprint('auth_bp', __name__)

# Set up logging
logging.basicConfig(level=logging.INFO)

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if data is None:
            raise BadRequest("No JSON data received")
        # Validate the data using the schema
        RegisterSchema().load(data)
    except BadRequest as e:
        logging.error(f"Bad Request: {str(e)}")
        return jsonify({"msg": f"Bad Request: {str(e)}"}), 400
    except ValidationError as err:
        logging.warning(f"Registration validation failed: {err.messages}")
        return jsonify(err.messages), 422
        
    firstName = data.get('firstName')
    lastName = data.get('lastName')
    email = data.get('email')
    password = data.get('password')
    plan_type = data.get('plan_type')
    trading_data = data.get('tradingData', {})

    if User.query.filter_by(email=email).first():
        logging.warning(f"Registration attempt with existing email: {email}")
        return jsonify({"msg": "Email already registered"}), 400

    username = f"{firstName} {lastName}"
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    
    new_user = User(
        username=username,
        email=email,
        password_hash=hashed_password,
        plan_type=plan_type
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        logging.info(f"User {email} registered successfully.")
    except Exception as e:
        db.session.rollback()
        logging.error(f"Database error during registration for {email}: {str(e)}")
        return jsonify({"msg": "Database error, could not register user."}), 500

    # Store trading data in user session for later retrieval
    if trading_data:
        # You could store this in a separate table or in the user's session
        # For now, we'll include it in the JWT token
        pass
    access_token = create_access_token(identity=new_user.id)
    
    return jsonify(access_token=access_token), 201

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON in request"}), 400
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"msg": "Bad email or password"}), 401

    if user.plan_type == 'free':
        return jsonify({"msg": "Please upgrade your plan to login"}), 402

    session_id = str(uuid.uuid4())
    user.active_session_id = session_id
    db.session.commit()

    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'plan_type': user.plan_type,
            'username': user.username,
            'session_id': session_id,
            'setup_complete': True,
        }
    )
    return jsonify(access_token=access_token), 200

@auth_bp.route('/profile', methods=['GET', 'OPTIONS'])
@jwt_required()
def profile():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "plan_type": user.plan_type
    }), 200
