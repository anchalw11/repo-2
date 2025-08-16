from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from .models import User

def session_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        claims = get_jwt()
        session_id = claims.get('session_id')

        if not session_id:
            return jsonify({"msg": "Missing session ID"}), 401

        user = User.query.get(user_id)

        if not user or user.active_session_id != session_id:
            return jsonify({"msg": "Session is invalid. Please log in again."}), 401
        
        return fn(*args, **kwargs)
    return wrapper
