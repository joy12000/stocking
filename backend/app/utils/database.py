import os
from supabase import create_client, Client
from typing import Optional

# Global Supabase client
supabase: Optional[Client] = None

async def init_db():
    """Initialize Supabase database connection"""
    global supabase
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not found in environment variables")
    
    supabase = create_client(supabase_url, supabase_key)
    print("Database connection initialized successfully")

def get_supabase() -> Client:
    """Get Supabase client instance"""
    if supabase is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return supabase
