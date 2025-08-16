-- Payment Integration Database Schema
-- This schema supports tracking all payment methods with exact amount verification

-- Payments table - stores all payment transactions
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'crypto')),
    payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    
    -- Customer information
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    plan_name VARCHAR(100) NOT NULL,
    
    -- Crypto-specific fields
    transaction_hash VARCHAR(255),
    cryptocurrency VARCHAR(10) CHECK (cryptocurrency IN ('ETH', 'SOL')),
    wallet_address VARCHAR(255),
    
    -- PayPal-specific fields
    paypal_order_id VARCHAR(255),
    
    -- Verification details
    verified_at TIMESTAMP,
    verification_details JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE(payment_id, payment_method),
    INDEX idx_payments_status (status),
    INDEX idx_payments_customer_email (customer_email),
    INDEX idx_payments_created_at (created_at),
    INDEX idx_payments_transaction_hash (transaction_hash)
);

-- Payment verification logs - tracks all verification attempts
CREATE TABLE payment_verification_logs (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payments(id),
    verification_attempt INTEGER DEFAULT 1,
    verification_status VARCHAR(20) NOT NULL,
    verification_details JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_verification_logs_payment_id (payment_id),
    INDEX idx_verification_logs_status (verification_status)
);

-- Email notifications log - tracks all sent emails
CREATE TABLE email_notifications (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payments(id),
    recipient_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('admin_notification', 'customer_confirmation')),
    subject VARCHAR(255),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email_notifications_payment_id (payment_id),
    INDEX idx_email_notifications_recipient (recipient_email),
    INDEX idx_email_notifications_type (email_type)
);

-- Crypto price history - stores price data for verification
CREATE TABLE crypto_prices (
    id SERIAL PRIMARY KEY,
    cryptocurrency VARCHAR(10) NOT NULL,
    price_usd DECIMAL(15,8) NOT NULL,
    source VARCHAR(50) DEFAULT 'coingecko',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_crypto_prices_currency_time (cryptocurrency, recorded_at)
);

-- User payment history view
CREATE VIEW user_payment_history AS
SELECT 
    p.id,
    p.customer_email,
    p.customer_name,
    p.plan_name,
    p.payment_method,
    p.amount,
    p.currency,
    p.status,
    p.created_at,
    p.verified_at,
    CASE 
        WHEN p.payment_method = 'crypto' THEN p.cryptocurrency
        ELSE NULL 
    END as crypto_type,
    CASE 
        WHEN p.payment_method = 'crypto' THEN p.transaction_hash
        ELSE p.payment_id 
    END as transaction_reference
FROM payments p
WHERE p.status IN ('completed', 'pending');

-- Payment statistics view
CREATE VIEW payment_statistics AS
SELECT 
    payment_method,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    ROUND(
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2
    ) as success_rate_percent
FROM payments 
GROUP BY payment_method;

-- Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
INSERT INTO payments (
    payment_method, payment_id, amount, customer_email, customer_name, 
    plan_name, status, created_at
) VALUES 
    ('stripe', 'pi_test_123456789', 49.99, 'test@example.com', 'Test User', 'Pro Plan', 'completed', NOW()),
    ('paypal', 'paypal_test_987654321', 99.99, 'test2@example.com', 'Test User 2', 'Premium Plan', 'completed', NOW()),
    ('crypto', '0x1234567890abcdef', 29.99, 'test3@example.com', 'Test User 3', 'Basic Plan', 'pending', NOW());

-- Update the crypto payment with additional details
UPDATE payments 
SET 
    transaction_hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    cryptocurrency = 'ETH',
    wallet_address = '0x461bBf1B66978fE97B1A2bcEc52FbaB6aEDDF256'
WHERE payment_id = '0x1234567890abcdef';

-- Useful queries for monitoring

-- Get all pending crypto payments
-- SELECT * FROM payments WHERE payment_method = 'crypto' AND status = 'pending';

-- Get payment statistics by method
-- SELECT * FROM payment_statistics;

-- Get recent payments (last 24 hours)
-- SELECT * FROM user_payment_history WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Get failed verification attempts
-- SELECT p.*, pvl.* FROM payments p 
-- JOIN payment_verification_logs pvl ON p.id = pvl.payment_id 
-- WHERE pvl.verification_status = 'failed';
