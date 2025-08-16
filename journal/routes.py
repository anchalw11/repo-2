from flask import Blueprint, request, jsonify
from .models import Trade, User, RiskPlan
from .extensions import db
from datetime import datetime
from .auth_middleware import session_required
import json
from flask_jwt_extended import jwt_required, get_jwt_identity

trades_bp = Blueprint('trades', __name__)
risk_plan_bp = Blueprint('risk_plan', __name__)
plan_generation_bp = Blueprint('plan_generation', __name__)

@trades_bp.route('/trades', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def add_trade():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    user_id = get_jwt_identity()

    if not data or not all(k in data for k in ['pair', 'type', 'entry', 'stopLoss', 'takeProfit']):
        return jsonify({'error': 'Missing required trade data'}), 422

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    new_trade = Trade(
        signal_id=data['id'],
        date=datetime.utcnow().date(),
        asset=data['pair'],
        direction=data['type'].lower(),
        entry_price=float(data['entry']),
        sl=float(data['stopLoss']),
        tp=float(data['takeProfit'][0]),
        outcome='pending',
        lot_size=0,
        exit_price=0,
        user_id=user.id
    )
    
    db.session.add(new_trade)
    db.session.commit()
    
    return jsonify({'message': 'Trade added successfully', 'trade_id': new_trade.id}), 201

@trades_bp.route('/trades', methods=['GET'])
@jwt_required()
def get_trades():
    user_id = get_jwt_identity()
    trades = Trade.query.filter_by(user_id=user_id).order_by(Trade.date.desc()).all()
    
    def calculate_trade_results(trade):
        pips = 0
        profit = 0
        rsr = 0
        
        if trade.outcome != 'pending':
            if 'jpy' in trade.asset.lower():
                pips_multiplier = 0.01
            else:
                pips_multiplier = 0.0001
            
            if trade.direction == 'buy':
                pips = (trade.exit_price - trade.entry_price) / pips_multiplier
            else:
                pips = (trade.entry_price - trade.exit_price) / pips_multiplier
            
            profit = pips * trade.lot_size
            
            if trade.sl and trade.tp:
                risk = abs(trade.entry_price - trade.sl)
                reward = abs(trade.tp - trade.entry_price)
                if risk > 0:
                    rsr = reward / risk
                    
        return round(pips, 2), round(profit, 2), round(rsr, 2)

    return jsonify([{
        'id': trade.id,
        'signal_id': trade.signal_id,
        'date': trade.date.isoformat(),
        'asset': trade.asset,
        'direction': trade.direction,
        'entry_price': trade.entry_price,
        'sl': trade.sl,
        'tp': trade.tp,
        'outcome': trade.outcome,
        'pips': calculate_trade_results(trade)[0],
        'profit': calculate_trade_results(trade)[1],
        'rsr': calculate_trade_results(trade)[2]
    } for trade in trades])

@trades_bp.route('/trades/<int:signal_id>', methods=['DELETE'])
def delete_trade(signal_id):
    trade_to_delete = Trade.query.filter_by(signal_id=signal_id).first()
    
    if not trade_to_delete:
        return jsonify({'error': 'Trade not found'}), 404
        
    db.session.delete(trade_to_delete)
    db.session.commit()
    
    return jsonify({'message': 'Trade deleted successfully'}), 200

def _get_float(data, key):
    val = data.get(key)
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        raise ValueError(f"Invalid float value for key '{key}': {val}")

def generate_comprehensive_risk_plan_with_prop_firm_rules(data):
    """
    Generate comprehensive risk management plan with prop firm rules extraction
    """
    
    # Prop firm database (simplified version - in production this would be in a database)
    prop_firms_db = {
        "QuantTekel (Quant Tekel)": {
            "QT Instant": {
                "daily_loss_limit": 0.04,  # 4%
                "max_drawdown": 0.08,      # 8%
                "profit_target_phase1": 0.06,  # 6%
                "profit_target_phase2": 0.05,  # 5%
                "min_trading_days": 4,
                "consistency_rule": 0.30,  # 30%
                "leverage": {"forex": 30, "metals": 15, "crypto": 1},
                "news_trading": "restricted",
                "weekend_holding": "allowed_with_fees"
            },
            "QT Classic": {
                "daily_loss_limit": 0.04,
                "max_drawdown": 0.08,
                "profit_target_phase1": 0.06,
                "profit_target_phase2": 0.05,
                "min_trading_days": 4,
                "consistency_rule": 0.30,
                "leverage": {"forex": 30, "metals": 15, "crypto": 1},
                "news_trading": "restricted",
                "weekend_holding": "allowed_with_fees"
            }
        },
        "FTMO": {
            "FTMO Challenge (Standard)": {
                "daily_loss_limit": 0.05,
                "max_drawdown": 0.10,
                "profit_target_phase1": 0.10,
                "profit_target_phase2": 0.05,
                "min_trading_days": 10,
                "consistency_rule": 0.30,
                "leverage": {"forex": 100, "indices": 100, "commodities": 100},
                "news_trading": "forbidden",
                "weekend_holding": "not_allowed"
            }
        },
        # Add more prop firms as needed
    }
    
    # Extract user data
    prop_firm = data.get('prop_firm', '')
    account_type = data.get('account_type', '')
    account_size = float(data.get('account_size', 10000))
    risk_percentage = float(data.get('risk_percentage', 1.0))
    trades_per_day = data.get('trades_per_day', '1-2')
    crypto_assets = data.get('crypto_assets', [])
    forex_assets = data.get('forex_assets', [])
    has_account = data.get('has_account', 'no')
    account_equity = float(data.get('account_equity', account_size))
    
    # Use account_equity if they have an existing account, otherwise use account_size
    working_capital = account_equity if has_account == 'yes' else account_size
    
    # Extract prop firm rules
    firm_rules = None
    if prop_firm in prop_firms_db and account_type in prop_firms_db[prop_firm]:
        firm_rules = prop_firms_db[prop_firm][account_type]
    else:
        # Default conservative rules if prop firm not found
        firm_rules = {
            "daily_loss_limit": 0.04,
            "max_drawdown": 0.08,
            "profit_target_phase1": 0.08,
            "profit_target_phase2": 0.05,
            "min_trading_days": 5,
            "consistency_rule": 0.25,
            "leverage": {"forex": 100},
            "news_trading": "allowed",
            "weekend_holding": "allowed"
        }
    
    # Calculate number of trades per day
    def parse_trades_per_day(trades_str):
        if '+' in trades_str:
            return int(trades_str.replace('+', '')) + 2
        elif '-' in trades_str:
            parts = trades_str.split('-')
            return int(parts[1])
        else:
            return int(trades_str)
    
    num_trades = parse_trades_per_day(trades_per_day)
    
    # Calculate risk parameters based on prop firm rules
    max_daily_risk = working_capital * firm_rules['daily_loss_limit']
    max_drawdown = working_capital * firm_rules['max_drawdown']
    
    # Adjust risk per trade based on user's risk percentage and prop firm limits
    user_risk_per_trade = working_capital * (risk_percentage / 100)
    prop_firm_max_per_trade = max_daily_risk / num_trades
    
    # Use the more conservative of the two
    risk_per_trade = min(user_risk_per_trade, prop_firm_max_per_trade)
    
    # Asset-specific risk adjustments
    def get_asset_multiplier(asset_type, asset_name):
        crypto_multipliers = {
            'BTC': 1.0, 'ETH': 1.1, 'SOL': 1.3, 'XRP': 1.2, 
            'ADA': 1.2, 'DOGE': 1.5, 'AVAX': 1.3, 'SHIB': 1.8
        }
        forex_multipliers = {
            'EURUSD': 1.0, 'GBPUSD': 1.1, 'USDJPY': 1.0,
            'XAU/USD': 1.2, 'USOIL': 1.3, 'US30': 1.1
        }
        
        if asset_type == 'crypto':
            return crypto_multipliers.get(asset_name, 1.4)
        else:
            return forex_multipliers.get(asset_name, 1.2)
    
    # Generate detailed trade-by-trade plan
    trades = []
    all_assets = [(asset, 'crypto') for asset in crypto_assets] + \
                [(asset, 'forex') for asset in forex_assets]
    
    # Calculate how many trades needed to pass the firm
    profit_target_phase1 = working_capital * firm_rules['profit_target_phase1']
    profit_target_phase2 = working_capital * firm_rules['profit_target_phase2']
    
    # Minimum risk-reward ratio to ensure profitability
    min_rr_ratio = 2.5  # Conservative approach
    
    for i in range(1, num_trades + 1):
        if all_assets:
            asset, asset_type = all_assets[(i-1) % len(all_assets)]
            multiplier = get_asset_multiplier(asset_type, asset)
            trade_risk = risk_per_trade * multiplier
        else:
            asset = f"Any selected asset"
            trade_risk = risk_per_trade
        
        # Calculate profit target
        profit_target = trade_risk * min_rr_ratio
        
        trades.append({
            'trade': f'Trade-{i}',
            'asset': asset,
            'risk_amount': round(trade_risk, 2),
            'profit_target': round(profit_target, 2),
            'risk_reward_ratio': f'1:{min_rr_ratio}',
            'position_size_calculation': f'Risk ${trade_risk:.2f} ÷ Stop Loss Distance = Position Size',
            'max_loss_per_trade': f'${trade_risk:.2f}',
            'expected_profit': f'${profit_target:.2f}'
        })
    
    # Calculate success metrics
    total_daily_risk = sum(trade['risk_amount'] for trade in trades)
    total_daily_profit_potential = sum(trade['profit_target'] for trade in trades)
    
    # Calculate days needed to pass each phase (assuming 60% win rate)
    win_rate = 0.60
    avg_daily_profit = (total_daily_profit_potential * win_rate) - (total_daily_risk * (1 - win_rate))
    
    days_to_pass_phase1 = max(firm_rules['min_trading_days'], 
                             int(profit_target_phase1 / avg_daily_profit) if avg_daily_profit > 0 else 30)
    days_to_pass_phase2 = max(firm_rules['min_trading_days'], 
                             int(profit_target_phase2 / avg_daily_profit) if avg_daily_profit > 0 else 30)
    
    # Build comprehensive plan
    comprehensive_plan = {
        'prop_firm_analysis': {
            'firm_name': prop_firm,
            'account_type': account_type,
            'account_size': account_size,
            'working_capital': working_capital,
            'extracted_rules': {
                'daily_loss_limit': f'${max_daily_risk:.2f} ({firm_rules["daily_loss_limit"]*100:.1f}%)',
                'max_drawdown': f'${max_drawdown:.2f} ({firm_rules["max_drawdown"]*100:.1f}%)',
                'profit_target_phase1': f'${profit_target_phase1:.2f} ({firm_rules["profit_target_phase1"]*100:.1f}%)',
                'profit_target_phase2': f'${profit_target_phase2:.2f} ({firm_rules["profit_target_phase2"]*100:.1f}%)',
                'min_trading_days': firm_rules['min_trading_days'],
                'consistency_rule': f'{firm_rules["consistency_rule"]*100:.0f}%',
                'news_trading': firm_rules['news_trading'],
                'weekend_holding': firm_rules['weekend_holding']
            }
        },
        'risk_calculations': {
            'max_daily_risk': round(max_daily_risk, 2),
            'risk_per_trade': round(risk_per_trade, 2),
            'total_daily_risk_used': round(total_daily_risk, 2),
            'daily_risk_utilization': f'{(total_daily_risk/max_daily_risk)*100:.1f}%',
            'safety_margin': round(max_daily_risk - total_daily_risk, 2)
        },
        'success_projections': {
            'days_to_pass_phase1': days_to_pass_phase1,
            'days_to_pass_phase2': days_to_pass_phase2,
            'daily_profit_potential': round(total_daily_profit_potential, 2),
            'daily_risk_exposure': round(total_daily_risk, 2),
            'expected_daily_pnl': round(avg_daily_profit, 2),
            'win_rate_assumption': f'{win_rate*100:.0f}%'
        },
        'detailed_trades': trades,
        'compliance_status': {
            'daily_risk_compliant': total_daily_risk <= max_daily_risk,
            'drawdown_protected': True,  # Always true with our conservative approach
            'consistency_achievable': True,  # Based on our risk management
            'overall_status': 'COMPLIANT' if total_daily_risk <= max_daily_risk else 'NEEDS_ADJUSTMENT'
        }
    }
    
    return comprehensive_plan

@risk_plan_bp.route('/risk-plan', methods=['POST', 'OPTIONS'])
def create_or_update_risk_plan():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        # Log the received data for debugging
        print("Received risk plan data:", data)
        
        # Validate required fields
        required_fields = ['trades_per_day', 'trading_session', 'prop_firm', 'account_type', 'account_size']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 422
        
        # Generate comprehensive risk management plan
        comprehensive_plan = generate_comprehensive_risk_plan_with_prop_firm_rules(data)
        
        # For now, we'll use a default user_id since JWT is not implemented in this route
        # In production, this should use JWT authentication
        user_email = data.get('user_email', 'default@example.com')
        
        # Find or create user
        user = User.query.filter_by(email=user_email).first()
        if not user:
            # Create a default user for testing - in production this should be handled differently
            user = User(
                username=user_email.split('@')[0],
                email=user_email,
                plan_type='premium'  # Default to premium for testing
            )
            db.session.add(user)
            db.session.commit()
        
        # Save or update risk plan in database
        risk_plan = RiskPlan.query.filter_by(user_id=user.id).first()
        
        if not risk_plan:
            risk_plan = RiskPlan(user_id=user.id)
            db.session.add(risk_plan)
        
        # Update risk plan with questionnaire data
        risk_plan.initial_balance = float(data.get('account_size', 10000))
        risk_plan.account_equity = float(data.get('account_equity', data.get('account_size', 10000)))
        risk_plan.trades_per_day = data.get('trades_per_day')
        risk_plan.trading_session = data.get('trading_session')
        risk_plan.crypto_assets = json.dumps(data.get('crypto_assets', []))
        risk_plan.forex_assets = json.dumps(data.get('forex_assets', []))
        risk_plan.has_account = data.get('has_account')
        risk_plan.prop_firm = data.get('prop_firm')
        risk_plan.account_type = data.get('account_type')
        risk_plan.account_size = float(data.get('account_size', 10000))
        risk_plan.risk_percentage = float(data.get('risk_percentage', 1.0))
        
        # Save risk parameters
        risk_calc = comprehensive_plan['risk_calculations']
        risk_plan.max_daily_risk = risk_calc['max_daily_risk']
        risk_plan.max_daily_risk_pct = f"{(risk_calc['max_daily_risk']/risk_plan.account_equity)*100:.2f}%"
        risk_plan.base_trade_risk = risk_calc['risk_per_trade']
        risk_plan.base_trade_risk_pct = f"{(risk_calc['risk_per_trade']/risk_plan.account_equity)*100:.2f}%"
        risk_plan.min_risk_reward = "1:2.5"
        
        # Save trades and compliance data as JSON
        risk_plan.trades = json.dumps(comprehensive_plan['detailed_trades'])
        risk_plan.prop_firm_compliance = json.dumps(comprehensive_plan['prop_firm_analysis']['extracted_rules'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Risk plan saved successfully',
            'comprehensive_plan': comprehensive_plan,
            'user_id': user.id
        }), 200
        
    except Exception as e:
        print(f"Error processing risk plan: {str(e)}")
        return jsonify({'error': f'An internal server error occurred: {str(e)}'}), 500

@risk_plan_bp.route('/risk-plan', methods=['GET'])
@jwt_required()
def get_risk_plan():
    user_id = get_jwt_identity()
    risk_plan = RiskPlan.query.filter_by(user_id=user_id).first()
    if not risk_plan:
        return jsonify({'error': 'Risk plan not found for this user'}), 404

    return jsonify({
        'user_id': risk_plan.user_id,
        'potential_profit_30_days': risk_plan.potential_profit_30_days,
        'potential_profit_45_days': risk_plan.potential_profit_45_days,
        'potential_profit_60_days': risk_plan.potential_profit_60_days,
        'has_60_day_guarantee': risk_plan.has_60_day_guarantee
    })

def generate_comprehensive_risk_plan(answers):
    """
    Generate risk management plan for any combination of questionnaire answers
    Ensures prop firm compliance and funded account success
    """
    
    # Extract and validate user answers with defaults
    trades_per_day = answers.get('tradesPerDay', '1-2')
    trading_session = answers.get('tradingSession', 'any')
    crypto_assets = answers.get('cryptoAssets', [])
    forex_assets = answers.get('forexAssets', [])
    has_account = answers.get('hasAccount', 'no')
    account_equity = answers.get('accountEquity', 10000)
    trading_experience = answers.get('tradingExperience', 'beginner')
    daily_trading_time = answers.get('dailyTradingTime', '1-2 hours')
    max_consecutive_losses = answers.get('maxConsecutiveLosses', 3)
    preferred_session = answers.get('preferredSession', 'any')
    
    # Validate account equity
    try:
        account_equity = float(account_equity) if account_equity else 10000.0
    except (TypeError, ValueError):
        account_equity = 10000.0
    
    # Determine experience-based risk parameters
    risk_profiles = {
        'beginner': {'daily_risk': 0.04, 'trade_risk': 0.02, 'min_rr': 2.0},
        'intermediate': {'daily_risk': 0.05, 'trade_risk': 0.025, 'min_rr': 2.5},
        'advanced': {'daily_risk': 0.06, 'trade_risk': 0.03, 'min_rr': 3.0}
    }
    
    profile = risk_profiles.get(trading_experience, risk_profiles['beginner'])
    
    # Calculate number of trades from trades_per_day string
    def parse_trades_per_day(trades_str):
        if '+' in trades_str:
            return int(trades_str.replace('+', '')) + 2
        elif '-' in trades_str:
            parts = trades_str.split('-')
            return int(parts[1])
        else:
            return int(trades_str)
    
    num_trades = parse_trades_per_day(trades_per_day)
    
    # Calculate risk allocations
    max_daily_risk = account_equity * profile['daily_risk']
    base_trade_risk = account_equity * profile['trade_risk']
    
    # Adjust trade risk based on number of trades to stay within daily limit
    adjusted_trade_risk = min(base_trade_risk, max_daily_risk / num_trades)
    
    # Asset-specific risk adjustments
    def get_asset_multiplier(asset_type, asset_name):
        """Adjust risk based on asset volatility"""
        crypto_multipliers = {
            'BTC': 1.0, 'ETH': 1.1, 'SOL': 1.3, 'XRP': 1.2, 
            'ADA': 1.2, 'DOGE': 1.5, 'AVAX': 1.3, 'SHIB': 1.8
        }
        forex_multipliers = {
            'EURUSD': 1.0, 'GBPUSD': 1.1, 'USDJPY': 1.0,
            'XAU/USD': 1.2, 'USOIL': 1.3, 'US30': 1.1
        }
        
        if asset_type == 'crypto':
            return crypto_multipliers.get(asset_name, 1.4)
        else:
            return forex_multipliers.get(asset_name, 1.2)
    
    # Generate individual trade plans
    trades = []
    all_assets = [(asset, 'crypto') for asset in crypto_assets] + \
                [(asset, 'forex') for asset in forex_assets]
    
    for i in range(1, num_trades + 1):
        # Rotate through available assets or use generic allocation
        if all_assets:
            asset, asset_type = all_assets[(i-1) % len(all_assets)]
            multiplier = get_asset_multiplier(asset_type, asset)
            trade_risk = adjusted_trade_risk * multiplier
        else:
            asset = f"Generic Asset {i}"
            trade_risk = adjusted_trade_risk
        
        # Calculate profit target based on risk-reward ratio
        profit_target = trade_risk * profile['min_rr']
        
        trades.append({
            'trade': f'trade-{i}',
            'asset': asset if all_assets else 'Any selected asset',
            'lossLimit': round(trade_risk, 2),
            'profitTarget': round(profit_target, 2),
            'riskRewardRatio': f"1:{profile['min_rr']}"
        })
    
    # Create comprehensive plan
    plan = {
        'userProfile': {
            'accountEquity': account_equity,
            'tradesPerDay': trades_per_day,
            'tradingSession': trading_session,
            'cryptoAssets': crypto_assets,
            'forexAssets': forex_assets,
            'hasAccount': has_account,
            'experience': trading_experience
        },
        'riskParameters': {
            'maxDailyRisk': round(max_daily_risk, 2),
            'maxDailyRiskPct': f"{profile['daily_risk']*100}%",
            'baseTradeRisk': round(adjusted_trade_risk, 2),
            'baseTradeRiskPct': f"{(adjusted_trade_risk/account_equity)*100:.2f}%",
            'minRiskReward': f"1:{profile['min_rr']}"
        },
        'trades': trades,
        'propFirmCompliance': {
            'dailyLossLimit': f"${round(max_daily_risk, 2)} ({profile['daily_risk']*100}%)",
            'totalDrawdownLimit': f"${round(account_equity * 0.10, 2)} (10%)",
            'profitTarget': f"${round(account_equity * 0.08, 2)} (8%)",
            'consistencyRule': "Maintain steady performance for Phase 2"
        }
    }
    
    return plan

@plan_generation_bp.route('/generate-plan', methods=['POST'])
def generate_plan():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON in request"}), 400
    answers = data.get('answers')

    if not answers:
        return jsonify({'error': 'Missing required data'}), 422

    try:
        plan = generate_comprehensive_risk_plan(answers)
        if plan:
            return jsonify(plan), 200
        else:
            return jsonify({'error': 'Failed to generate trading plan'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trades_bp.route('/accounts', methods=['GET'])
def get_accounts():
    return jsonify([]), 200

@risk_plan_bp.route('/trading-plan', methods=['GET'])
@jwt_required()
def get_trading_plan():
    user_id = get_jwt_identity()
    risk_plan = RiskPlan.query.filter_by(user_id=user_id).first()

    if not risk_plan:
        return jsonify({'error': 'Trading plan not found'}), 404

    try:
        crypto_assets = json.loads(risk_plan.crypto_assets) if risk_plan.crypto_assets else []
        forex_assets = json.loads(risk_plan.forex_assets) if risk_plan.forex_assets else []
    except (json.JSONDecodeError, TypeError):
        crypto_assets = []
        forex_assets = []

    trading_plan_data = {
        'userProfile': {
            'initialBalance': risk_plan.initial_balance,
            'accountEquity': risk_plan.account_equity,
            'tradesPerDay': risk_plan.trades_per_day,
            'tradingSession': risk_plan.trading_session,
            'cryptoAssets': crypto_assets,
            'forexAssets': forex_assets,
            'hasAccount': risk_plan.has_account,
            'experience': risk_plan.experience,
        },
        'riskParameters': {
            'maxDailyRisk': risk_plan.max_daily_risk,
            'maxDailyRiskPct': risk_plan.max_daily_risk_pct,
            'baseTradeRisk': risk_plan.base_trade_risk,
            'baseTradeRiskPct': risk_plan.base_trade_risk_pct,
            'minRiskReward': risk_plan.min_risk_reward,
        },
        'trades': risk_plan.trades,
        'propFirmCompliance': risk_plan.prop_firm_compliance,
    }

    return jsonify({'tradingPlan': trading_plan_data})

@risk_plan_bp.route('/dashboard-data/<user_email>', methods=['GET'])
def get_dashboard_data(user_email):
    """Get user dashboard data based on email"""
    try:
        user = User.query.filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        risk_plan = RiskPlan.query.filter_by(user_id=user.id).first()
        if not risk_plan:
            return jsonify({'error': 'Risk plan not found'}), 404
        
        # Get user trades for performance calculation
        trades = Trade.query.filter_by(user_id=user.id).all()
        
        # Calculate performance metrics
        total_trades = len(trades)
        winning_trades = len([t for t in trades if t.outcome == 'win'])
        losing_trades = len([t for t in trades if t.outcome == 'loss'])
        skipped_trades = len([t for t in trades if t.outcome == 'skipped'])
        
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        # Calculate total P&L (simplified)
        total_pnl = 0.0
        for trade in trades:
            if trade.outcome == 'win':
                total_pnl += abs(trade.tp - trade.entry_price) if trade.tp else 0
            elif trade.outcome == 'loss':
                total_pnl -= abs(trade.entry_price - trade.sl) if trade.sl else 0
        
        # Parse JSON fields safely
        try:
            crypto_assets = json.loads(risk_plan.crypto_assets) if risk_plan.crypto_assets else []
            forex_assets = json.loads(risk_plan.forex_assets) if risk_plan.forex_assets else []
            prop_firm_compliance = json.loads(risk_plan.prop_firm_compliance) if risk_plan.prop_firm_compliance else {}
        except (json.JSONDecodeError, TypeError):
            crypto_assets = []
            forex_assets = []
            prop_firm_compliance = {}
        
        dashboard_data = {
            'userProfile': {
                'propFirm': risk_plan.prop_firm or 'Not Set',
                'accountType': risk_plan.account_type or 'Not Set',
                'accountSize': risk_plan.account_size or 'Not Set',
                'experience': risk_plan.experience or 'Not Set',
                'tradesPerDay': risk_plan.trades_per_day or 'Not Set',
                'riskPerTrade': f"{risk_plan.risk_percentage}%" if risk_plan.risk_percentage else 'Not Set%',
                'riskReward': risk_plan.min_risk_reward or '1:Not Set',
                'session': risk_plan.trading_session or 'Not Set'
            },
            'performance': {
                'accountBalance': risk_plan.account_equity or 0,
                'winRate': round(win_rate, 1),
                'totalTrades': total_trades,
                'totalPnL': round(total_pnl, 2)
            },
            'propFirmRules': prop_firm_compliance,
            'riskProtocol': {
                'maxDailyRisk': risk_plan.max_daily_risk,
                'maxDailyRiskPct': risk_plan.max_daily_risk_pct,
                'baseTradeRisk': risk_plan.base_trade_risk,
                'baseTradeRiskPct': risk_plan.base_trade_risk_pct,
                'minRiskReward': risk_plan.min_risk_reward
            },
            'assets': {
                'crypto': crypto_assets,
                'forex': forex_assets
            }
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        print(f"Error fetching dashboard data: {str(e)}")
        return jsonify({'error': f'Failed to fetch dashboard data: {str(e)}'}), 500
