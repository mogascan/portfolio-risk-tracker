"""
Centralized logging configuration for the application
"""
import logging
import os
import sys
from logging.handlers import RotatingFileHandler

def setup_logging(log_to_console=True, log_to_file=True, log_level=logging.INFO):
    """
    Set up logging configuration for the application
    
    Args:
        log_to_console: If True, logs will be output to console
        log_to_file: If True, logs will be saved to file
        log_level: Logging level (default: INFO)
        
    Returns:
        Logger: Configured logger instance
    """
    # Create logs directory if it doesn't exist
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    
    # Configure the root logger
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # Clear existing handlers to avoid duplicate logs
    if logger.handlers:
        logger.handlers.clear()
    
    # Create formatters
    standard_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Create console handler if enabled
    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(standard_formatter)
        logger.addHandler(console_handler)
    
    # Create file handlers if enabled
    if log_to_file:
        # Main API log file - rotating file handler (10MB max, keep 5 backups)
        api_log_path = os.path.join(logs_dir, "api.log")
        api_file_handler = RotatingFileHandler(
            api_log_path, maxBytes=10*1024*1024, backupCount=5
        )
        api_file_handler.setFormatter(standard_formatter)
        logger.addHandler(api_file_handler)
        
        # Error log with higher level for important alerts
        error_log_path = os.path.join(logs_dir, "error.log")
        error_file_handler = RotatingFileHandler(
            error_log_path, maxBytes=10*1024*1024, backupCount=5
        )
        error_file_handler.setLevel(logging.ERROR)
        error_file_handler.setFormatter(standard_formatter)
        logger.addHandler(error_file_handler)
        
        # Background tasks logs
        background_log_path = os.path.join(logs_dir, "background.log")
        background_handler = RotatingFileHandler(
            background_log_path, maxBytes=10*1024*1024, backupCount=5
        )
        background_handler.setFormatter(standard_formatter)
        background_logger = logging.getLogger('background')
        background_logger.addHandler(background_handler)
    
    return logger

def get_logger(name):
    """Get a named logger instance"""
    return logging.getLogger(name) 