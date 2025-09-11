import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from app.utils.database import get_supabase
from app.services.sentiment_analyzer import SentimentAnalyzer
from app.services.technical_analyzer import TechnicalAnalyzer
from app.models.schemas import RecommendationCreate, AnalysisResult

class AnalysisService:
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        self.technical_analyzer = TechnicalAnalyzer()
        self.supabase = get_supabase()
    
    async def get_stock_data(self, ticker: str, days: int = 30) -> Optional[pd.DataFrame]:
        """Get stock price data from database"""
        try:
            # Get stock info
            stock_response = self.supabase.table('stocks').select('id').eq('ticker', ticker).execute()
            if not stock_response.data:
                return None
            
            stock_id = stock_response.data[0]['id']
            
            # Get price data
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=days)
            
            price_response = self.supabase.table('stock_prices').select('*').eq('stock_id', stock_id).gte('date', start_date.isoformat()).lte('date', end_date.isoformat()).order('date').execute()
            
            if not price_response.data:
                return None
            
            df = pd.DataFrame(price_response.data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            return df
        except Exception as e:
            print(f"Error getting stock data for {ticker}: {e}")
            return None
    
    async def get_news_data(self, ticker: str, days: int = 7) -> List[Dict]:
        """Get news data for a stock"""
        try:
            # Get stock info
            stock_response = self.supabase.table('stocks').select('id').eq('ticker', ticker).execute()
            if not stock_response.data:
                return []
            
            stock_id = stock_response.data[0]['id']
            
            # Get news data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            news_response = self.supabase.table('news').select('*').eq('stock_id', stock_id).gte('published_at', start_date.isoformat()).order('published_at', desc=True).execute()
            
            return news_response.data or []
        except Exception as e:
            print(f"Error getting news data for {ticker}: {e}")
            return []
    
    async def analyze_sentiment(self, ticker: str) -> Tuple[float, float]:
        """Analyze sentiment for a stock based on recent news"""
        news_data = await self.get_news_data(ticker)
        
        if not news_data:
            return 0.0, 0.0
        
        # Combine headlines and content for analysis
        texts = []
        for news in news_data:
            text = news.get('headline', '')
            if news.get('content'):
                text += ' ' + news['content']
            texts.append(text)
        
        # Analyze sentiment
        sentiment_results = self.sentiment_analyzer.analyze_batch(texts)
        
        # Calculate weighted average (recent news has higher weight)
        weights = np.exp(np.linspace(-1, 0, len(sentiment_results)))
        weights = weights / weights.sum()
        
        sentiment_scores = [result['sentiment'] for result in sentiment_results]
        confidence_scores = [result['confidence'] for result in sentiment_results]
        
        avg_sentiment = np.average(sentiment_scores, weights=weights)
        avg_confidence = np.average(confidence_scores, weights=weights)
        
        return float(avg_sentiment), float(avg_confidence)
    
    async def analyze_technical(self, ticker: str) -> Dict[str, float]:
        """Perform technical analysis on a stock"""
        df = await self.get_stock_data(ticker)
        
        if df is None or len(df) < 20:
            return {
                "momentum_score": 0.5,
                "volume_score": 0.5,
                "technical_score": 0.5
            }
        
        return self.technical_analyzer.analyze_stock(df)
    
    async def calculate_final_score(self, ticker: str) -> AnalysisResult:
        """Calculate final recommendation score for a stock"""
        # Get sentiment analysis
        sentiment_score, sentiment_confidence = await self.analyze_sentiment(ticker)
        
        # Get technical analysis
        technical_analysis = await self.analyze_technical(ticker)
        
        # Calculate final score with weights
        momentum_score = technical_analysis['momentum_score']
        volume_score = technical_analysis['volume_score']
        technical_score = technical_analysis['technical_score']
        
        # Weighted final score
        final_score = (
            momentum_score * 0.3 +
            sentiment_score * 0.4 +
            volume_score * 0.2 +
            technical_score * 0.1
        )
        
        # Normalize to [0, 1] range
        final_score = max(0, min(1, (final_score + 1) / 2))
        
        # Determine recommendation
        if final_score >= 0.7:
            recommendation = "BUY"
        elif final_score >= 0.4:
            recommendation = "HOLD"
        else:
            recommendation = "SELL"
        
        # Generate reason
        reason = self._generate_reason(
            momentum_score, sentiment_score, volume_score, technical_score, final_score
        )
        
        return AnalysisResult(
            symbol=ticker,
            momentum_score=momentum_score,
            sentiment_score=sentiment_score,
            volume_score=volume_score,
            technical_score=technical_score,
            final_score=final_score,
            recommendation=recommendation,
            reason=reason
        )
    
    def _generate_reason(self, momentum: float, sentiment: float, volume: float, technical: float, final: float) -> str:
        """Generate human-readable reason for recommendation"""
        reasons = []
        
        if momentum > 0.7:
            reasons.append("강한 상승 모멘텀")
        elif momentum < 0.3:
            reasons.append("하락 모멘텀")
        
        if sentiment > 0.3:
            reasons.append("긍정적 뉴스 감성")
        elif sentiment < -0.3:
            reasons.append("부정적 뉴스 감성")
        
        if volume > 0.7:
            reasons.append("거래량 급증")
        elif volume < 0.3:
            reasons.append("거래량 감소")
        
        if technical > 0.7:
            reasons.append("기술적 지표 양호")
        elif technical < 0.3:
            reasons.append("기술적 지표 약화")
        
        if not reasons:
            reasons.append("종합적으로 중립적")
        
        return f"종합 점수 {final:.1%} - {', '.join(reasons)}"
    
    async def analyze_multiple_stocks(self, tickers: List[str]) -> List[AnalysisResult]:
        """Analyze multiple stocks and return results"""
        results = []
        
        for ticker in tickers:
            try:
                result = await self.calculate_final_score(ticker)
                results.append(result)
            except Exception as e:
                print(f"Error analyzing {ticker}: {e}")
                continue
        
        # Sort by final score (descending)
        results.sort(key=lambda x: x.final_score, reverse=True)
        
        return results
    
    async def get_daily_recommendations(self, date: Optional[datetime] = None) -> List[RecommendationCreate]:
        """Get daily stock recommendations"""
        if date is None:
            date = datetime.now().date()
        
        # Get all stocks
        stocks_response = self.supabase.table('stocks').select('id, ticker').execute()
        
        if not stocks_response.data:
            return []
        
        recommendations = []
        
        # Analyze each stock
        for stock in stocks_response.data:
            try:
                analysis = await self.calculate_final_score(stock['ticker'])
                
                # Only include stocks with score > 0.5
                if analysis.final_score > 0.5:
                    recommendation = RecommendationCreate(
                        stock_id=stock['id'],
                        score=analysis.final_score,
                        reason=analysis.reason,
                        momentum_score=analysis.momentum_score,
                        sentiment_score=analysis.sentiment_score,
                        volume_score=analysis.volume_score,
                        technical_score=analysis.technical_score,
                        recommended_date=date
                    )
                    recommendations.append(recommendation)
            except Exception as e:
                print(f"Error analyzing {stock['ticker']}: {e}")
                continue
        
        # Sort by score (descending)
        recommendations.sort(key=lambda x: x.score, reverse=True)
        
        # Return top 20 recommendations
        return recommendations[:20]
