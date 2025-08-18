#!/bin/bash

# Check if the production backend is accessible
if curl -s -o /dev/null -w "%{http_code}" https://traderedgepro.com/api/auth/register | grep -q "503"; then
  echo "Production backend is down (503 error). Using local backend for development."
  # Update the frontend to use local backend
  echo "VITE_API_URL=http://localhost:5000/api" > .env.local
else
  echo "Production backend is responding. Using production backend."
  echo "VITE_API_URL=https://traderedgepro.com/api" > .env.local
fi

# Build the frontend with the appropriate backend URL
npm run build
