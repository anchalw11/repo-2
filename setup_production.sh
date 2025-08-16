#!/bin/bash

# Production Setup Script

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Helper Functions ---
function install_node_dependencies() {
  local service_dir=$1
  echo "--- Installing Node.js dependencies for $service_dir ---"
  if [ -f "$service_dir/package.json" ]; then
    (cd "$service_dir" && npm install --production)
  else
    echo "No package.json found in $service_dir, skipping."
  fi
}

function install_python_dependencies() {
  local service_dir=$1
  echo "--- Installing Python dependencies for $service_dir ---"
  if [ -f "$service_dir/requirements.txt" ]; then
    python3 -m venv "$service_dir/venv"
    source "$service_dir/venv/bin/activate"
    pip install -r "$service_dir/requirements.txt"
    deactivate
  else
    echo "No requirements.txt found in $service_dir, skipping."
  fi
}

# --- Main Setup ---
echo "🚀 Starting production setup..."

# 1. Install root Node.js dependencies and build frontend
echo "--- Installing root dependencies and building frontend ---"
npm install --production
npm run build

# 2. Install dependencies for all Node.js microservices
install_node_dependencies "customer-service"
install_node_dependencies "lot_size_calculator"
install_node_dependencies "signal_generator"
install_node_dependencies "trade_mentor_service"
install_node_dependencies "trading-signal-bot"
install_node_dependencies "chart_analyzer_feature"

# 3. Install dependencies for all Python microservices
install_python_dependencies "forex_data_service"
install_python_dependencies "journal"

echo "🎉 Production setup complete!"
echo "Next steps:"
echo "1. Create a .env.production file with your production secrets."
echo "2. Use a process manager (like PM2 or Gunicorn) or Docker to run the services in production."
