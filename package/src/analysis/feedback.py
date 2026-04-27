"""
Creator-listener feedback loop analysis.
Analyzes how well feedback signals flow between creators and listeners.
"""
from __future__ import annotations

from ..soundcloud.models import CreatorFeedbackMetrics


# Industry benchmark rates (SoundCloud internal benchmarks, approximate)
BENCHMARKS = {
    "like_rate":    {"low": 0.015, "mid": 0.030, "high": 0.050},
    "comment_rate": {"low": 0.001, "mid": 0.003, "high": 0.008},
    "repost_rate":  {"low": 0.005, "mid": 0.012, "high": 0.025},
}


def analyze_creator_feedback(creator_data: dict) -> CreatorFeedbackMetrics:
    """
    Analyzes creator engagement metrics and evaluates the health
    of their feedback loop with listeners.
    """
    like_rate    = creator_data.get("avg_like_rate", 0)
    comment_rate = creator_data.get("avg_comment_rate", 0)
    repost_rate  = creator_data.get("avg_repost_rate", 0)

    # Composite engagement score (0–100)
    engagement_score = _compute_engagement_score(like_rate, comment_rate, repost_rate)

    # Creator responsiveness (proxy: comment rate is highest signal of active community)
    if comment_rate >= BENCHMARKS["comment_rate"]["high"]:
        response_level = "high"
    elif comment_rate >= BENCHMARKS["comment_rate"]["mid"]:
        response_level = "medium"
    else:
        response_level = "low"

    insight, recommendation = _generate_feedback_insight(
        creator_data.get("creator_name", "This creator"),
        like_rate, comment_rate, repost_rate,
        engagement_score, response_level
    )

    return CreatorFeedbackMetrics(
        creator_id=creator_data.get("creator_id", 0),
        creator_name=creator_data.get("creator_name", "Unknown"),
        track_count=creator_data.get("track_count", 0),
        avg_like_rate=round(like_rate, 5),
        avg_comment_rate=round(comment_rate, 5),
        avg_repost_rate=round(repost_rate, 5),
        engagement_score=round(engagement_score, 1),
        response_to_feedback=response_level,
        top_performing_genre=creator_data.get("top_genre"),
        insight=insight,
        recommendation=recommendation,
    )


def _compute_engagement_score(
    like_rate: float, comment_rate: float, repost_rate: float
) -> float:
    """
    Weighted composite score. Comments weighted highest (active signal),
    then reposts (amplification), then likes (passive signal).
    """
    def normalize(val, low, high) -> float:
        return min(max((val - low) / (high - low), 0), 1)

    like_score    = normalize(like_rate,    BENCHMARKS["like_rate"]["low"],    BENCHMARKS["like_rate"]["high"])
    comment_score = normalize(comment_rate, BENCHMARKS["comment_rate"]["low"], BENCHMARKS["comment_rate"]["high"])
    repost_score  = normalize(repost_rate,  BENCHMARKS["repost_rate"]["low"],  BENCHMARKS["repost_rate"]["high"])

    # Weights: comments (50%), reposts (30%), likes (20%)
    return (comment_score * 0.50 + repost_score * 0.30 + like_score * 0.20) * 100


def _generate_feedback_insight(
    name: str,
    like_rate: float,
    comment_rate: float,
    repost_rate: float,
    score: float,
    response_level: str,
) -> tuple[str, str]:

    like_bench    = _bench_label(like_rate,    BENCHMARKS["like_rate"])
    comment_bench = _bench_label(comment_rate, BENCHMARKS["comment_rate"])
    repost_bench  = _bench_label(repost_rate,  BENCHMARKS["repost_rate"])

    if score >= 75:
        insight = (
            f"{name} has an exceptional feedback loop (score: {score:.0f}/100). "
            f"Like rate ({like_rate:.3f}) is {like_bench}, comment rate ({comment_rate:.4f}) is {comment_bench}, "
            f"and repost rate ({repost_rate:.4f}) is {repost_bench}. "
            f"Listeners are not just consuming — they're actively engaging and spreading the music."
        )
        recommendation = (
            f"Feature {name} in creator spotlight sections. Their high comment activity suggests "
            f"an active community that could anchor a SoundCloud community feature test. "
            f"Consider offering them early access to new creator tools — they'll provide rich feedback."
        )
    elif score >= 45:
        # Find the weakest link
        weak = []
        if comment_bench == "below average":
            weak.append("comments (community interaction is low)")
        if repost_bench == "below average":
            weak.append("reposts (content isn't spreading)")
        if like_bench == "below average":
            weak.append("likes (passive engagement is weak)")
        weak_str = " and ".join(weak) if weak else "overall engagement"

        insight = (
            f"{name} has a healthy but improvable feedback loop (score: {score:.0f}/100). "
            f"Main weakness: {weak_str}. "
            f"Their content gets plays but the engagement-to-play ratio suggests listeners enjoy "
            f"passively without converting to active community members."
        )
        recommendation = (
            f"Surface CTA prompts for {name}'s tracks: 'Leave a timed comment' or 'Repost if you like this'. "
            f"Test in-track comment prompts at high-energy moments (SoundCloud's unique timed comment feature). "
            f"Notify the creator about their engagement trends — awareness often drives improvement."
        )
    else:
        insight = (
            f"{name} has a fragile feedback loop (score: {score:.0f}/100). "
            f"Despite getting plays, their like rate ({like_rate:.3f}) is {like_bench}, "
            f"comment rate ({comment_rate:.4f}) is {comment_bench}. "
            f"This could indicate: passive audience, wrong audience, or content that's "
            f"background-listened rather than actively engaged with."
        )
        recommendation = (
            f"Investigate {name}'s audience source: Are most plays from autoplay/ambient playlists? "
            f"If so, this is expected — but they need help building a direct audience. "
            f"Consider offering them a profile optimization checklist and suggesting they engage "
            f"with similar creators' communities to build reciprocal engagement."
        )

    return insight, recommendation


def _bench_label(val: float, bench: dict) -> str:
    if val >= bench["high"]:
        return "above average"
    elif val >= bench["mid"]:
        return "on par"
    else:
        return "below average"


def analyze_platform_feedback_health(all_creators: list[dict]) -> dict:
    """Platform-wide feedback health summary."""
    if not all_creators:
        return {}
    scores = [_compute_engagement_score(
        c.get("avg_like_rate", 0),
        c.get("avg_comment_rate", 0),
        c.get("avg_repost_rate", 0),
    ) for c in all_creators]

    import statistics
    return {
        "avg_engagement_score": round(statistics.mean(scores), 1),
        "median_engagement_score": round(statistics.median(scores), 1),
        "high_engagement_creators": sum(1 for s in scores if s >= 75),
        "low_engagement_creators": sum(1 for s in scores if s < 30),
        "total_creators": len(all_creators),
    }
