import { EmailTemplate, EmailEvent, EmailData } from '../types/email';

// Mailchimp configuration
const MAILCHIMP_API_KEY = 'de5ba33102d063d239d74e2f63154a64-us1';
const MAILCHIMP_SERVER = 'us1';
const MAILCHIMP_LIST_ID = process.env.VITE_MAILCHIMP_LIST_ID || 'default_list';

interface MailchimpContact {
  email_address: string;
  status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
  merge_fields: {
    FNAME?: string;
    LNAME?: string;
    [key: string]: any;
  };
  tags?: string[];
}

interface MailchimpCampaign {
  type: 'regular';
  recipients: {
    list_id: string;
    segment_opts?: {
      match: 'any' | 'all';
      conditions: Array<{
        condition_type: 'TextMerge' | 'EmailAddress';
        field: string;
        op: 'is' | 'not' | 'contains';
        value: string;
      }>;
    };
  };
  settings: {
    subject_line: string;
    title: string;
    from_name: string;
    reply_to: string;
    to_name?: string;
  };
}

class EmailService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0`;
    this.headers = {
      'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  // Add or update contact in Mailchimp
  async addContact(email: string, firstName?: string, lastName?: string, tags?: string[]): Promise<boolean> {
    try {
      const contact: MailchimpContact = {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          ...(firstName && { FNAME: firstName }),
          ...(lastName && { LNAME: lastName }),
        },
        ...(tags && { tags }),
      };

      const response = await fetch(`${this.baseUrl}/lists/${MAILCHIMP_LIST_ID}/members`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(contact),
      });

      if (response.status === 400) {
        // Contact might already exist, try to update
        const memberHash = this.getMemberHash(email);
        const updateResponse = await fetch(`${this.baseUrl}/lists/${MAILCHIMP_LIST_ID}/members/${memberHash}`, {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify(contact),
        });
        return updateResponse.ok;
      }

      return response.ok;
    } catch (error) {
      console.error('Error adding contact to Mailchimp:', error);
      return false;
    }
  }

  // Create and send campaign
  async sendCampaign(
    subject: string,
    htmlContent: string,
    recipientEmail?: string,
    recipientName?: string
  ): Promise<boolean> {
    try {
      // Create campaign
      const campaign: MailchimpCampaign = {
        type: 'regular',
        recipients: {
          list_id: MAILCHIMP_LIST_ID,
          ...(recipientEmail && {
            segment_opts: {
              match: 'any',
              conditions: [{
                condition_type: 'EmailAddress',
                field: 'EMAIL',
                op: 'is',
                value: recipientEmail,
              }],
            },
          }),
        },
        settings: {
          subject_line: subject,
          title: `TraderEdgePro - ${subject}`,
          from_name: 'TraderEdgePro',
          reply_to: 'support@traderedgepro.com',
          ...(recipientName && { to_name: recipientName }),
        },
      };

      const campaignResponse = await fetch(`${this.baseUrl}/campaigns`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(campaign),
      });

      if (!campaignResponse.ok) {
        throw new Error(`Failed to create campaign: ${campaignResponse.statusText}`);
      }

      const campaignData = await campaignResponse.json();
      const campaignId = campaignData.id;

      // Set campaign content
      const contentResponse = await fetch(`${this.baseUrl}/campaigns/${campaignId}/content`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({ html: htmlContent }),
      });

      if (!contentResponse.ok) {
        throw new Error(`Failed to set campaign content: ${contentResponse.statusText}`);
      }

      // Send campaign
      const sendResponse = await fetch(`${this.baseUrl}/campaigns/${campaignId}/actions/send`, {
        method: 'POST',
        headers: this.headers,
      });

      return sendResponse.ok;
    } catch (error) {
      console.error('Error sending campaign:', error);
      return false;
    }
  }

  // Generate MD5 hash for member ID
  private getMemberHash(email: string): string {
    // Simple hash function for demo - in production, use a proper crypto library
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Send welcome email
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    await this.addContact(email, name, '', ['new-user']);
    const template = this.getWelcomeTemplate(name);
    return this.sendCampaign('Welcome to TraderEdgePro! 🚀', template, email, name);
  }

  // Send account creation confirmation
  async sendAccountCreationEmail(email: string, name: string, membershipTier: string): Promise<boolean> {
    await this.addContact(email, name, '', ['account-created', membershipTier]);
    const template = this.getAccountCreationTemplate(name, membershipTier);
    return this.sendCampaign('Account Created Successfully! 🎉', template, email, name);
  }

  // Send payment success email
  async sendPaymentSuccessEmail(
    email: string, 
    name: string, 
    amount: number, 
    membershipTier: string,
    transactionId: string
  ): Promise<boolean> {
    await this.addContact(email, name, '', ['payment-success', membershipTier]);
    const template = this.getPaymentSuccessTemplate(name, amount, membershipTier, transactionId);
    return this.sendCampaign('Payment Successful - Welcome to Premium! 💎', template, email, name);
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
    const template = this.getPasswordResetTemplate(name, resetToken);
    return this.sendCampaign('Reset Your Password - TraderEdgePro 🔐', template, email, name);
  }

  // Send trading milestone email
  async sendTradingMilestoneEmail(
    email: string, 
    name: string, 
    milestone: string, 
    achievement: string
  ): Promise<boolean> {
    const template = this.getTradingMilestoneTemplate(name, milestone, achievement);
    return this.sendCampaign(`Congratulations! ${milestone} Achieved! 🏆`, template, email, name);
  }

  // Send risk alert email
  async sendRiskAlertEmail(
    email: string, 
    name: string, 
    alertType: string, 
    details: string
  ): Promise<boolean> {
    const template = this.getRiskAlertTemplate(name, alertType, details);
    return this.sendCampaign(`Risk Alert: ${alertType} ⚠️`, template, email, name);
  }

  // Send subscription renewal reminder
  async sendSubscriptionReminderEmail(
    email: string, 
    name: string, 
    daysUntilExpiry: number,
    membershipTier: string
  ): Promise<boolean> {
    const template = this.getSubscriptionReminderTemplate(name, daysUntilExpiry, membershipTier);
    return this.sendCampaign(`Subscription Renewal Reminder - ${daysUntilExpiry} Days Left 📅`, template, email, name);
  }

  // Get futuristic email template base
  private getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TraderEdgePro</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a1f 0%, #000000 100%);
            color: #ffffff;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(0, 20, 40, 0.9);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 20px;
            overflow: hidden;
            position: relative;
        }
        
        .email-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #00ffff, #00ff88, #ff00ff, #00ffff);
            animation: glow 3s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { opacity: 0.5; }
            to { opacity: 1; }
        }
        
        .header {
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(45deg, #00ffff, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
            text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }
        
        .tagline {
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            font-weight: 300;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #00ffff;
        }
        
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .highlight-box {
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 255, 136, 0.1));
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 15px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(45deg, #00ffff, #00ff88);
            color: #000;
            padding: 15px 30px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 255, 136, 0.5);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-item {
            background: rgba(0, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 255, 0.2);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #00ff88;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .footer {
            background: rgba(0, 0, 0, 0.5);
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(0, 255, 255, 0.2);
        }
        
        .footer-links {
            margin-bottom: 20px;
        }
        
        .footer-links a {
            color: #00ffff;
            text-decoration: none;
            margin: 0 15px;
            font-size: 14px;
        }
        
        .footer-text {
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
            line-height: 1.5;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #00ffff;
            font-size: 18px;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 15px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TraderEdgePro</div>
            <div class="tagline">Advanced Trading Intelligence Platform</div>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <div class="footer-links">
                <a href="https://traderedgepro.com/dashboard">Dashboard</a>
                <a href="https://traderedgepro.com/support">Support</a>
                <a href="https://traderedgepro.com/settings">Settings</a>
            </div>
            
            <div class="social-links">
                <a href="#" title="Twitter">🐦</a>
                <a href="#" title="LinkedIn">💼</a>
                <a href="#" title="Discord">💬</a>
                <a href="#" title="Telegram">📱</a>
            </div>
            
            <div class="footer-text">
                © 2025 TraderEdgePro. All rights reserved.<br>
                You're receiving this email because you're a valued member of our trading community.<br>
                <a href="#" style="color: #00ffff;">Unsubscribe</a> | <a href="#" style="color: #00ffff;">Update Preferences</a>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Welcome email template
  private getWelcomeTemplate(name: string): string {
    const content = `
      <div class="greeting">Welcome to the Future of Trading, ${name}! 🚀</div>
      
      <div class="message">
        You've just joined an elite community of traders who leverage cutting-edge AI and advanced analytics 
        to dominate the markets. Your journey to trading excellence starts now.
      </div>
      
      <div class="highlight-box">
        <h3 style="color: #00ff88; margin-bottom: 15px;">🎯 What's Next?</h3>
        <p style="margin-bottom: 20px;">Complete your setup to unlock the full power of TraderEdgePro:</p>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">1</div>
            <div class="stat-label">Complete Profile</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">2</div>
            <div class="stat-label">Take Assessment</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">3</div>
            <div class="stat-label">Start Trading</div>
          </div>
        </div>
        
        <a href="https://traderedgepro.com/dashboard" class="cta-button">
          Launch Dashboard 🚀
        </a>
      </div>
      
      <div class="message">
        <strong>🔥 Exclusive Features Awaiting You:</strong><br>
        • AI-powered signal generation<br>
        • Real-time risk management<br>
        • Advanced performance analytics<br>
        • 24/7 trading mentor support<br>
        • Multi-account portfolio tracking
      </div>
      
      <div class="message">
        Need help getting started? Our support team is standing by 24/7 to ensure your success.
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  // Account creation template
  private getAccountCreationTemplate(name: string, membershipTier: string): string {
    const tierColors = {
      'free': '#888888',
      'pro': '#00ffff',
      'professional': '#00ff88',
      'elite': '#ff00ff',
      'enterprise': '#ffd700'
    };
    
    const tierColor = tierColors[membershipTier as keyof typeof tierColors] || '#00ffff';
    
    const content = `
      <div class="greeting">Account Activated Successfully! 🎉</div>
      
      <div class="message">
        Congratulations ${name}! Your TraderEdgePro account has been created and is ready for action.
      </div>
      
      <div class="highlight-box">
        <h3 style="color: ${tierColor}; margin-bottom: 15px;">
          🏆 ${membershipTier.toUpperCase()} MEMBERSHIP ACTIVATED
        </h3>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value" style="color: ${tierColor};">✓</div>
            <div class="stat-label">Account Verified</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${tierColor};">✓</div>
            <div class="stat-label">Access Granted</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${tierColor};">✓</div>
            <div class="stat-label">Ready to Trade</div>
          </div>
        </div>
        
        <a href="https://traderedgepro.com/login" class="cta-button">
          Access Your Dashboard 🚀
        </a>
      </div>
      
      <div class="message">
        <strong>🔐 Your Account Details:</strong><br>
        • Email: <span style="color: #00ffff;">[Email will be auto-filled]</span><br>
        • Membership: <span style="color: ${tierColor};">${membershipTier.toUpperCase()}</span><br>
        • Status: <span style="color: #00ff88;">ACTIVE</span><br>
        • Created: <span style="color: #00ffff;">${new Date().toLocaleDateString()}</span>
      </div>
      
      <div class="message">
        Your trading journey begins now. Log in to explore your personalized dashboard and start making profitable trades!
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  // Payment success template
  private getPaymentSuccessTemplate(name: string, amount: number, membershipTier: string, transactionId: string): string {
    const content = `
      <div class="greeting">Payment Successful! Welcome to Premium! 💎</div>
      
      <div class="message">
        Thank you ${name}! Your payment has been processed successfully and your premium features are now active.
      </div>
      
      <div class="highlight-box">
        <h3 style="color: #00ff88; margin-bottom: 15px;">💳 Payment Confirmation</h3>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">$${amount}</div>
            <div class="stat-label">Amount Paid</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${membershipTier.toUpperCase()}</div>
            <div class="stat-label">Membership</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">✓</div>
            <div class="stat-label">Activated</div>
          </div>
        </div>
        
        <p style="margin: 20px 0; font-size: 14px; color: rgba(255,255,255,0.7);">
          Transaction ID: <span style="color: #00ffff;">${transactionId}</span>
        </p>
        
        <a href="https://traderedgepro.com/dashboard" class="cta-button">
          Explore Premium Features 🚀
        </a>
      </div>
      
      <div class="message">
        <strong>🎯 Premium Features Now Available:</strong><br>
        • Advanced AI signal generation<br>
        • Multi-account portfolio tracking<br>
        • Priority customer support<br>
        • Exclusive trading strategies<br>
        • Real-time market analysis<br>
        • Risk management tools
      </div>
      
      <div class="message">
        Questions about your subscription? Contact our premium support team anytime.
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  // Password reset template
  private getPasswordResetTemplate(name: string, resetToken: string): string {
    const content = `
      <div class="greeting">Password Reset Request 🔐</div>
      
      <div class="message">
        Hi ${name}, we received a request to reset your TraderEdgePro account password.
      </div>
      
      <div class="highlight-box">
        <h3 style="color: #ff6b6b; margin-bottom: 15px;">🔒 Secure Password Reset</h3>
        
        <p style="margin-bottom: 20px;">
          Click the button below to create a new password. This link will expire in 1 hour for security.
        </p>
        
        <a href="https://traderedgepro.com/reset-password?token=${resetToken}" class="cta-button">
          Reset Password 🔑
        </a>
        
        <p style="margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.6);">
          If the button doesn't work, copy and paste this link:<br>
          <span style="color: #00ffff; word-break: break-all;">
            https://traderedgepro.com/reset-password?token=${resetToken}
          </span>
        </p>
      </div>
      
      <div class="message">
        <strong>⚠️ Security Notice:</strong><br>
        • This reset link expires in 1 hour<br>
        • If you didn't request this reset, please ignore this email<br>
        • Your account remains secure until you create a new password
      </div>
      
      <div class="message">
        Need help? Contact our security team immediately if you suspect unauthorized access.
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  // Trading milestone template
  private getTradingMilestoneTemplate(name: string, milestone: string, achievement: string): string {
    const content = `
      <div class="greeting">Congratulations ${name}! 🏆</div>
      
      <div class="message">
        You've achieved an incredible milestone in your trading journey. Your dedication and skill are paying off!
      </div>
      
      <div class="highlight-box">
        <h3 style="color: #ffd700; margin-bottom: 15px;">🎯 ${milestone}</h3>
        
        <div style="font-size: 18px; color: #00ff88; margin: 20px 0; font-weight: 600;">
          ${achievement}
        </div>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">🏆</div>
            <div class="stat-label">Achievement</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">📈</div>
            <div class="stat-label">Progress</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">🚀</div>
            <div class="stat-label">Next Level</div>
          </div>
        </div>
        
        <a href="https://traderedgepro.com/analytics" class="cta-button">
          View Full Analytics 📊
        </a>
      </div>
      
      <div class="message">
        <strong>🎉 What This Means:</strong><br>
        Your trading performance is exceptional and you're on track for even greater success. 
        Keep following your strategy and risk management rules.
      </div>
      
      <div class="message">
        Share your success with the TraderEdgePro community and inspire other traders!
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  // Risk alert template
  private getRiskAlertTemplate(name: string, alertType: string, details: string): string {
    const content = `
      <div class="greeting" style="color: #ff6b6b;">Risk Alert: ${alertType} ⚠️</div>
      
      <div class="message">
        ${name}, we've detected a risk situation that requires your immediate attention.
      </div>
      
      <div class="highlight-box" style="border-color: rgba(255, 107, 107, 0.5); background: rgba(255, 107, 107, 0.1);">
        <h3 style="color: #ff6b6b; margin-bottom: 15px;">⚠️ Risk Alert Details</h3>
        
        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin: 20px 0;">
          <p style="color: #ffffff; font-weight: 500;">${details}</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-item" style="border-color: rgba(255, 107, 107, 0.3);">
            <div class="stat-value" style="color: #ff6b6b;">⚠️</div>
            <div class="stat-label">Alert Level</div>
          </div>
          <div class="stat-item" style="border-color: rgba(255, 107, 107, 0.3);">
            <div class="stat-value" style="color: #ff6b6b;">NOW</div>
            <div class="stat-label">Action Required</div>
          </div>
          <div class="stat-item" style="border-color: rgba(255, 107, 107, 0.3);">
            <div class="stat-value" style="color: #ff6b6b;">🛡️</div>
            <div class="stat-label">Protection</div>
          </div>
        </div>
        
        <a href="https://traderedgepro.com/risk-management" class="cta-button" style="background: linear-gradient(45deg, #ff6b6b, #ff8e8e);">
          Review Risk Settings 🛡️
        </a>
      </div>
      
      <div class="message">
        <strong>🚨 Recommended Actions:</strong><br>
        • Review your current positions immediately<br>
        • Check your risk management settings<br>
        • Consider reducing position sizes<br>
        • Contact support if you need assistance
      </div>
      
      <div class="message">
        Remember: Protecting your capital is the #1 priority. When in doubt, reduce risk.
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  // Subscription reminder template
  private getSubscriptionReminderTemplate(name: string, daysUntilExpiry: number, membershipTier: string): string {
    const urgencyColor = daysUntilExpiry <= 3 ? '#ff6b6b' : daysUntilExpiry <= 7 ? '#ffa500' : '#00ffff';
    
    const content = `
      <div class="greeting" style="color: ${urgencyColor};">Subscription Renewal Reminder 📅</div>
      
      <div class="message">
        Hi ${name}, your ${membershipTier.toUpperCase()} membership expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.
      </div>
      
      <div class="highlight-box" style="border-color: ${urgencyColor}33; background: ${urgencyColor}11;">
        <h3 style="color: ${urgencyColor}; margin-bottom: 15px;">⏰ Renewal Required</h3>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value" style="color: ${urgencyColor};">${daysUntilExpiry}</div>
            <div class="stat-label">Days Left</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${urgencyColor};">${membershipTier.toUpperCase()}</div>
            <div class="stat-label">Current Plan</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${urgencyColor};">💎</div>
            <div class="stat-label">Premium Access</div>
          </div>
        </div>
        
        <a href="https://traderedgepro.com/billing" class="cta-button">
          Renew Subscription 🔄
        </a>
      </div>
      
      <div class="message">
        <strong>🎯 Don't Lose Access To:</strong><br>
        • Advanced AI signal generation<br>
        • Multi-account portfolio tracking<br>
        • Priority customer support<br>
        • Exclusive trading strategies<br>
        • Real-time market analysis
      </div>
      
      <div class="message">
        Questions about renewal? Contact our billing team for assistance.
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }
}

export default new EmailService();
