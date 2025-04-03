#!/usr/bin/env python3
"""
Minimal server script for testing core functionality without all background services
"""
import os
import sys
import logging
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

# Add the parent directory to sys.path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Crypto Portfolio Tracker Minimal API",
    description="Minimal API for testing core functionality",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": True
        }
    }

@app.get("/api/v1/ai/health")
async def ai_health_check():
    """AI service health check endpoint"""
    return {
        "status": "ok",
        "api_key_configured": True,
        "client_initialized": True,
        "models_available": ["gpt-4-turbo-preview", "gpt-3.5-turbo"],
        "timestamp": datetime.now().isoformat(),
        "port": 5000
    }

# Minimal AI chat endpoint
@app.post("/api/v1/ai/chat")
async def minimal_chat(request: dict):
    """Minimal AI chat endpoint that returns a static response"""
    message = request.get("message", "")
    context = request.get("context", {})
    
    logger.info(f"Received chat request: {message[:50]}...")
    
    # Check for news data in context
    has_news = "news" in context and isinstance(context["news"], dict) and len(context["news"]) > 0
    
    # Return a static response
    if "news" in message.lower() or "headlines" in message.lower():
        return {
            "message": (
                "Based on the latest news, Bitcoin has been experiencing significant price volatility. "
                "Recent headlines mention increased institutional adoption, regulatory developments, "
                "and market sentiment shifts. Several major companies have announced Bitcoin treasury reserves, "
                "and there are ongoing discussions about spot ETFs and their impact on the market. "
                "The overall sentiment in the crypto market has been mixed, with both bullish and bearish indicators."
            ),
            "timestamp": datetime.now().isoformat()
        }
    else:
        return {
            "message": (
                f"I received your message about: '{message[:50]}...'\n\n"
                f"This is a minimal test server response. In a full server environment, "
                f"this would be processed by the OpenAI API with complete context.\n\n"
                f"Context data received: {len(str(context))} characters"
                f"{' (including news data)' if has_news else ' (no news data)'}"
            ),
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Run the minimal server"""
    logger.info("Starting minimal server for testing")
    
    # Parse command line arguments for port
    import argparse
    parser = argparse.ArgumentParser(description="Run a minimal server for testing")
    parser.add_argument("--port", type=int, default=5000, help="Port to run the server on")
    args = parser.parse_args()
    
    # Run the server
    logger.info(f"Server will run on port {args.port}")
    uvicorn.run(app, host="127.0.0.1", port=args.port)

if __name__ == "__main__":
    main() 