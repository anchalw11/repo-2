#!/usr/bin/env python3
import os
import subprocess
import signal
import sys
import time
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

processes = []

def signal_handler(sig, frame):
    logger.info('Stopping all services...')
    for p in processes:
        try:
            # Send SIGTERM to the process group to ensure all child processes are terminated
            os.killpg(os.getpgid(p.pid), signal.SIGTERM)
        except (ProcessLookupError, OSError):
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def kill_process_on_port(port):
    """Kill any process running on the specified port"""
    try:
        result = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
        pids = result.stdout.strip().split('\n')
        for pid in pids:
            if pid:
                logger.info(f"Killing process {pid} on port {port}")
                os.kill(int(pid), signal.SIGKILL)
    except Exception as e:
        logger.warning(f"Error killing process on port {port}: {e}")

def setup_environment():
    """Set up the production environment"""
    logger.info("Setting up production environment...")
    
    # Create necessary directories
    os.makedirs('instance', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    
    # Set environment variables for production
    os.environ['FLASK_ENV'] = 'production'
    os.environ['NODE_ENV'] = 'production'
    
    # Kill existing processes on required ports
    ports_to_clear = [5000, 5005, 5008, 5010, 5175]
    for port in ports_to_clear:
        kill_process_on_port(port)

def build_frontend():
    """Build the frontend application for production"""
    logger.info("Building frontend for production...")
    try:
        # Install dependencies if needed
        if not os.path.exists('node_modules'):
            logger.info("Installing frontend dependencies...")
            subprocess.run(['npm', 'install'], check=True)
        
        # Build the frontend
        subprocess.run(['npm', 'run', 'build'], check=True)
        logger.info("Frontend built successfully.")
        
        # Verify build directory exists
        if not os.path.exists('dist'):
            raise Exception("Build directory 'dist' not found after build")
            
    except subprocess.CalledProcessError as e:
        logger.error(f"Error building frontend: {e}")
        sys.exit(1)

