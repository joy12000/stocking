from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

class StockBase(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol")
    name: str = Field(..., description="Company name")
    market: str = Field(..., description="Market (US or KR)")
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[int] = None

class StockCreate(StockBase):
    pass

class Stock(StockBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class StockPriceBase(BaseModel):
    stock_id: int
    date: date
    open: Optional[float] = None
    close: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[int] = None
    adjusted_close: Optional[float] = None

class StockPriceCreate(StockPriceBase):
    pass

class StockPrice(StockPriceBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class NewsBase(BaseModel):
    stock_id: int
    headline: str
    url: str
    content: Optional[str] = None
    sentiment: Optional[float] = Field(None, ge=-1, le=1)
    confidence: Optional[float] = Field(None, ge=0, le=1)
    source: Optional[str] = None
    published_at: datetime

class NewsCreate(NewsBase):
    pass

class News(NewsBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class RecommendationBase(BaseModel):
    stock_id: int
    score: float = Field(..., ge=0, le=1)
    reason: str
    momentum_score: Optional[float] = Field(None, ge=0, le=1)
    sentiment_score: Optional[float] = Field(None, ge=0, le=1)
    volume_score: Optional[float] = Field(None, ge=0, le=1)
    technical_score: Optional[float] = Field(None, ge=0, le=1)
    recommended_date: date

class RecommendationCreate(RecommendationBase):
    pass

class Recommendation(RecommendationBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AnalysisRequest(BaseModel):
    symbols: List[str] = Field(..., description="List of stock symbols to analyze")
    date: Optional[date] = Field(None, description="Analysis date (defaults to today)")

class AnalysisResult(BaseModel):
    symbol: str
    momentum_score: float
    sentiment_score: float
    volume_score: float
    technical_score: float
    final_score: float
    recommendation: str
    reason: str

class DailyAnalysisRequest(BaseModel):
    date: Optional[date] = Field(None, description="Analysis date (defaults to today)")

class DailyAnalysisResponse(BaseModel):
    success: bool
    message: str
    recommendations: List[RecommendationCreate]
    analysis_count: int
