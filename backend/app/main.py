"""
Main FastAPI application entry point
"""
from fastapi import FastAPI, Request # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from fastapi.staticfiles import StaticFiles # type: ignore
import os
import logging
from datetime import datetime
import time
from dotenv import load_dotenv # type: ignore

# Import API routers
from app.api.v1.market import router as market_router, get_market_service
from app.api.v1.news import router as news_router
from app.api.v1.ai import router as ai_router
from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.social import router as social_router

# Import services for direct initialization
from app.services.news import crypto_news_service, macro_news_service, reddit_service

# Load environment variables
load_dotenv()

# Configure logging
from app.core.logging import setup_logging
logger = setup_logging()

# Initialize FastAPI app
app = FastAPI(
    title="Crypto Portfolio Tracker API",
    description="API for managing cryptocurrency portfolio and market data",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files if the directory exists
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include API routers with version prefix
app.include_router(market_router, prefix="/api/v1", tags=["Market Data"])
app.include_router(news_router, prefix="/api/v1", tags=["News"])
app.include_router(ai_router, prefix="/api/v1", tags=["AI Analysis"])
app.include_router(portfolio_router, prefix="/api/v1", tags=["Portfolio"])
app.include_router(social_router, prefix="/api/v1", tags=["Social Media"])

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and their processing time"""
    start_time = time.time()
    
    # Get client IP and request details
    client_host = request.client.host if request.client else "unknown"
    method = request.method
    url = request.url.path
    
    logger.info(f"Request started: {method} {url} from {client_host}")
    
    # Process the request
    response = await call_next(request)
    
    # Calculate and log processing time
    process_time = time.time() - start_time
    logger.info(f"Request completed: {method} {url} - Status: {response.status_code} - Time: {process_time:.4f}s")
    
    return response

@app.on_event("startup")
async def startup_event():
    """Initialize services and start background tasks on startup"""
    try:
        # Start the market data service
        logger.info("Starting market data service")
        from app.services.market.market_data_service import MarketDataService
        
        # Get the singleton instance
        market_service = get_market_service()
        # Start the update loop
        market_service._start_update_loop()
        
        # Start the news services
        logger.info("Starting news services from main application")
        
        try:
            # Start crypto news service
            logger.info("Attempting to start crypto news service")
            if not crypto_news_service.is_running():
                logger.info("Starting crypto news service")
                crypto_news_service.start_update_thread()
            else:
                logger.info("Crypto news service already running")
        except Exception as e:
            logger.error(f"Error starting crypto news service: {str(e)}")
            # Continue with other services
            
        try:
            # Start macro news service
            logger.info("Attempting to start macro news service")
            if not macro_news_service.is_running():
                logger.info("Starting macro news service")
                macro_news_service.start_update_thread()
            else:
                logger.info("Macro news service already running")
        except Exception as e:
            logger.error(f"Error starting macro news service: {str(e)}")
            # Continue with other services
            
        try:
            # Start reddit service
            logger.info("Attempting to start reddit service")
            if not reddit_service.is_running():
                logger.info("Starting reddit service")
                reddit_service.start_update_thread()
            else:
                logger.info("Reddit service already running")
        except Exception as e:
            logger.error(f"Error starting reddit service: {str(e)}")
            # Continue with other services
        
        # Skip the initial feed update to avoid blocking startup
        logger.info("Skipping initial feed update during startup to avoid blocking")
        logger.info("Use the refresh_news.py script to manually update feeds")
        
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        # Continue startup process even if there's an error
        # This avoids a completely failed server startup

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        # Stop the news services
        logger.info("Stopping news services")
        
        if crypto_news_service.is_running():
            crypto_news_service.stop_update_thread()
            
        if macro_news_service.is_running():
            macro_news_service.stop_update_thread()
            
        if reddit_service.is_running():
            reddit_service.stop_update_thread()
            
        logger.info("Application shutting down")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")
        raise

@app.get("/")
async def read_root():
    """Root endpoint"""
    return {
        "message": "Crypto Portfolio Tracker API is running",
        "version": "1.0.0",
        "docs_url": "/api/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": True
        }
    }