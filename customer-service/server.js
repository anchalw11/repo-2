require('dotenv').config({ path: './customer-service/.env' });
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { listenForEmails } = require('./services/emailService');
const { configureWebRTC } = require('./services/webrtcService');

const PORT = process.env.CS_API_PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database Connection
mongoose.connect(process.env.CS_DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Customer service database connected'))
.catch(err => console.error('Database connection error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));
app.use('/api/upload', require('./routes/upload'));


// WebSocket Connection
io.on('connection', (socket) => {
    console.log('A user connected to the customer service dashboard');

    // Agent status
    socket.on('agentStatus', (data) => {
        socket.broadcast.emit('agentStatus', data);
    });

    // New chat notification
    socket.on('newChat', (data) => {
        io.emit('newChat', data);
    });

    // Live message delivery
    socket.on('sendMessage', (message) => {
        io.to(message.conversation_id).emit('receiveMessage', message);
    });

    // Typing indicators
    socket.on('typing', (data) => {
        socket.broadcast.to(data.conversation_id).emit('typing', data);
    });

    // Join conversation room
    socket.on('joinConversation', (conversation_id) => {
        socket.join(conversation_id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Customer service server running on port ${PORT}`);
    listenForEmails();
    configureWebRTC(io);
});
