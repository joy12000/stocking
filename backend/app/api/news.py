from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.schemas import News, NewsCreate
from app.utils.database import get_supabase

router = APIRouter()

@router.get("/", response_model=List[News])
async def get_news(
    ticker: Optional[str] = Query(None, description="Filter by stock ticker"),
    days: int = Query(7, description="Number of days of news to return"),
    limit: int = Query(50, description="Maximum number of news items to return")
):
    """Get news articles"""
    try:
        supabase = get_supabase()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        query = supabase.table('news').select('*')
        
        if ticker:
            # Get stock ID
            stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
            if not stock_response.data:
                raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
            
            stock_id = stock_response.data[0]['id']
            query = query.eq('stock_id', stock_id)
        
        response = query.gte('published_at', start_date.isoformat()).order('published_at', desc=True).limit(limit).execute()
        
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch news: {str(e)}")

@router.get("/{news_id}", response_model=News)
async def get_news_item(news_id: int):
    """Get a specific news item"""
    try:
        supabase = get_supabase()
        response = supabase.table('news').select('*').eq('id', news_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"News item {news_id} not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch news item {news_id}: {str(e)}")

@router.post("/", response_model=News)
async def create_news(news: NewsCreate):
    """Create a new news item"""
    try:
        supabase = get_supabase()
        response = supabase.table('news').insert(news.dict()).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create news item")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create news item: {str(e)}")

@router.get("/sentiment/summary")
async def get_sentiment_summary(
    ticker: Optional[str] = Query(None, description="Filter by stock ticker"),
    days: int = Query(7, description="Number of days to analyze")
):
    """Get sentiment analysis summary"""
    try:
        supabase = get_supabase()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        query = supabase.table('news').select('sentiment, confidence')
        
        if ticker:
            # Get stock ID
            stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
            if not stock_response.data:
                raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
            
            stock_id = stock_response.data[0]['id']
            query = query.eq('stock_id', stock_id)
        
        response = query.gte('published_at', start_date.isoformat()).execute()
        
        if not response.data:
            return {
                "ticker": ticker,
                "sentiment_score": 0.0,
                "confidence": 0.0,
                "sentiment_label": "중립",
                "news_count": 0
            }
        
        # Calculate sentiment metrics
        sentiments = [item['sentiment'] for item in response.data if item['sentiment'] is not None]
        confidences = [item['confidence'] for item in response.data if item['confidence'] is not None]
        
        if not sentiments:
            return {
                "ticker": ticker,
                "sentiment_score": 0.0,
                "confidence": 0.0,
                "sentiment_label": "중립",
                "news_count": len(response.data)
            }
        
        avg_sentiment = sum(sentiments) / len(sentiments)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        # Determine sentiment label
        if avg_sentiment > 0.1:
            sentiment_label = "긍정적"
        elif avg_sentiment < -0.1:
            sentiment_label = "부정적"
        else:
            sentiment_label = "중립"
        
        return {
            "ticker": ticker,
            "sentiment_score": avg_sentiment,
            "confidence": avg_confidence,
            "sentiment_label": sentiment_label,
            "news_count": len(response.data),
            "positive_count": len([s for s in sentiments if s > 0.1]),
            "negative_count": len([s for s in sentiments if s < -0.1]),
            "neutral_count": len([s for s in sentiments if -0.1 <= s <= 0.1])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate sentiment summary: {str(e)}")

@router.get("/trending/top")
async def get_trending_news(
    limit: int = Query(10, description="Number of trending news items to return")
):
    """Get trending news based on sentiment and recency"""
    try:
        supabase = get_supabase()
        
        # Get recent news with high sentiment scores
        response = supabase.table('news').select('*, stocks(ticker, name)').gte('published_at', (datetime.now() - timedelta(days=3)).isoformat()).order('sentiment', desc=True).limit(limit).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trending news: {str(e)}")
