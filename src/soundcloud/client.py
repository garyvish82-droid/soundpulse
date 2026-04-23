"""
SoundCloud API v1 client.

Handles authentication, rate limiting, and all API calls.
SoundCloud API docs: https://developers.soundcloud.com/docs/api/reference

To get credentials:
  1. Go to https://developers.soundcloud.com/
  2. Register an application
  3. Note your client_id and client_secret
  4. Use OAuth2 flow to get an access_token (or use client_credentials for server-to-server)
"""
from __future__ import annotations

import os
import asyncio
import logging
from typing import Any, Optional
from datetime import datetime, timedelta

import httpx
from dotenv import load_dotenv

from .models import SCTrack, SCUser, SCComment

load_dotenv()
logger = logging.getLogger(__name__)

SOUNDCLOUD_API_BASE = "https://api.soundcloud.com"
SOUNDCLOUD_API_V2   = "https://api-v2.soundcloud.com"


class SoundCloudClient:
    """Async SoundCloud API client with rate limiting and caching."""

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        access_token: Optional[str] = None,
    ):
        self.client_id     = client_id     or os.getenv("SOUNDCLOUD_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("SOUNDCLOUD_CLIENT_SECRET")
        self.access_token  = access_token  or os.getenv("SOUNDCLOUD_ACCESS_TOKEN")

        if not self.client_id:
            raise ValueError(
                "SOUNDCLOUD_CLIENT_ID is required. "
                "Register at https://developers.soundcloud.com/ and set it in .env"
            )

        self._http: Optional[httpx.AsyncClient] = None
        self._request_count = 0
        self._rate_limit_reset: Optional[datetime] = None

    @property
    def http(self) -> httpx.AsyncClient:
        if self._http is None or self._http.is_closed:
            headers = {"Accept": "application/json; charset=utf-8"}
            if self.access_token:
                headers["Authorization"] = f"OAuth {self.access_token}"
            self._http = httpx.AsyncClient(
                base_url=SOUNDCLOUD_API_BASE,
                headers=headers,
                timeout=15.0,
                follow_redirects=True,
            )
        return self._http

    async def _get(self, path: str, params: dict | None = None) -> Any:
        """Make a GET request, injecting client_id and handling rate limits."""
        p = dict(params or {})
        p.setdefault("client_id", self.client_id)

        # Respect rate limits (SoundCloud: 15,000 req/day for free tier)
        if self._rate_limit_reset and datetime.utcnow() < self._rate_limit_reset:
            wait_secs = (self._rate_limit_reset - datetime.utcnow()).total_seconds()
            logger.warning(f"Rate limited — waiting {wait_secs:.1f}s")
            await asyncio.sleep(wait_secs)

        response = await self.http.get(path, params=p)

        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 60))
            self._rate_limit_reset = datetime.utcnow() + timedelta(seconds=retry_after)
            raise RuntimeError(f"SoundCloud rate limit hit. Retry after {retry_after}s.")

        if response.status_code == 401:
            raise PermissionError(
                "SoundCloud auth failed. Check SOUNDCLOUD_ACCESS_TOKEN in .env. "
                "Re-run OAuth flow if token expired."
            )

        response.raise_for_status()
        self._request_count += 1
        return response.json()

    # ─── Track Endpoints ──────────────────────────────────────────────────────

    async def get_track(self, track_id: int) -> SCTrack:
        """Fetch a single track by ID."""
        data = await self._get(f"/tracks/{track_id}")
        return SCTrack(**data)

    async def search_tracks(
        self,
        query: str,
        limit: int = 50,
        genre: Optional[str] = None,
        tags: Optional[str] = None,
    ) -> list[SCTrack]:
        """Search for tracks by query string."""
        params: dict = {"q": query, "limit": min(limit, 200)}
        if genre:
            params["genres"] = genre
        if tags:
            params["tags"] = tags
        data = await self._get("/tracks", params)
        return [SCTrack(**t) for t in (data.get("collection") or data)]

    async def get_trending_tracks(
        self, genre: str = "all-music", limit: int = 50
    ) -> list[SCTrack]:
        """Get trending/charts tracks for a genre."""
        params = {"kind": "trending", "genre": f"soundcloud:genres:{genre}", "limit": limit}
        data = await self._get("/charts", params)
        collection = data.get("collection", [])
        return [SCTrack(**item["track"]) for item in collection if "track" in item]

    # ─── User Endpoints ───────────────────────────────────────────────────────

    async def get_user(self, user_id: int) -> SCUser:
        """Fetch a user profile."""
        data = await self._get("/me")
        return SCUser(**data)

    async def get_user_tracks(self, user_id: int, limit: int = 50) -> list[SCTrack]:
        """Get all tracks uploaded by a user."""
        data = await self._get("/me/tracks", {"limit": limit})
        return [SCTrack(**t) for t in (data.get("collection") or data)]

    async def get_user_followers(self, user_id: int, limit: int = 200) -> list[SCUser]:
        """Get followers of a user."""
        data = await self._get(f"/users/{user_id}/followers", {"limit": limit})
        return [SCUser(**u) for u in (data.get("collection") or data)]

    # ─── Comment Endpoints ────────────────────────────────────────────────────

    async def get_track_comments(
        self, track_id: int, limit: int = 200
    ) -> list[SCComment]:
        """Get timed comments on a track (timestamp indicates position in track)."""
        data = await self._get(f"/tracks/{track_id}/comments", {"limit": limit})
        collection = data.get("collection") or data
        return [SCComment(track_id=track_id, **c) for c in collection]

    # ─── Batch / Analytics helpers ────────────────────────────────────────────

    async def get_tracks_analytics_batch(
        self, track_ids: list[int]
    ) -> list[SCTrack]:
        """
        Fetch analytics for multiple tracks concurrently.
        Returns tracks enriched with play/like/comment counts.
        """
        tasks = [self.get_track(tid) for tid in track_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        tracks = []
        for r in results:
            if isinstance(r, Exception):
                logger.warning(f"Failed to fetch track: {r}")
            else:
                tracks.append(r)
        return tracks

    async def close(self):
        if self._http and not self._http.is_closed:
            await self._http.aclose()
