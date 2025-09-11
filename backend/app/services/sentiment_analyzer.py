import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import numpy as np
from typing import Dict, List, Tuple

class SentimentAnalyzer:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.finbert_tokenizer = None
        self.finbert_model = None
        self.vader_analyzer = SentimentIntensityAnalyzer()
        self._load_models()
    
    def _load_models(self):
        """Load FinBERT model for financial sentiment analysis"""
        try:
            model_name = "ProsusAI/finbert"
            self.finbert_tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.finbert_model = AutoModelForSequenceClassification.from_pretrained(model_name)
            self.finbert_model.to(self.device)
            print("FinBERT model loaded successfully")
        except Exception as e:
            print(f"Failed to load FinBERT model: {e}")
            print("Falling back to TextBlob and VADER")
    
    def analyze_finbert(self, text: str) -> Tuple[float, float]:
        """Analyze sentiment using FinBERT model"""
        if not self.finbert_tokenizer or not self.finbert_model:
            return 0.0, 0.0
        
        try:
            inputs = self.finbert_tokenizer(
                text, 
                return_tensors="pt", 
                truncation=True, 
                padding=True, 
                max_length=512
            ).to(self.device)
            
            with torch.no_grad():
                outputs = self.finbert_model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
                
            # FinBERT returns: [negative, neutral, positive]
            negative, neutral, positive = predictions[0].cpu().numpy()
            
            # Convert to sentiment score (-1 to 1)
            sentiment_score = positive - negative
            
            # Confidence is the maximum probability
            confidence = max(negative, neutral, positive)
            
            return float(sentiment_score), float(confidence)
        except Exception as e:
            print(f"FinBERT analysis error: {e}")
            return 0.0, 0.0
    
    def analyze_textblob(self, text: str) -> Tuple[float, float]:
        """Analyze sentiment using TextBlob"""
        try:
            blob = TextBlob(text)
            sentiment_score = blob.sentiment.polarity
            confidence = abs(blob.sentiment.polarity) + (1 - abs(blob.sentiment.subjectivity)) / 2
            return float(sentiment_score), float(confidence)
        except Exception as e:
            print(f"TextBlob analysis error: {e}")
            return 0.0, 0.0
    
    def analyze_vader(self, text: str) -> Tuple[float, float]:
        """Analyze sentiment using VADER"""
        try:
            scores = self.vader_analyzer.polarity_scores(text)
            sentiment_score = scores['compound']
            confidence = abs(sentiment_score)
            return float(sentiment_score), float(confidence)
        except Exception as e:
            print(f"VADER analysis error: {e}")
            return 0.0, 0.0
    
    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment using multiple methods and return ensemble result"""
        if not text or len(text.strip()) < 10:
            return {"sentiment": 0.0, "confidence": 0.0}
        
        # Get sentiment scores from different methods
        finbert_score, finbert_conf = self.analyze_finbert(text)
        textblob_score, textblob_conf = self.analyze_textblob(text)
        vader_score, vader_conf = self.analyze_vader(text)
        
        # Weighted ensemble (FinBERT gets higher weight for financial text)
        weights = [0.5, 0.3, 0.2]  # FinBERT, TextBlob, VADER
        scores = [finbert_score, textblob_score, vader_score]
        confidences = [finbert_conf, textblob_conf, vader_conf]
        
        # Calculate weighted average
        ensemble_score = np.average(scores, weights=weights)
        ensemble_confidence = np.average(confidences, weights=weights)
        
        # Normalize to [-1, 1] range
        ensemble_score = np.clip(ensemble_score, -1, 1)
        ensemble_confidence = np.clip(ensemble_confidence, 0, 1)
        
        return {
            "sentiment": float(ensemble_score),
            "confidence": float(ensemble_confidence),
            "finbert_score": finbert_score,
            "textblob_score": textblob_score,
            "vader_score": vader_score
        }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict[str, float]]:
        """Analyze sentiment for multiple texts"""
        return [self.analyze_sentiment(text) for text in texts]
