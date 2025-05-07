"""
Social media API endpoints module
"""
from fastapi import APIRouter

# Create parent router
router = APIRouter(prefix="/social", tags=["Social Media"])

# Export the router
__all__ = ["router"] 