const nodemailer = require('nodemailer');
const Ticket = require('../models/ticket');
const Conversation = require('../models/conversation');
const Customer = require('../models/customer');

const transporter = nodemailer.createTransport({
    // Configure your email transport options here
    // For example, using SMTP
    host: process.env.CS_EMAIL_HOST,
    port: process.env.CS_EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.CS_EMAIL_USER,
        pass: process.env.CS_EMAIL_PASS,
    },
});

const listenForEmails = () => {
    // This is a simplified example. In a real application, you would use a library like 'imap' to listen for incoming emails.
    // For this example, we'll simulate receiving an email every 30 seconds.
    setInterval(async () => {
        // Simulate receiving an email
        const email = {
            from: 'customer@example.com',
            subject: 'Help with my account',
            text: 'I am having trouble logging into my account.',
        };

        // Check if a customer with this email exists
        let customer = await Customer.findOne({ email: email.from });
        if (!customer) {
            customer = new Customer({
                name: email.from.split('@')[0],
                email: email.from,
            });
            await customer.save();
        }

        // Create a new conversation
        const conversation = new Conversation({
            customer_id: customer._id,
            priority: 'Medium',
        });
        await conversation.save();

        // Create a new ticket
        const ticket = new Ticket({
            conversation_id: conversation._id,
            category: 'Account',
            priority: 'Medium',
        });
        await ticket.save();

        console.log('New ticket created from email:', email.subject);
    }, 30000);
};

module.exports = {
    listenForEmails,
};
