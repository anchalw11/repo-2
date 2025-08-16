const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());

// Store trade data in memory for this example
const trades = {
  '1': {
    id: '1',
    symbol: 'EUR/USD',
    entryPrice: 1.085,
    stopLoss: 1.08,
    takeProfit: 1.095,
    status: 'active',
    messages: [
      { id: 1, text: "Welcome to your guided trade! We're watching EUR/USD closely.", timestamp: new Date().toISOString(), sender: 'mentor' },
      { id: 2, text: "The trade is currently active. Price is holding steady around the entry point.", timestamp: new Date().toISOString(), sender: 'mentor' },
    ]
  }
};

app.get('/api/trades/:tradeId', (req, res) => {
  const { tradeId } = req.params;
  const trade = trades[tradeId];
  if (trade) {
    res.json(trade);
  } else {
    res.status(404).json({ message: 'Trade not found' });
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('joinTradeRoom', (tradeId) => {
    socket.join(tradeId);
    console.log(`User joined room for trade ${tradeId}`);
  });

  socket.on('sendMessage', async ({ tradeId, message }) => {
    const trade = trades[tradeId];
    if (!trade) {
      return;
    }

    // Add user message to chat
    const userMessage = { text: message, timestamp: new Date().toISOString(), sender: 'user' };
    trade.messages.push(userMessage);
    userMessage.id = trade.messages.length;
    io.to(tradeId).emit('newMessage', userMessage);

    // Get AI response
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const chat = model.startChat({
        history: trade.messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })),
        generationConfig: {
          maxOutputTokens: 200,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const aiText = response.text();

      const aiMessage = { text: aiText, timestamp: new Date().toISOString(), sender: 'mentor' };
      trade.messages.push(aiMessage);
      aiMessage.id = trade.messages.length;
      io.to(tradeId).emit('newMessage', aiMessage);

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = { text: "Sorry, I'm having trouble analyzing the trade right now.", timestamp: new Date().toISOString(), sender: 'mentor' };
      trade.messages.push(errorMessage);
      errorMessage.id = trade.messages.length;
      io.to(tradeId).emit('newMessage', errorMessage);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Trade mentor service listening on port ${PORT}`);
});
