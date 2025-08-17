# First stage: Build the frontend
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY trading-journal-frontend/package*.json ./
RUN npm install
COPY trading-journal-frontend/ .
# Set environment to production for build
ENV NODE_ENV=production
RUN npm run build

# Second stage: Build the Python backend
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=wsgi:application \
    FLASK_ENV=production \
    FLASK_DEBUG=0 \
    PORT=8080 \
    PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Install supervisor
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Create necessary directories
RUN mkdir -p /app/instance /app/static /var/log/

# Copy the built frontend from the first stage
COPY --from=frontend-builder /app/frontend/dist/ /app/static/

# Copy the backend application code
COPY . /app

# Install dependencies for each service
RUN pip install --no-cache-dir -r /app/forex_data_service/requirements.txt
RUN npm install --prefix /app/customer-service
RUN npm install --prefix /app/trade_mentor_service

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set proper permissions
RUN chmod -R a+rwx /app

# Create a non-root user and switch to it
RUN useradd -m myuser && chown -R myuser:myuser /app
USER myuser

# Expose the port the app runs on
EXPOSE 8080 3001 3002 5001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/auth/test || exit 1

# Command to run the application
CMD ["/usr/bin/supervisord"]
