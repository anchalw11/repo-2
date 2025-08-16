#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

load_dotenv('.env')
os.environ['FLASK_ENV'] = 'production'

from journal import create_production_app

application = create_production_app()
