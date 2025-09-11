import pandas as pd
import numpy as np
import ta
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

class TechnicalAnalyzer:
    def __init__(self):
        self.indicators = {}
    
    def calculate_momentum(self, prices: pd.Series, window: int = 20) -> float:
        """Calculate price momentum score"""
        if len(prices) < window:
            return 0.0
        
        # Calculate rate of change
        roc = (prices.iloc[-1] - prices.iloc[-window]) / prices.iloc[-window]
        
        # Calculate moving average momentum
        ma_short = prices.rolling(window=5).mean()
        ma_long = prices.rolling(window=window).mean()
        ma_momentum = (ma_short.iloc[-1] - ma_long.iloc[-1]) / ma_long.iloc[-1]
        
        # Combine momentum indicators
        momentum_score = (roc + ma_momentum) / 2
        
        # Normalize to [0, 1] range
        return max(0, min(1, (momentum_score + 0.1) / 0.2))
    
    def calculate_volume_score(self, volumes: pd.Series, prices: pd.Series, window: int = 20) -> float:
        """Calculate volume-based score"""
        if len(volumes) < window or len(prices) < window:
            return 0.5
        
        # Volume moving average
        vol_ma = volumes.rolling(window=window).mean()
        current_vol = volumes.iloc[-1]
        avg_vol = vol_ma.iloc[-1]
        
        # Volume ratio
        vol_ratio = current_vol / avg_vol if avg_vol > 0 else 1
        
        # Price-volume correlation
        price_change = prices.pct_change().dropna()
        vol_change = volumes.pct_change().dropna()
        
        if len(price_change) > 0 and len(vol_change) > 0:
            correlation = price_change.corr(vol_change)
            correlation = correlation if not np.isnan(correlation) else 0
        else:
            correlation = 0
        
        # Combine volume indicators
        volume_score = (vol_ratio + (correlation + 1) / 2) / 2
        
        # Normalize to [0, 1] range
        return max(0, min(1, volume_score))
    
    def calculate_technical_indicators(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate various technical indicators"""
        if len(df) < 20:
            return {
                "rsi": 50,
                "macd": 0,
                "bb_position": 0.5,
                "stoch": 50,
                "williams_r": -50
            }
        
        # RSI
        rsi = ta.momentum.RSIIndicator(df['close']).rsi().iloc[-1]
        
        # MACD
        macd_line = ta.trend.MACD(df['close']).macd().iloc[-1]
        macd_signal = ta.trend.MACD(df['close']).macd_signal().iloc[-1]
        macd = macd_line - macd_signal
        
        # Bollinger Bands
        bb_high = ta.volatility.BollingerBands(df['close']).bollinger_hband().iloc[-1]
        bb_low = ta.volatility.BollingerBands(df['close']).bollinger_lband().iloc[-1]
        bb_position = (df['close'].iloc[-1] - bb_low) / (bb_high - bb_low) if bb_high != bb_low else 0.5
        
        # Stochastic
        stoch = ta.momentum.StochasticOscillator(df['high'], df['low'], df['close']).stoch().iloc[-1]
        
        # Williams %R
        williams_r = ta.momentum.WilliamsRIndicator(df['high'], df['low'], df['close']).williams_r().iloc[-1]
        
        return {
            "rsi": rsi if not np.isnan(rsi) else 50,
            "macd": macd if not np.isnan(macd) else 0,
            "bb_position": bb_position if not np.isnan(bb_position) else 0.5,
            "stoch": stoch if not np.isnan(stoch) else 50,
            "williams_r": williams_r if not np.isnan(williams_r) else -50
        }
    
    def calculate_technical_score(self, df: pd.DataFrame) -> float:
        """Calculate overall technical analysis score"""
        indicators = self.calculate_technical_indicators(df)
        
        # RSI score (30-70 range is good)
        rsi_score = 1 - abs(indicators["rsi"] - 50) / 50
        
        # MACD score (positive is bullish)
        macd_score = 0.5 + (indicators["macd"] / 0.1) / 2
        macd_score = max(0, min(1, macd_score))
        
        # Bollinger Bands score (middle is neutral)
        bb_score = 1 - abs(indicators["bb_position"] - 0.5) * 2
        
        # Stochastic score (20-80 range is good)
        stoch_score = 1 - abs(indicators["stoch"] - 50) / 50
        
        # Williams %R score (-20 to -80 range is good)
        williams_score = 1 - abs(indicators["williams_r"] + 50) / 50
        
        # Weighted average
        weights = [0.3, 0.25, 0.2, 0.15, 0.1]
        scores = [rsi_score, macd_score, bb_score, stoch_score, williams_score]
        
        technical_score = np.average(scores, weights=weights)
        return max(0, min(1, technical_score))
    
    def analyze_stock(self, df: pd.DataFrame) -> Dict[str, float]:
        """Comprehensive technical analysis of a stock"""
        if len(df) < 20:
            return {
                "momentum_score": 0.5,
                "volume_score": 0.5,
                "technical_score": 0.5,
                "overall_score": 0.5
            }
        
        momentum_score = self.calculate_momentum(df['close'])
        volume_score = self.calculate_volume_score(df['volume'], df['close'])
        technical_score = self.calculate_technical_score(df)
        
        # Overall score (weighted average)
        overall_score = (momentum_score * 0.4 + volume_score * 0.2 + technical_score * 0.4)
        
        return {
            "momentum_score": momentum_score,
            "volume_score": volume_score,
            "technical_score": technical_score,
            "overall_score": overall_score
        }
