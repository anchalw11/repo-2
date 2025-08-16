export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface EmailEvent {
  type: 'welcome' | 'account_created' | 'payment_success' | 'password_reset' | 'trading_milestone' | 'risk_alert' | 'subscription_reminder';
  recipientEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}
