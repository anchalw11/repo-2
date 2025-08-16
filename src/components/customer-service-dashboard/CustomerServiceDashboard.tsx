import React from 'react';
import { tickets, faqs } from './data';
import { Ticket, Faq } from './types';
import './styles.css';

const CustomerServiceDashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <h1>Customer Service Dashboard</h1>

      <div className="tickets-section">
        <h2>Active Tickets</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket: Ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.subject}</td>
                <td>{ticket.customer}</td>
                <td>{ticket.status}</td>
                <td>{ticket.lastUpdate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <ul>
          {faqs.map((faq: Faq) => (
            <li key={faq.id}>
              <strong>{faq.question}</strong>
              <p>{faq.answer}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CustomerServiceDashboard;
