const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-jwt-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://main.d2at8owu9hshr.amplifyapp.com'],
  credentials: true
}));
app.use(express.json());

// Simple file-based storage (replace with real database in production)
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Helper functions
const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Routes
app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, plan_type } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    if (password.length < 12) {
      return res.status(400).json({ msg: 'Password must be at least 12 characters long' });
    }

    // Check if user already exists
    const users = readUsers();
    const existingUser = users.find(user => user.email === email);
    
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      plan_type: plan_type || 'professional',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Save user
    users.push(newUser);
    writeUsers(users);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        name: `${firstName} ${lastName}`
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.status(201).json({
      message: 'User registered successfully',
      access_token: token,
      user: {
        id: newUser.id,
        name: `${firstName} ${lastName}`,
        email: newUser.email,
        plan_type: newUser.plan_type
      }
    });

    console.log(`✅ New user registered: ${email}`);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      access_token: token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        plan_type: user.plan_type
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// Get all users (for debugging)
app.get('/api/users', (req, res) => {
  const users = readUsers();
  const safeUsers = users.map(user => ({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    plan_type: user.plan_type,
    createdAt: user.createdAt
  }));
  res.json(safeUsers);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local backend server running on http://localhost:${PORT}`);
  console.log(`📝 Users data stored in: ${USERS_FILE}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/auth/test`);
});
