from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Dict, Optional
import logging
from datetime import datetime, timedelta

# In a real application, use proper JWT logic
# import jwt
# from app.core.security import verify_password, get_password_hash
# from app.dependencies import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

# Mock user data for development
MOCK_USERS = {
    "demo@example.com": {
        "id": 1,
        "email": "demo@example.com",
        "name": "Demo User",
        "hashed_password": "mock_hashed_password",  # In real app, use proper hashing
        "is_active": True
    }
}

@router.post("/login")
async def login(
    credentials: Dict[str, str] = Body(...)
):
    """
    Authenticate user and return access token
    """
    try:
        email = credentials.get("email")
        password = credentials.get("password")
        
        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing email or password"
            )
        
        # In a real application, you would validate credentials against a database
        # and use proper password hashing/verification
        
        # For MVP, accept any credentials
        user = MOCK_USERS.get(email, {
            "id": 1,
            "email": email,
            "name": "Demo User",
            "is_active": True
        })
        
        # Generate access token (in a real app, use proper JWT)
        token = f"mock_token_{user['id']}_{int(datetime.utcnow().timestamp())}"
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"]
            }
        }
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/register")
async def register(
    user_data: Dict[str, str] = Body(...)
):
    """
    Register a new user
    """
    try:
        email = user_data.get("email")
        password = user_data.get("password")
        name = user_data.get("name")
        
        if not email or not password or not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields"
            )
        
        # In a real application, you would check if the email is already registered
        # and store the new user in a database with a properly hashed password
        
        # For MVP, just return success
        new_user = {
            "id": len(MOCK_USERS) + 1,
            "email": email,
            "name": name,
            "is_active": True
        }
        
        return {
            "success": True,
            "user": {
                "id": new_user["id"],
                "email": new_user["email"],
                "name": new_user["name"]
            }
        }
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/me")
async def get_current_user_info():
    """
    Get current user information based on token
    For MVP, return a mock user
    In a real application, use the get_current_user dependency
    """
    try:
        # Mock user info
        user = {
            "id": 1,
            "email": "demo@example.com",
            "name": "Demo User",
            "is_active": True
        }
        
        return user
    
    except Exception as e:
        logger.error(f"Error getting user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/logout")
async def logout():
    """
    Logout current user
    For MVP, there's no real token invalidation
    In a real application, you would add the token to a blacklist
    """
    return {"success": True}