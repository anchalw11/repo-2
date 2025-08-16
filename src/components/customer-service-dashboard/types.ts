export interface Ticket {
  id: number;
  subject: string;
  status: 'Open' | 'In Progress' | 'Closed';
  customer: string;
  lastUpdate: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
}
