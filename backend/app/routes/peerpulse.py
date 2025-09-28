from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, Optional, Dict
from datetime import datetime, timedelta
from app.routes.auth import get_current_user
import hashlib, os
from app.models.user import User
from app.utils.database import db
from pydantic import BaseModel

router = APIRouter(
    prefix="/peerpulse",
    tags=["peerpulse"],
)

class PulseIn(BaseModel):
    activity: str  # studying | working | chilling (free text allowed, will bucket)
    mood: Optional[str] = None  # optional mood word

class PulseOut(BaseModel):
    activity: str
    mood: Optional[str]
    at: datetime

class PulseStats(BaseModel):
    window_minutes: int
    total: int
    distribution: Dict[str, float]
    mood_distribution: Dict[str, float]

ALLOWED_BUCKETS = {
    'studying': ['study', 'studying', 'reading', 'learning'],
    'working': ['work', 'working', 'coding', 'building'],
    'chilling': ['rest', 'relax', 'chill', 'chilling', 'break']
}

def bucket_activity(raw: str) -> str:
    if not raw:
        return 'chilling'
    r = raw.lower().strip()
    for bucket, kws in ALLOWED_BUCKETS.items():
        if r in kws:
            return bucket
    return r if r in ALLOWED_BUCKETS else 'chilling'

RATE_LIMIT_MINUTES = 5
_last_cache = { 'key': None, 'data': None, 'ts': 0 }

@router.post("/", response_model=PulseOut, status_code=status.HTTP_201_CREATED)
async def submit_pulse(pulse: PulseIn, current_user: Annotated[User, Depends(get_current_user)]):
    # Store lightweight anonymous pulse (only user id hashed) with timestamp
    # Hash user id to keep anonymity (still prevents rapid duplicate spam heuristics later)
    secret = os.getenv('PEERPULSE_SALT', 'peerpulse_salt')
    user_hash = hashlib.sha256(f"{current_user.id}{secret}".encode()).hexdigest()
    entry = {
        'user_hash': user_hash,
        'activity': bucket_activity(pulse.activity),
        'mood': pulse.mood,
        'created_at': datetime.utcnow(),
    }
    try:
        if db.is_connected():
            if not hasattr(db, 'peerpulse'):
                db.peerpulse = db.db.peerpulse
                db.peerpulse.create_index('created_at')
                db.peerpulse.create_index('user_hash')
            # Rate limit: find most recent pulse for this user_hash within window
            cutoff = datetime.utcnow() - timedelta(minutes=RATE_LIMIT_MINUTES)
            recent = db.peerpulse.find_one({'user_hash': user_hash, 'created_at': { '$gte': cutoff }})
            if recent:
                raise HTTPException(status_code=429, detail=f"One pulse every {RATE_LIMIT_MINUTES} minutes")
            db.peerpulse.insert_one(entry)
        else:
            if not hasattr(db, 'peerpulse_mem'):
                db.peerpulse_mem = []
            # In-memory rate limit
            cutoff = datetime.utcnow() - timedelta(minutes=RATE_LIMIT_MINUTES)
            if any(r for r in db.peerpulse_mem if r['user_hash']==user_hash and r['created_at'] >= cutoff):
                raise HTTPException(status_code=429, detail=f"One pulse every {RATE_LIMIT_MINUTES} minutes")
            db.peerpulse_mem.append(entry)
        # Invalidate cache
        _last_cache['key'] = None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store pulse: {e}")
    return PulseOut(activity=entry['activity'], mood=entry.get('mood'), at=entry['created_at'])

@router.get("/", response_model=PulseStats)
async def get_pulse_stats(window_minutes: int = 30, cache_seconds: int = 30):
    # Simple cache
    key = f"{window_minutes}:{cache_seconds}"
    now_ts = datetime.utcnow().timestamp()
    if _last_cache['key'] == key and (now_ts - _last_cache['ts']) < cache_seconds:
        return _last_cache['data']
    cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
    records = []
    if db.is_connected() and hasattr(db, 'peerpulse'):
        records = list(db.peerpulse.find({'created_at': {'$gte': cutoff}}))
    elif hasattr(db, 'peerpulse_mem'):
        records = [r for r in db.peerpulse_mem if r['created_at'] >= cutoff]
    total = len(records)
    counts: Dict[str, int] = {}
    mood_counts: Dict[str, int] = {}
    for r in records:
        a = r.get('activity', 'chilling')
        counts[a] = counts.get(a, 0) + 1
        m = (r.get('mood') or '').strip().lower()
        if m:
            mood_counts[m] = mood_counts.get(m, 0) + 1
    distribution = {k: (v / total * 100.0 if total else 0.0) for k, v in counts.items()}
    mood_distribution = {k: (v / total * 100.0 if total else 0.0) for k, v in mood_counts.items()}
    data = PulseStats(window_minutes=window_minutes, total=total, distribution=distribution, mood_distribution=mood_distribution)
    _last_cache['key'] = key
    _last_cache['data'] = data
    _last_cache['ts'] = now_ts
    return data
