#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Start Gunicorn
# --bind 0.0.0.0:8080: Listen on all network interfaces on port 8080.
# --workers 4: Use 4 worker processes to handle requests.
# --log-level info: Set the logging level to info.
# wsgi_production:application: Point Gunicorn to the 'application' object in the 'wsgi_production.py' file.
echo "Starting Gunicorn..."
PORT=${PORT:-8080}
echo "Binding to port ${PORT}"
gunicorn --bind 0.0.0.0:${PORT} --workers 4 --log-level info "wsgi_production:application"
