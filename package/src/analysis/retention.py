"""
Retention analysis engine.
Turns raw retention event curves into actionable UX insights.
"""
from __future__ import annotations

import statistics
from typing import Optional
from ..soundcloud.models import RetentionAnalysis, RetentionPoint


def analyze_retention_curve(
    track_id: int,
    track_title: str,
    genre: Optional[str],
    duration_ms: int,
    raw_curve: list[dict],   # [{position_pct, listener_count}]
) -> RetentionAnalysis:
    """
    Analyzes a retention curve and identifies critical drop-off points.
    Returns a full RetentionAnalysis with UX insight and recommendation.
    """
    if not raw_curve:
        return RetentionAnalysis(
            track_id=track_id, track_title=track_title, genre=genre,
            duration_ms=duration_ms, avg_completion_pct=0,
            critical_drop_points=[], retention_score=0,
            insight="No retention data available yet.",
            recommendation="Start collecting listener data."
        )

    # Sort by position
    curve = sorted(raw_curve, key=lambda x: x["position_pct"])
    max_listeners = curve[0]["listener_count"] if curve else 1

    # Build retention points with drop rates
    points: list[RetentionPoint] = []
    drop_rates: list[float] = []

    for i, pt in enumerate(curve):
        prev_count = curve[i - 1]["listener_count"] if i > 0 else max_listeners
        curr_count = pt["listener_count"]
        drop = (prev_count - curr_count) / max_listeners * 100
        drop_rates.append(max(drop, 0))
        points.append(RetentionPoint(
            position_pct=pt["position_pct"],
            listener_pct=curr_count / max_listeners * 100,
            drop_rate=round(max(drop, 0), 2),
        ))

    # Mark critical drops (> 2x average drop rate)
    if drop_rates:
        avg_drop = statistics.mean(drop_rates)
        for p, dr in zip(points, drop_rates):
            p.is_critical_drop = dr > avg_drop * 2.0

    critical_drops = [p for p in points if p.is_critical_drop]

    # Completion rate: % of original listeners who reach 80%+ of the track
    listeners_at_80 = next(
        (p.listener_pct for p in points if p.position_pct >= 80), 0
    )
    avg_completion = listeners_at_80

    # Retention score: weighted average of listener_pct across the curve
    if points:
        retention_score = round(statistics.mean(p.listener_pct for p in points), 1)
    else:
        retention_score = 0.0

    # Generate insight
    insight, recommendation = _generate_retention_insight(
        track_title, genre, duration_ms, critical_drops, retention_score, avg_completion
    )

    return RetentionAnalysis(
        track_id=track_id,
        track_title=track_title,
        genre=genre,
        duration_ms=duration_ms,
        avg_completion_pct=round(avg_completion, 1),
        critical_drop_points=critical_drops,
        retention_score=retention_score,
        insight=insight,
        recommendation=recommendation,
    )


def _generate_retention_insight(
    title: str,
    genre: Optional[str],
    duration_ms: int,
    critical_drops: list[RetentionPoint],
    retention_score: float,
    completion_pct: float,
) -> tuple[str, str]:
    duration_min = duration_ms / 60000

    if not critical_drops:
        insight = (
            f'"{title}" shows healthy retention with no critical drop-off points. '
            f"Listeners stay engaged throughout the full {duration_min:.1f}-minute track."
        )
        recommendation = (
            "Maintain current structure. Consider extending the track or adding a remix version — "
            "the audience is clearly engaged and wants more."
        )
        return insight, recommendation

    first_drop = min(critical_drops, key=lambda p: p.position_pct)
    drop_pos_min = first_drop.position_pct / 100 * duration_min

    if first_drop.position_pct <= 10:
        insight = (
            f'"{title}" loses {100 - first_drop.listener_pct:.0f}% of listeners '
            f"in the first {drop_pos_min:.1f} minutes. "
            f"This is a classic intro-friction problem — the opening hook isn't landing fast enough."
        )
        recommendation = (
            "Shorten or rework the intro. For {genre or 'this genre'}, listeners decide within "
            "the first 30 seconds. Consider starting with the main hook or chorus immediately. "
            "A/B test a version that cuts the first 20 seconds."
        )
    elif first_drop.position_pct >= 60:
        insight = (
            f'"{title}" retains listeners well through {first_drop.position_pct:.0f}% of the track '
            f"but loses significant audience around the {drop_pos_min:.1f}-minute mark. "
            f"This suggests the track feels too long or has a weak ending section."
        )
        recommendation = (
            f"Consider ending the track at {drop_pos_min:.1f} minutes or adding an energy surge "
            f"(breakdown/build-up) before this point to re-engage listeners. "
            f"An edit version (trimming the outro) could significantly improve average completion."
        )
    else:
        insight = (
            f'"{title}" has a critical drop at {first_drop.position_pct:.0f}% '
            f"({drop_pos_min:.1f} min), losing {first_drop.drop_rate:.1f}% of listeners at once. "
            f"This typically indicates a structural transition that doesn't land — "
            f"a verse, bridge, or breakdown that breaks the momentum."
        )
        recommendation = (
            f"Review the transition at {drop_pos_min:.1f} min. Listen for energy mismatches: "
            f"a sudden tempo change, an unexpected instrumental section, or a key change "
            f"that loses the listener's emotional thread. Smooth this transition."
        )

    return insight, recommendation


def compare_genre_retention(
    track_completion: float, genre: str, genre_avg: float
) -> str:
    """Generate comparative insight against genre average."""
    diff = track_completion - genre_avg
    if diff > 10:
        return f"This track outperforms the {genre} genre average by {diff:.1f} percentage points — top tier retention."
    elif diff < -10:
        return f"This track underperforms the {genre} genre average by {abs(diff):.1f} percentage points — needs structural review."
    else:
        return f"Retention is on par with the {genre} genre average (within 10pp)."
