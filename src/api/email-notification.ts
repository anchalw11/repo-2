import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail', // You can change this to your preferred email service
  auth: {
    user: 'forex@traderedgepro.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password-here' // Use environment variable
  }
};

// Create transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

interface PaymentNotificationData {
  paymentMethod: 'stripe' | 'paypal' | 'crypto';
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  planName: string;
  paymentId: string;
  transactionHash?: string;
  cryptocurrency?: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}

// Email templates
const getEmailTemplate = (data: PaymentNotificationData, isCustomer: boolean = false) => {
  const { paymentMethod, amount, currency, planName, paymentId, status, timestamp } = data;
  
  if (isCustomer) {
    // Customer confirmation email
    return {
      subject: `Payment ${status === 'completed' ? 'Confirmed' : 'Received'} - ${planName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Payment ${status === 'completed' ? 'Confirmed' : 'Received'}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your purchase</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Payment Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Plan:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${planName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${currency} ${amount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Payment Method:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; text-transform: capitalize;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Payment ID:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-family: monospace; font-size: 12px;">${paymentId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Date:</strong></td>
                  <td style="padding: 10px 0; text-align: right;">${new Date(timestamp).toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            ${status === 'completed' ? `
              <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <strong>✅ Payment Confirmed!</strong><br>
                Your account has been activated and you now have full access to all features.
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://traderedgepro.com/questionnaire" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Get Started →</a>
              </div>
            ` : `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <strong>⏳ Payment Processing</strong><br>
                ${paymentMethod === 'crypto' ? 'Your cryptocurrency payment is being verified. This usually takes 1-24 hours.' : 'Your payment is being processed and will be confirmed shortly.'}
              </div>
            `}
            
            <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
              <p>Need help? Contact us at <a href="mailto:forex@traderedgepro.com">forex@traderedgepro.com</a></p>
              <p style="margin: 20px 0 0 0;">© 2025 TraderEdgePro. All rights reserved.</p>
            </div>
          </div>
        </div>
      `
    };
  } else {
    // Admin notification email
    return {
      subject: `New Payment ${status === 'completed' ? 'Completed' : 'Received'} - ${paymentMethod.toUpperCase()} - $${amount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #343a40; padding: 20px; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">💰 New Payment ${status === 'completed' ? 'Completed' : 'Received'}</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
              <tr style="background: #e9ecef;">
                <th style="padding: 15px; text-align: left; border-bottom: 1px solid #dee2e6;">Field</th>
                <th style="padding: 15px; text-align: left; border-bottom: 1px solid #dee2e6;">Value</th>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>Customer Email</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;">${data.customerEmail || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>Customer Name</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;">${data.customerName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>Plan</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>Amount</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>${currency} ${amount}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>Payment Method</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; text-transform: capitalize;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>Payment ID</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; font-family: monospace; font-size: 12px;">${paymentId}</td>
              </tr>
              ${data.transactionHash ? `
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>Transaction Hash</strong></td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; font-family: monospace; font-size: 12px;">${data.transactionHash}</td>
                </tr>
              ` : ''}
              ${data.cryptocurrency ? `
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>Cryptocurrency</strong></td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;">${data.cryptocurrency}</td>
                </tr>
              ` : ''}
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;"><strong>Status</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6;">
                  <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                    ${status === 'completed' ? 'background: #d4edda; color: #155724;' : 
                      status === 'pending' ? 'background: #fff3cd; color: #856404;' : 
                      'background: #f8d7da; color: #721c24;'}">
                    ${status.toUpperCase()}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 15px;"><strong>Timestamp</strong></td>
                <td style="padding: 12px 15px;">${new Date(timestamp).toLocaleString()}</td>
              </tr>
            </table>
            
            ${status === 'pending' && paymentMethod === 'crypto' ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <strong>⚠️ Action Required:</strong> Cryptocurrency payment requires manual verification.
              </div>
            ` : ''}
          </div>
        </div>
      `
    };
  }
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const paymentData: PaymentNotificationData = request.body;

  // Validate required fields
  if (!paymentData.paymentMethod || !paymentData.amount || !paymentData.planName || !paymentData.paymentId) {
    return response.status(400).json({ 
      error: 'Missing required fields: paymentMethod, amount, planName, paymentId' 
    });
  }

  try {
    const emailPromises = [];

    // Send admin notification
    const adminTemplate = getEmailTemplate(paymentData, false);
    emailPromises.push(
      transporter.sendMail({
        from: `"TraderEdgePro Payments" <forex@traderedgepro.com>`,
        to: 'forex@traderedgepro.com',
        subject: adminTemplate.subject,
        html: adminTemplate.html
      })
    );

    // Send customer confirmation if email is provided
    if (paymentData.customerEmail) {
      const customerTemplate = getEmailTemplate(paymentData, true);
      emailPromises.push(
        transporter.sendMail({
          from: `"TraderEdgePro" <forex@traderedgepro.com>`,
          to: paymentData.customerEmail,
          subject: customerTemplate.subject,
          html: customerTemplate.html
        })
      );
    }

    // Send all emails
    await Promise.all(emailPromises);

    return response.status(200).json({
      success: true,
      message: 'Email notifications sent successfully',
      emailsSent: emailPromises.length
    });

  } catch (error) {
    console.error('Email notification error:', error);
    return response.status(500).json({
      error: 'Failed to send email notifications',
      details: (error as any).message
    });
  }
}
