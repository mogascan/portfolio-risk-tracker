"""
Application settings.
"""
import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv # type: ignore

# Load environment variables from .env file
load_dotenv()

# OpenAI API settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")

# CoinGecko API settings
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY") or None

# Ethereum settings
ETHEREUM_RPC_URL = os.getenv("ETHEREUM_RPC_URL", "")
ETH_WALLET_ADDRESSES = os.getenv("ETH_WALLET_ADDRESSES", "")

# App settings
APP_NAME = "Crypto Portfolio Tracker"
APP_VERSION = "1.2.0"
ENV = os.getenv("ENV", "development")
DEBUG = ENV != "production"

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Make sure these directories exist
os.makedirs(DATA_DIR, exist_ok=True)

# Function to get settings as a dict
def get_settings() -> Dict[str, Any]:
    """Return all settings as a dictionary"""
    return {
        "app_name": APP_NAME,
        "app_version": APP_VERSION,
        "env": ENV,
        "debug": DEBUG,
        "log_level": LOG_LEVEL,
        "openai_model": OPENAI_MODEL,
        "has_openai_key": bool(OPENAI_API_KEY),
        "base_dir": BASE_DIR,
        "data_dir": DATA_DIR,
    } 