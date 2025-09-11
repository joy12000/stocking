from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import Stock, StockCreate, StockPrice, StockPriceCreate
from app.utils.database import get_supabase

router = APIRouter()

@router.get("/", response_model=List[Stock])
async def get_stocks(
    market: Optional[str] = Query(None, description="Filter by market (US or KR)"),
    limit: int = Query(100, description="Maximum number of stocks to return")
):
    """Get list of stocks"""
    try:
        supabase = get_supabase()
        query = supabase.table('stocks').select('*')
        
        if market:
            query = query.eq('market', market)
        
        response = query.limit(limit).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stocks: {str(e)}")

@router.get("/{ticker}", response_model=Stock)
async def get_stock(ticker: str):
    """Get stock by ticker"""
    try:
        supabase = get_supabase()
        response = supabase.table('stocks').select('*').eq('ticker', ticker).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock {ticker}: {str(e)}")

@router.post("/", response_model=Stock)
async def create_stock(stock: StockCreate):
    """Create a new stock"""
    try:
        supabase = get_supabase()
        response = supabase.table('stocks').insert(stock.dict()).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create stock")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create stock: {str(e)}")

@router.get("/{ticker}/prices", response_model=List[StockPrice])
async def get_stock_prices(
    ticker: str,
    days: int = Query(30, description="Number of days of price data to return")
):
    """Get stock price history"""
    try:
        supabase = get_supabase()
        
        # Get stock ID
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        if not stock_response.data:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
        
        stock_id = stock_response.data[0]['id']
        
        # Get price data
        response = supabase.table('stock_prices').select('*').eq('stock_id', stock_id).order('date', desc=True).limit(days).execute()
        
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch prices for {ticker}: {str(e)}")

@router.post("/{ticker}/prices", response_model=StockPrice)
async def create_stock_price(ticker: str, price: StockPriceCreate):
    """Create a new stock price entry"""
    try:
        supabase = get_supabase()
        
        # Get stock ID
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        if not stock_response.data:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
        
        stock_id = stock_response.data[0]['id']
        
        # Create price data
        price_data = price.dict()
        price_data['stock_id'] = stock_id
        
        response = supabase.table('stock_prices').insert(price_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create stock price")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create stock price: {str(e)}")

@router.get("/{ticker}/performance")
async def get_stock_performance(ticker: str, days: int = Query(30)):
    """Get stock performance metrics"""
    try:
        supabase = get_supabase()
        
        # Get stock ID
        stock_response = supabase.table('stocks').select('id').eq('ticker', ticker).execute()
        if not stock_response.data:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
        
        stock_id = stock_response.data[0]['id']
        
        # Get recent price data
        price_response = supabase.table('stock_prices').select('*').eq('stock_id', stock_id).order('date', desc=True).limit(days).execute()
        
        if not price_response.data:
            return {
                "ticker": ticker,
                "performance": "No data available",
                "metrics": {}
            }
        
        prices = price_response.data
        current_price = prices[0]['close']
        previous_price = prices[-1]['close'] if len(prices) > 1 else current_price
        
        # Calculate performance metrics
        total_return = (current_price - previous_price) / previous_price if previous_price > 0 else 0
        
        # Calculate volatility (standard deviation of daily returns)
        daily_returns = []
        for i in range(1, len(prices)):
            daily_return = (prices[i-1]['close'] - prices[i]['close']) / prices[i]['close']
            daily_returns.append(daily_return)
        
        volatility = np.std(daily_returns) if daily_returns else 0
        
        return {
            "ticker": ticker,
            "current_price": current_price,
            "previous_price": previous_price,
            "total_return": total_return,
            "volatility": volatility,
            "performance": "Positive" if total_return > 0 else "Negative"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate performance for {ticker}: {str(e)}")
