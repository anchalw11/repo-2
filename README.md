# Trading Journal Application - Backend

This document provides instructions for deploying and running the backend of the Trading Journal application.

## 1. Backend Deployment

To set up the backend for production, run the deployment script:

```bash
python3 deploy_backend.py
```

This script will:
- Set up the production environment variables.
- Install all required Python dependencies.
- Create and initialize the production database.
- Generate a `wsgi.py` file for use with Gunicorn.

## 2. Running the Backend in Production

After running the deployment script, you can start the backend server using Gunicorn:

```bash
gunicorn --bind 0.0.0.0:5000 wsgi:application
```

For better performance, you can run Gunicorn with multiple workers:

```bash
gunicorn --workers 4 --bind 0.0.0.0:5000 wsgi:application
```

The backend will be available at `http://localhost:5000`.

## 3. Configuration

### Environment Variables

The backend configuration is managed through the `.env.production` file. Key variables include:

- `SECRET_KEY`: A secret key for signing session data.
- `JWT_SECRET_KEY`: A secret key for signing JWT tokens.
- `DATABASE_URL`: The connection string for the database. Defaults to SQLite.
- `CORS_ORIGINS`: A comma-separated list of allowed origins for CORS.

### Database

The application uses SQLite by default in production. The database file is located at `instance/production.db`.

To use a different database (e.g., PostgreSQL), update the `DATABASE_URL` in the `.env.production` file.

## 4. Summary of Fixes

This version of the backend includes the following fixes:

- **Error 405 (Method Not Allowed)**: All relevant API endpoints now correctly handle CORS preflight (OPTIONS) requests.
- **Database Configuration**: The application now includes robust validation for the database connection string to prevent parsing errors.
- **Deployment Script**: A new, simplified deployment script (`deploy_backend.py`) is provided to ensure a reliable and error-free setup.
- **Error Handling**: The application's entry point now includes enhanced error handling to provide clearer feedback on configuration issues.

The backend is now stable and ready for production deployment.
