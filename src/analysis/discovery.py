"""
Discovery gap analysis engine.
Identifies where search intent ≠ satisfaction (the biggest UX opportunity).
"""
from __future__ import annotations

from ..soundcloud.models import DiscoveryGap


def analyze_discovery_gaps(raw_search_data: list[dict]) -> list[DiscoveryGap]:
    """
    Transforms raw search session data into ranked discovery gaps.

    A gap exists when:
    - Users search for something (intent signal)
    - But don't find / play / finish what they discover (satisfaction failure)

    High-gap terms = biggest product opportunities.
    """
    gaps = []

    for row in raw_search_data:
        shown    = row.get("results_shown", 1) or 1
        clicked  = row.get("results_clicked", 0) or 0
        played   = row.get("tracks_played", 0) or 0
        completion = row.get("avg_completion_pct", 0) or 0
        term     = row.get("search_term", "")
        genre_expected = row.get("genre_expected", "")
        genre_found    = row.get("genre_found", "")

        # Composite gap score:
        # 50% weighted on play-through rate, 50% on listen completion
        play_rate   = played / shown
        gap_score   = (1 - play_rate) * 50 + (1 - completion / 100) * 50
        search_volume = row.get("search_volume", shown * 100)  # proxy

        insight, recommendation = _generate_gap_insight(
            term, genre_expected, genre_found, play_rate, completion, gap_score
        )

        gaps.append(DiscoveryGap(
            search_term=term,
            search_volume=search_volume,
            avg_results_played_pct=round(play_rate * 100, 1),
            avg_listen_completion_pct=round(completion, 1),
            gap_score=round(gap_score, 1),
            insight=insight,
            recommendation=recommendation,
        ))

    return sorted(gaps, key=lambda g: g.gap_score, reverse=True)


def _generate_gap_insight(
    term: str,
    genre_expected: str,
    genre_found: str,
    play_rate: float,
    completion: float,
    gap_score: float,
) -> tuple[str, str]:
    genre_mismatch = genre_expected and genre_found and genre_expected != genre_found

    if gap_score >= 70:
        severity = "critical"
    elif gap_score >= 50:
        severity = "significant"
    else:
        severity = "moderate"

    if genre_mismatch:
        insight = (
            f'Search for "{term}" has a {severity} discovery gap (score: {gap_score:.0f}/100). '
            f"Users expect {genre_expected} content but are served {genre_found} — "
            f"only {play_rate * 100:.0f}% of results get played, and avg completion is {completion:.0f}%. "
            f"This is a recommendation/tagging mismatch problem."
        )
        recommendation = (
            f"Improve genre tagging and search relevance for '{term}'. "
            f"Audit the top 20 results: are they correctly tagged as {genre_expected}? "
            f"Consider adding '{genre_expected}' as a filter chip on this search. "
            f"Content gap check: is there actually enough {genre_expected} content on platform for this query?"
        )
    elif play_rate < 0.2:
        insight = (
            f'"{term}" gets almost no play-throughs ({play_rate * 100:.0f}% of shown results). '
            f"Users search, see results, and immediately leave — a results quality problem. "
            f"Gap score: {gap_score:.0f}/100."
        )
        recommendation = (
            f"The search results for '{term}' are not compelling. Investigate: "
            f"Are thumbnail/waveform previews available? Are top results from credible creators? "
            f"Consider curating a 'Top picks for: {term}' section or a verified playlist. "
            f"This query has high intent but zero conversion."
        )
    elif completion < 35:
        insight = (
            f'Users find and click results for "{term}" (play rate: {play_rate * 100:.0f}%) '
            f"but abandon tracks quickly — avg completion is only {completion:.0f}%. "
            f"The content exists but doesn't match expectations. Gap score: {gap_score:.0f}/100."
        )
        recommendation = (
            f"This is a content-expectation mismatch for '{term}'. Users click but don't stay. "
            f"Review: Do track previews (waveforms, snippets) accurately represent the content? "
            f"Are track descriptions and tags honest? Add a 30-second preview-on-hover feature "
            f"so users can validate before committing to a full play."
        )
    else:
        insight = (
            f'"{term}" shows moderate discovery friction with a gap score of {gap_score:.0f}/100. '
            f"Play rate is {play_rate * 100:.0f}% and completion averages {completion:.0f}%."
        )
        recommendation = (
            f"Monitor '{term}' over 30 days. Small improvements to result ranking "
            f"or adding a curated playlist could move the needle significantly. "
            f"Test surfacing newer/trending content for this query."
        )

    return insight, recommendation


def get_top_opportunities(gaps: list[DiscoveryGap], n: int = 5) -> list[DiscoveryGap]:
    """Return the N highest-impact discovery gaps — the ones worth tackling first."""
    return sorted(gaps, key=lambda g: g.gap_score, reverse=True)[:n]
