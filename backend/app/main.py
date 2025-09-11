from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

from app.api import analysis, stocks, news, recommendations
from app.utils.database import init_db

# Load environment variables
load_dotenv()

app = FastAPI(
    title="StockPulse AI Server",
    description="AI-powered stock analysis and recommendation service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis.router, prefix="/api/analyze", tags=["analysis"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["recommendations"])

@app.on_event("startup")
async def startup_event():
    """Initialize database connection and models on startup"""
    await init_db()

@app.get("/")
async def root():
    return {"message": "StockPulse AI Server is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "StockPulse AI Server"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
