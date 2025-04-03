#!/usr/bin/env python3
"""
Script to check server status, port availability, and running processes
"""
import os
import sys
import logging
import socket
import subprocess
import psutil
import time

# Add the parent directory to sys.path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def check_port_availability(port):
    """Check if a port is available for use"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        
        if result == 0:
            # Port is in use
            return False
        else:
            # Port is available
            return True
    except Exception as e:
        logger.error(f"Error checking port {port}: {e}")
        return False

def find_process_using_port(port):
    """Find the process using a specific port"""
    try:
        # This works on macOS, Linux, and most Unix systems
        output = subprocess.check_output(
            ['lsof', '-i', f':{port}'],
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        lines = output.strip().split('\n')
        if len(lines) > 1:  # First line is header
            processes = []
            for line in lines[1:]:
                parts = line.split()
                if len(parts) >= 2:
                    processes.append({
                        'command': parts[0],
                        'pid': parts[1],
                        'user': parts[2]
                    })
            return processes
        return []
    except subprocess.CalledProcessError:
        # No process found using the port
        return []
    except Exception as e:
        logger.error(f"Error finding process using port {port}: {e}")
        return []

def find_uvicorn_processes():
    """Find all running uvicorn processes"""
    uvicorn_processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            # Check if 'uvicorn' is in the command line
            if proc.info and proc.info['cmdline'] and any('uvicorn' in cmd.lower() for cmd in proc.info['cmdline'] if cmd):
                uvicorn_processes.append({
                    'pid': proc.info['pid'],
                    'name': proc.info['name'],
                    'cmdline': ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    return uvicorn_processes

def check_news_cache_status():
    """Check if news cache files exist and their sizes"""
    data_dir = os.path.join(parent_dir, 'data')
    cache_files = [
        'crypto_news.json',
        'macro_news.json',
        'reddit_posts.json'
    ]
    
    results = {}
    
    for filename in cache_files:
        file_path = os.path.join(data_dir, filename)
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            last_modified = time.ctime(os.path.getmtime(file_path))
            results[filename] = {
                'exists': True,
                'size': f"{file_size/1024:.2f} KB",
                'last_modified': last_modified
            }
        else:
            results[filename] = {
                'exists': False
            }
    
    return results

def main():
    """Main function to check server status"""
    logger.info("Checking server status")
    
    # Check common ports
    ports_to_check = [8000, 8008, 8080, 3000, 5000]
    
    logger.info("Checking port availability:")
    for port in ports_to_check:
        if check_port_availability(port):
            logger.info(f"Port {port} is AVAILABLE for use")
        else:
            logger.info(f"Port {port} is IN USE")
            processes = find_process_using_port(port)
            if processes:
                logger.info(f"Processes using port {port}:")
                for proc in processes:
                    logger.info(f"  - {proc['command']} (PID: {proc['pid']}, User: {proc['user']})")
            else:
                logger.info(f"No process found using port {port} (might be in TIME_WAIT state)")
    
    # Check for uvicorn processes
    uvicorn_processes = find_uvicorn_processes()
    if uvicorn_processes:
        logger.info("\nRunning uvicorn processes:")
        for proc in uvicorn_processes:
            logger.info(f"  - PID: {proc['pid']}, Command: {proc['cmdline']}")
    else:
        logger.info("\nNo uvicorn processes found")
    
    # Check news cache status
    logger.info("\nNews cache status:")
    cache_status = check_news_cache_status()
    for filename, status in cache_status.items():
        if status['exists']:
            logger.info(f"  - {filename}: Size: {status['size']}, Last modified: {status['last_modified']}")
        else:
            logger.info(f"  - {filename}: Does not exist")
    
    logger.info("\nServer status check completed")
    
    # Return suggestions based on findings
    if any(not check_port_availability(port) for port in ports_to_check):
        logger.info("\nSuggestions:")
        logger.info("  - Some ports are in use. Try running the server on a different port.")
        logger.info("  - You might need to restart your computer to clear socket connections in TIME_WAIT state.")
    
    if uvicorn_processes:
        logger.info("  - There are uvicorn processes running. Kill them with: pkill -9 -f uvicorn")
    
    if not all(status['exists'] for status in cache_status.values()):
        logger.info("  - Some news cache files are missing. Run: python3 scripts/refresh_news.py")

if __name__ == "__main__":
    main() 