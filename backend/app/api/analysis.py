from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from datetime import datetime, date
from app.models.schemas import AnalysisRequest, AnalysisResult, DailyAnalysisRequest, DailyAnalysisResponse
from app.services.analysis_service import AnalysisService

router = APIRouter()
analysis_service = AnalysisService()

@router.post("/stocks", response_model=List[AnalysisResult])
async def analyze_stocks(request: AnalysisRequest):
    """Analyze multiple stocks and return recommendations"""
    try:
        results = await analysis_service.analyze_multiple_stocks(request.symbols)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/daily", response_model=DailyAnalysisResponse)
async def daily_analysis(request: DailyAnalysisRequest, background_tasks: BackgroundTasks):
    """Perform daily analysis and generate recommendations"""
    try:
        analysis_date = request.date or datetime.now().date()
        
        # Get recommendations
        recommendations = await analysis_service.get_daily_recommendations(analysis_date)
        
        return DailyAnalysisResponse(
            success=True,
            message=f"Daily analysis completed for {analysis_date}",
            recommendations=recommendations,
            analysis_count=len(recommendations)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Daily analysis failed: {str(e)}")

@router.get("/stock/{ticker}", response_model=AnalysisResult)
async def analyze_single_stock(ticker: str):
    """Analyze a single stock"""
    try:
        result = await analysis_service.calculate_final_score(ticker)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed for {ticker}: {str(e)}")

@router.get("/sentiment/{ticker}")
async def get_sentiment_analysis(ticker: str):
    """Get sentiment analysis for a stock"""
    try:
        sentiment_score, confidence = await analysis_service.analyze_sentiment(ticker)
        return {
            "ticker": ticker,
            "sentiment_score": sentiment_score,
            "confidence": confidence,
            "sentiment_label": "긍정적" if sentiment_score > 0.1 else "부정적" if sentiment_score < -0.1 else "중립"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed for {ticker}: {str(e)}")

@router.get("/technical/{ticker}")
async def get_technical_analysis(ticker: str):
    """Get technical analysis for a stock"""
    try:
        technical_analysis = await analysis_service.analyze_technical(ticker)
        return {
            "ticker": ticker,
            **technical_analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Technical analysis failed for {ticker}: {str(e)}")
