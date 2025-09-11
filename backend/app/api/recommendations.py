from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
from app.models.schemas import Recommendation, RecommendationCreate
from app.utils.database import get_supabase

router = APIRouter()

@router.get("/", response_model=List[Recommendation])
async def get_recommendations(
    date: Optional[date] = Query(None, description="Filter by recommendation date"),
    market: Optional[str] = Query(None, description="Filter by market (US or KR)"),
    limit: int = Query(20, description="Maximum number of recommendations to return")
):
    """Get stock recommendations"""
    try:
        supabase = get_supabase()
        
        # Use today's date if not specified
        if date is None:
            date = datetime.now().date()
        
        query = supabase.table('recommendations').select('*, stocks(*)')
        
        if date:
            query = query.eq('recommended_date', date.isoformat())
        
        if market:
            query = query.eq('stocks.market', market)
        
        response = query.order('score', desc=True).limit(limit).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendations: {str(e)}")

@router.get("/today", response_model=List[Recommendation])
async def get_todays_recommendations(
    market: Optional[str] = Query(None, description="Filter by market (US or KR)"),
    limit: int = Query(20, description="Maximum number of recommendations to return")
):
    """Get today's stock recommendations"""
    try:
        supabase = get_supabase()
        
        today = datetime.now().date()
        
        query = supabase.table('recommendations').select('*, stocks(*)').eq('recommended_date', today.isoformat())
        
        if market:
            query = query.eq('stocks.market', market)
        
        response = query.order('score', desc=True).limit(limit).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch today's recommendations: {str(e)}")

@router.get("/{recommendation_id}", response_model=Recommendation)
async def get_recommendation(recommendation_id: int):
    """Get a specific recommendation"""
    try:
        supabase = get_supabase()
        response = supabase.table('recommendations').select('*, stocks(*)').eq('id', recommendation_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendation {recommendation_id}: {str(e)}")

@router.post("/", response_model=Recommendation)
async def create_recommendation(recommendation: RecommendationCreate):
    """Create a new recommendation"""
    try:
        supabase = get_supabase()
        response = supabase.table('recommendations').insert(recommendation.dict()).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create recommendation")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create recommendation: {str(e)}")

@router.get("/stock/{ticker}", response_model=List[Recommendation])
async def get_stock_recommendations(
    ticker: str,
    days: int = Query(30, description="Number of days of recommendations to return")
):
    """Get recommendations for a specific stock"""
    try:
        supabase = get_supabase()
        
        # Get stock ID
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        if not stock_response.data:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
        
        stock_id = stock_response.data[0]['id']
        
        # Get recommendations
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        response = supabase.table('recommendations').select('*, stocks(*)').eq('stock_id', stock_id).gte('recommended_date', start_date.isoformat()).order('recommended_date', desc=True).execute()
        
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendations for {ticker}: {str(e)}")

@router.get("/top/{market}")
async def get_top_recommendations(
    market: str,
    limit: int = Query(10, description="Number of top recommendations to return")
):
    """Get top recommendations for a specific market"""
    try:
        supabase = get_supabase()
        
        # Get today's top recommendations for the market
        today = datetime.now().date()
        
        response = supabase.table('recommendations').select('*, stocks(*)').eq('recommended_date', today.isoformat()).eq('stocks.market', market).order('score', desc=True).limit(limit).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch top recommendations for {market}: {str(e)}")

@router.get("/performance/summary")
async def get_recommendation_performance(
    days: int = Query(7, description="Number of days to analyze")
):
    """Get recommendation performance summary"""
    try:
        supabase = get_supabase()
        
        # Get recent recommendations
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        response = supabase.table('recommendations').select('*, stocks(*)').gte('recommended_date', start_date.isoformat()).execute()
        
        if not response.data:
            return {
                "total_recommendations": 0,
                "average_score": 0.0,
                "market_breakdown": {},
                "performance_summary": "No data available"
            }
        
        # Calculate metrics
        total_recommendations = len(response.data)
        average_score = sum(rec['score'] for rec in response.data) / total_recommendations
        
        # Market breakdown
        market_breakdown = {}
        for rec in response.data:
            market = rec['stocks']['market']
            if market not in market_breakdown:
                market_breakdown[market] = 0
            market_breakdown[market] += 1
        
        # Performance summary
        high_score_count = len([rec for rec in response.data if rec['score'] >= 0.7])
        medium_score_count = len([rec for rec in response.data if 0.4 <= rec['score'] < 0.7])
        low_score_count = len([rec for rec in response.data if rec['score'] < 0.4])
        
        return {
            "total_recommendations": total_recommendations,
            "average_score": average_score,
            "market_breakdown": market_breakdown,
            "score_distribution": {
                "high_score": high_score_count,
                "medium_score": medium_score_count,
                "low_score": low_score_count
            },
            "performance_summary": f"Generated {total_recommendations} recommendations with average score of {average_score:.2%}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate performance summary: {str(e)}")
