const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import models
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const Ticket = require('../models/ticket');
const Customer = require('../models/customer');
const { searchKnowledgeBase } = require('../services/knowledgeBaseService');
const { getChatbotResponse } = require('../services/chatbotService');

// @route   GET api/chats
// @desc    Get all active chats
router.get('/chats', auth, async (req, res) => {
    try {
        const chats = await Conversation.find({ status: 'Active' }).populate('customer_id', ['name', 'email']);
        res.json(chats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/messages
// @desc    Send a message
router.post('/messages', auth, async (req, res) => {
    try {
        const { conversation_id, sender_type, sender_id, message } = req.body;
        const newMessage = new Message({
            conversation_id,
            sender_type,
            sender_id,
            message,
        });
        const savedMessage = await newMessage.save();
        res.json(savedMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/:chatId
// @desc    Get chat history
router.get('/messages/:chatId', auth, async (req, res) => {
    try {
        const messages = await Message.find({ conversation_id: req.params.chatId }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tickets/:id
// @desc    Update ticket status
router.put('/tickets/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/customers/:id
// @desc    Get customer details
router.get('/customers/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        res.json(customer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/transfer
// @desc    Transfer chat to another agent
router.post('/transfer', auth, async (req, res) => {
    try {
        const { conversation_id, new_agent_id } = req.body;
        const conversation = await Conversation.findByIdAndUpdate(conversation_id, { agent_id: new_agent_id }, { new: true });
        res.json(conversation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/knowledge-base
// @desc    Search knowledge base
router.get('/knowledge-base', auth, (req, res) => {
    try {
        const { query } = req.query;
        const results = searchKnowledgeBase(query);
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/chatbot
// @desc    Get a response from the chatbot
router.post('/chatbot', (req, res) => {
    try {
        const { message } = req.body;
        const response = getChatbotResponse(message);
        res.json({ response });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
