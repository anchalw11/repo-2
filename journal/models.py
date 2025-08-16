from .extensions import db
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlite3 import Connection as SQLite3Connection

# Enforce foreign key constraints on SQLite
@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, SQLite3Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    active_session_id = db.Column(db.String(255), nullable=True, unique=True)
    plan_type = db.Column(db.String(20), nullable=False, default='free') # e.g., 'free', 'premium', 'enterprise'
    trades = db.relationship('Trade', backref='user', lazy=True)
    accounts = db.relationship('Account', backref='user', lazy=True)
    risk_plan = db.relationship('RiskPlan', backref='user', uselist=False)

class Trade(db.Model):
    __tablename__ = 'trades'
    id = db.Column(db.Integer, primary_key=True)
    signal_id = db.Column(db.Integer, unique=True, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    asset = db.Column(db.String(50), nullable=False)
    direction = db.Column(db.String(4), nullable=False)  # 'buy' or 'sell'
    entry_price = db.Column(db.Float, nullable=False)
    exit_price = db.Column(db.Float, nullable=False)
    sl = db.Column(db.Float, nullable=True)  # Stop Loss
    tp = db.Column(db.Float, nullable=True)  # Take Profit
    lot_size = db.Column(db.Float, nullable=False)
    trade_duration = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    outcome = db.Column(db.String(10), nullable=False)  # 'win', 'loss', or 'skipped'
    status = db.Column(db.String(10), nullable=False, default='active') # 'active', 'taken', 'skipped'
    strategy_tag = db.Column(db.String(100), nullable=True)
    screenshot_url = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f'<Trade {self.id} on {self.asset}>'

class Account(db.Model):
    __tablename__ = 'accounts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    prop_firm_id = db.Column(db.Integer, db.ForeignKey('prop_firms.id'), nullable=True)
    account_name = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)  # e.g., 'live', 'demo', 'prop firm'
    balance = db.Column(db.Float, nullable=False, default=0.0)
    prop_firm = db.relationship('PropFirm', backref=db.backref('accounts', lazy=True))
    trades = db.relationship('Trade', backref='account', lazy=True)

    def __repr__(self):
        return f'<Account {self.account_name}>'

class PropFirm(db.Model):
    __tablename__ = 'prop_firms'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    website = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f'<PropFirm {self.name}>'

class Performance(db.Model):
    __tablename__ = 'performance'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    total_trades = db.Column(db.Integer, nullable=False, default=0)
    winning_trades = db.Column(db.Integer, nullable=False, default=0)
    losing_trades = db.Column(db.Integer, nullable=False, default=0)
    skipped_trades = db.Column(db.Integer, nullable=False, default=0)
    win_rate = db.Column(db.Float, nullable=False, default=0.0)
    total_pnl = db.Column(db.Float, nullable=False, default=0.0)
    user = db.relationship('User', backref=db.backref('performance_records', lazy=True))
    account = db.relationship('Account', backref=db.backref('performance_records', lazy=True))

    def __repr__(self):
        return f'<Performance for User {self.user_id} on {self.date}>'

class RiskPlan(db.Model):
    __tablename__ = 'risk_plans'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # User Profile
    initial_balance = db.Column(db.Float)
    account_equity = db.Column(db.Float)
    trades_per_day = db.Column(db.String)
    trading_session = db.Column(db.String)
    crypto_assets = db.Column(db.JSON)
    forex_assets = db.Column(db.JSON)
    has_account = db.Column(db.String)
    experience = db.Column(db.String)
    prop_firm = db.Column(db.String)
    account_type = db.Column(db.String)
    account_size = db.Column(db.Float)
    risk_percentage = db.Column(db.Float)

    # Risk Parameters
    max_daily_risk = db.Column(db.Float)
    max_daily_risk_pct = db.Column(db.String)
    base_trade_risk = db.Column(db.Float)
    base_trade_risk_pct = db.Column(db.String)
    min_risk_reward = db.Column(db.String)

    # Trades
    trades = db.Column(db.JSON)

    # Prop Firm Compliance
    prop_firm_compliance = db.Column(db.JSON)

    def __repr__(self):
        return f'<RiskPlan for User {self.user_id}>'
