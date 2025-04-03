from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Dict, List, Any
from ..services.ai.openai_service import OpenAIService

router = APIRouter()
openai_service = OpenAIService()

@router.post("/chat")
async def chat_endpoint(message: str = Body(...)):
    """
    Chat endpoint for AI interactions
    """
    try:
        response = await openai_service.process_chat(message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_ai(query: str):
    """
    Query the AI assistant with a specific question about the portfolio
    """
    try:
        response = await openai_service.query_ai(query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analyze/{asset_symbol}")
async def analyze_asset(asset_symbol: str):
    """
    Get AI analysis for a specific asset
    """
    try:
        # Use process_chat with a specific asset analysis prompt
        response = await openai_service.process_chat(f"Analyze the cryptocurrency {asset_symbol}. What is its current price, trends, market position, and future prospects?")
        return {"analysis": response["text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights")
async def get_insights():
    """
    Get AI-generated insights about the portfolio
    """
    try:
        # Use process_chat with a portfolio insights prompt
        response = await openai_service.process_chat("Analyze my portfolio. Provide insights on performance, diversification, risks, and opportunities for optimization.")
        return {"insights": response["text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 