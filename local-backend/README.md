# TraderEdge Pro Local Backend

This is a local Node.js backend server that provides authentication endpoints for your TraderEdge Pro application.

## Features

- User registration with password hashing
- JWT token authentication
- File-based user storage (users.json)
- CORS enabled for frontend integration
- Input validation and error handling

## Quick Start

1. **Install dependencies:**
   ```bash
   cd local-backend
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Server will run on:** `http://localhost:5000`

## API Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "plan_type": "professional"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "access_token": "jwt_token_here",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "plan_type": "professional"
  }
}
```

### POST /api/auth/login
Login with existing credentials.

### GET /api/auth/test
Test if the backend is running.

### GET /api/users
View all registered users (for debugging).

## Data Storage

User data is stored in `users.json` file in the same directory. Passwords are hashed using bcrypt.

## Security Notes

- Change JWT_SECRET in production
- Replace file storage with proper database
- Add rate limiting for production use
- Implement proper session management

## Integration

Your frontend is already configured to use this local backend. Just start the server and your signup page will work!
