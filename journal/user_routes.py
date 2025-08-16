from flask import Blueprint, request, jsonify
from .models import db, User
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/user/plan', methods=['PUT'])
@jwt_required()
def update_plan():
    user_id = get_jwt_identity()
    data = request.get_json()
    plan = data.get('plan')

    if not plan:
        return jsonify({"msg": "Missing plan"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.plan_type = plan
    db.session.commit()

    return jsonify({"msg": "Plan updated successfully"}), 200
