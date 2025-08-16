import type { VercelRequest, VercelResponse } from '@vercel/node';
import paypal from '@paypal/checkout-server-sdk';

// PayPal environment setup
const environment = new paypal.core.SandboxEnvironment(
  'ASUvkAyi9hd0D6xgfR9LgBvXWcsOg4spZd05tprIE3LNW1RyQXmzJfaHTO908qTlpmljK2qcuM7xx8xW',
  'EK3TSSwjQny6zybyX5Svwokawg9dhq1MdJd_AzpRanhaGrxLx0P6eqpWKewkVzINe2vpVRZFz4u9g-qr'
);

const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'POST') {
    const { amount, currency = 'USD' } = request.body;

    if (!amount) {
      return response.status(400).json({ error: 'Amount is required' });
    }

    try {
      // Create PayPal order
      const orderRequest = new paypal.orders.OrdersCreateRequest();
      orderRequest.prefer('return=representation');
      orderRequest.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toString()
          }
        }]
      });

      const order = await client.execute(orderRequest);
      
      return response.status(200).json({
        orderID: order.result.id,
        status: order.result.status
      });

    } catch (error) {
      console.error('PayPal order creation error:', error);
      return response.status(500).json({ 
        error: 'Failed to create PayPal order',
        details: (error as any).message 
      });
    }
  }

  if (request.method === 'PUT') {
    // Capture PayPal payment
    const { orderID } = request.body;

    if (!orderID) {
      return response.status(400).json({ error: 'Order ID is required' });
    }

    try {
      const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
      const capture = await client.execute(captureRequest);
      
      // Verify exact amount
      const capturedAmount = parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value);
      const expectedAmount = parseFloat(request.body.expectedAmount);

      if (Math.abs(capturedAmount - expectedAmount) > 0.01) {
        return response.status(400).json({
          error: 'Payment amount mismatch',
          expected: expectedAmount,
          received: capturedAmount
        });
      }

      return response.status(200).json({
        orderID: capture.result.id,
        status: capture.result.status,
        amount: capturedAmount,
        paymentID: capture.result.purchase_units[0].payments.captures[0].id
      });

    } catch (error) {
      console.error('PayPal capture error:', error);
      return response.status(500).json({ 
        error: 'Failed to capture PayPal payment',
        details: (error as any).message 
      });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
