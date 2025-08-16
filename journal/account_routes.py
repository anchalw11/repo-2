from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, Account, PropFirm, Performance, User

account_bp = Blueprint('account_bp', __name__)

@account_bp.route('/accounts', methods=['POST'])
@jwt_required()
def create_account():
    data = request.get_json()
    user_id = get_jwt_identity()
    
    new_account = Account(
        user_id=user_id,
        prop_firm_id=data.get('prop_firm_id'),
        account_name=data['account_name'],
        account_type=data['account_type'],
        balance=data.get('balance', 0.0)
    )
    
    db.session.add(new_account)
    db.session.commit()
    
    return jsonify({'message': 'Account created successfully'}), 201

@account_bp.route('/accounts', methods=['GET'])
@jwt_required()
def get_accounts():
    user_id = get_jwt_identity()
    accounts = Account.query.filter_by(user_id=user_id).all()
    
    return jsonify([{
        'id': acc.id,
        'account_name': acc.account_name,
        'account_type': acc.account_type,
        'balance': acc.balance
    } for acc in accounts])

@account_bp.route('/propfirms', methods=['POST'])
@jwt_required()
def create_prop_firm():
    data = request.get_json()
    
    new_prop_firm = PropFirm(
        name=data['name'],
        website=data.get('website')
    )
    
    db.session.add(new_prop_firm)
    db.session.commit()
    
    return jsonify({'message': 'Prop firm created successfully'}), 201

@account_bp.route('/propfirms', methods=['GET'])
def get_prop_firms():
    prop_firms = PropFirm.query.all()
    
    return jsonify([{
        'id': firm.id,
        'name': firm.name,
        'website': firm.website
    } for firm in prop_firms])

@account_bp.route('/performance', methods=['GET'])
@jwt_required()
def get_performance():
    user_id = get_jwt_identity()
    account_id = request.args.get('account_id')
    
    if not account_id:
        return jsonify({'message': 'Account ID is required'}), 400
        
    performance_records = Performance.query.filter_by(user_id=user_id, account_id=account_id).all()
    
    return jsonify([{
        'date': rec.date,
        'total_trades': rec.total_trades,
        'winning_trades': rec.winning_trades,
        'losing_trades': rec.losing_trades,
        'skipped_trades': rec.skipped_trades,
        'win_rate': rec.win_rate,
        'total_pnl': rec.total_pnl
    } for rec in performance_records])
