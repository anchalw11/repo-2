import { Ticket, Faq } from './types';

export const tickets: Ticket[] = [
  { id: 1, subject: 'Login Issue', status: 'Open', customer: 'John Doe', lastUpdate: '2023-10-27T10:00:00Z' },
  { id: 2, subject: 'Payment Failed', status: 'In Progress', customer: 'Jane Smith', lastUpdate: '2023-10-27T11:30:00Z' },
  { id: 3, subject: 'Feature Request', status: 'Closed', customer: 'Sam Wilson', lastUpdate: '2023-10-26T15:00:00Z' },
];

export const faqs: Faq[] = [
  { id: 1, question: 'How to reset my password?', answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page.' },
  { id: 2, question: 'What are the payment options?', answer: 'We accept all major credit cards and PayPal.' },
];
