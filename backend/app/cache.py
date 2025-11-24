import redis 
import os
import hashlib
from uuid import UUID
from typing import Optional

class CacheService:
    def __init__(self):
        # connect to environment variable defined in docker-compose.yml
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.default_ttl = 3600 # Cache time to live in second = 1 hour
    
    def _generate_key(self, session_id: UUID, prompt: str) -> str:
        """ 
        Generate a unique cache key base on parameter via a hash to ensure key length is manageable
        """
        raw_key = f"{str(session_id)}:{prompt.strip()}"
        return f"cache:{hashlib.sha256(raw_key.encode()).hexdigest()}"

    def increment_hits(self, key: str) -> None:
        """
        Increamet a hit counter for analytics, stored in a separate key hits:<cache_key>
        """
        hit_key = f"hits:{key}"
        self.redis_client.incr(hit_key)

    def get(self, session_id: UUID, prompt: str) -> Optional[str]:
        """
        Retrieve a value from cache if it exists
        """
        key = self._generate_key(session_id, prompt)
        cached_value = self.redis_client.get(key)
        if cached_value:
            self.increment_hits(key)
            return cached_value
        return None 

    def set(self, session_id: UUID, prompt: str, value: str, ttl: int=None) -> bool:
        """
        Store a value in the cache with an expiration time
        """
        key = self._generate_key(session_id, prompt)
        expiration = ttl if ttl is not None else self.default_ttl
        return self.redis_client.set(key, value, ex=expiration)
