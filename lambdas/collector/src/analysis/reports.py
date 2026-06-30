"""
UX Insight Report generator.
Aggregates all analysis dimensions into a stakeholder-ready HTML/PDF report.
"""
from __future__ import annotations

from datetime import datetime
from jinja2 import Template

from ..soundcloud.models import UXInsightReport


REPORT_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SoundPulse · UX Insight Report</title>
<style>
  :root {
    --sc-orange: #f50;
    --sc-dark:   #1a1a1a;
    --sc-gray:   #333;
    --sc-light:  #f5f5f5;
    --sc-accent: #ff7700;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f0f0f; color: #fff; line-height: 1.6;
  }
  .header {
    background: linear-gradient(135deg, #f50 0%, #ff7700 50%, #f50 100%);
    padding: 48px 60px 40px;
  }
  .header .logo { font-size: 14px; font-weight: 700; letter-spacing: 3px; opacity: 0.9; margin-bottom: 12px; }
  .header h1 { font-size: 36px; font-weight: 800; margin-bottom: 8px; }
  .header .meta { font-size: 13px; opacity: 0.85; }
  .body { max-width: 1000px; margin: 0 auto; padding: 40px 60px 80px; }
  .summary-box {
    background: #1e1e1e; border-left: 4px solid var(--sc-orange);
    border-radius: 8px; padding: 24px 28px; margin: 32px 0;
  }
  .summary-box p { font-size: 16px; color: #e0e0e0; }
  .stats-row { display: flex; gap: 20px; margin: 32px 0; }
  .stat-card {
    flex: 1; background: #1e1e1e; border-radius: 10px;
    padding: 20px 24px; text-align: center;
    border-top: 3px solid var(--sc-orange);
  }
  .stat-card .number { font-size: 32px; font-weight: 800; color: var(--sc-orange); }
  .stat-card .label { font-size: 12px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .section { margin: 40px 0; }
  .section-title {
    font-size: 20px; font-weight: 700; color: var(--sc-orange);
    border-bottom: 1px solid #333; padding-bottom: 12px; margin-bottom: 20px;
    display: flex; align-items: center; gap: 10px;
  }
  .insight-card {
    background: #1a1a1a; border-radius: 8px; padding: 20px 24px;
    margin: 12px 0; border-left: 3px solid #444;
  }
  .insight-card.high   { border-left-color: #ff4444; }
  .insight-card.medium { border-left-color: #ffaa00; }
  .insight-card.low    { border-left-color: #44cc44; }
  .insight-card p { color: #ccc; font-size: 14px; line-height: 1.7; }
  .recommendations {
    background: linear-gradient(135deg, #1a1a1a, #222);
    border-radius: 12px; padding: 28px 32px; margin: 40px 0;
    border: 1px solid #333;
  }
  .recommendations h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .rec-item {
    display: flex; gap: 16px; align-items: flex-start;
    padding: 14px 0; border-bottom: 1px solid #2a2a2a;
  }
  .rec-item:last-child { border-bottom: none; }
  .rec-number {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--sc-orange); color: #fff; font-weight: 700; font-size: 13px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .rec-text { font-size: 15px; color: #ddd; }
  .footer { text-align: center; padding: 40px; color: #555; font-size: 12px; }
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 12px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
    background: #333; color: #aaa; margin-left: 8px;
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo">SOUNDPULSE · UX INTELLIGENCE</div>
  <h1>UX Insight Report</h1>
  <div class="meta">
    Generated {{ generated_at }} &nbsp;·&nbsp; Data window: {{ data_freshness }} &nbsp;·&nbsp;
    {{ tracks_analyzed }} tracks · {{ users_analyzed }} user sessions
  </div>
</div>

<div class="body">

  <div class="summary-box">
    <p>{{ summary }}</p>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <div class="number">{{ tracks_analyzed }}</div>
      <div class="label">Tracks Analyzed</div>
    </div>
    <div class="stat-card">
      <div class="number">{{ users_analyzed }}</div>
      <div class="label">User Sessions</div>
    </div>
    <div class="stat-card">
      <div class="number">{{ retention_score }}</div>
      <div class="label">Avg Retention Score</div>
    </div>
    <div class="stat-card">
      <div class="number">{{ discovery_gap_count }}</div>
      <div class="label">Discovery Gaps Found</div>
    </div>
  </div>

  <!-- RETENTION SECTION -->
  <div class="section">
    <div class="section-title">🎵 Listener Retention</div>
    {% for h in retention_highlights %}
    <div class="insight-card {% if loop.index == 1 %}high{% elif loop.index == 2 %}medium{% else %}low{% endif %}">
      <p>{{ h }}</p>
    </div>
    {% endfor %}
  </div>

  <!-- DISCOVERY SECTION -->
  <div class="section">
    <div class="section-title">🔍 Discovery & Search Gaps</div>
    {% for h in discovery_highlights %}
    <div class="insight-card {% if loop.index == 1 %}high{% elif loop.index == 2 %}medium{% else %}low{% endif %}">
      <p>{{ h }}</p>
    </div>
    {% endfor %}
  </div>

  <!-- FEEDBACK SECTION -->
  <div class="section">
    <div class="section-title">💬 Creator–Listener Feedback Loop</div>
    {% for h in feedback_highlights %}
    <div class="insight-card {% if loop.index == 1 %}high{% elif loop.index == 2 %}medium{% else %}low{% endif %}">
      <p>{{ h }}</p>
    </div>
    {% endfor %}
  </div>

  <!-- TOP RECOMMENDATIONS -->
  <div class="recommendations">
    <h2>🎯 Top Recommendations</h2>
    {% for rec in top_3_recommendations %}
    <div class="rec-item">
      <div class="rec-number">{{ loop.index }}</div>
      <div class="rec-text">{{ rec }}</div>
    </div>
    {% endfor %}
  </div>

</div>

<div class="footer">
  SoundPulse · UX Intelligence powered by MCP Agent Analysis<br>
  This report was generated automatically by analyzing real usage patterns.
</div>

</body>
</html>"""


def generate_html_report(report: UXInsightReport, extra_context: dict | None = None) -> str:
    """Render the full HTML report from a UXInsightReport model."""
    ctx = extra_context or {}
    template = Template(REPORT_TEMPLATE)
    return template.render(
        generated_at=report.generated_at.strftime("%B %d, %Y at %H:%M UTC"),
        data_freshness=report.data_freshness,
        tracks_analyzed=report.tracks_analyzed,
        users_analyzed=report.users_analyzed,
        summary=report.summary,
        retention_highlights=report.retention_highlights,
        discovery_highlights=report.discovery_highlights,
        feedback_highlights=report.feedback_highlights,
        top_3_recommendations=report.top_3_recommendations,
        retention_score=ctx.get("retention_score", "N/A"),
        discovery_gap_count=ctx.get("discovery_gap_count", "N/A"),
    )


def build_report_from_analyses(
    retention_analyses: list,
    discovery_gaps: list,
    creator_metrics: list,
    tracks_analyzed: int,
    users_analyzed: int,
    data_window_days: int = 30,
) -> UXInsightReport:
    """Aggregate all analysis results into a single UXInsightReport."""

    # Retention highlights
    ret_highlights = []
    for r in sorted(retention_analyses, key=lambda x: x.retention_score)[:3]:
        ret_highlights.append(r.insight)

    # Discovery highlights
    disc_highlights = []
    for g in sorted(discovery_gaps, key=lambda x: x.gap_score, reverse=True)[:3]:
        disc_highlights.append(g.insight)

    # Feedback highlights
    fb_highlights = []
    for c in sorted(creator_metrics, key=lambda x: x.engagement_score, reverse=True)[:3]:
        fb_highlights.append(c.insight)

    # Top recommendations (one per dimension)
    recs = []
    if retention_analyses:
        worst = min(retention_analyses, key=lambda x: x.retention_score)
        recs.append(f"[Retention] {worst.recommendation}")
    if discovery_gaps:
        top_gap = max(discovery_gaps, key=lambda x: x.gap_score)
        recs.append(f"[Discovery] {top_gap.recommendation}")
    if creator_metrics:
        lowest_fb = min(creator_metrics, key=lambda x: x.engagement_score)
        recs.append(f"[Feedback] {lowest_fb.recommendation}")

    summary = (
        f"Analysis of {tracks_analyzed} tracks and {users_analyzed} user sessions over the last "
        f"{data_window_days} days reveals {len(discovery_gaps)} discovery gaps, "
        f"{sum(1 for r in retention_analyses if r.critical_drop_points)} tracks with critical retention drops, "
        f"and mixed creator engagement health. Immediate action on search relevance and intro hooks "
        f"could meaningfully improve platform-wide completion rates."
    )

    return UXInsightReport(
        generated_at=datetime.utcnow(),
        summary=summary,
        retention_highlights=ret_highlights or ["No retention data available."],
        discovery_highlights=disc_highlights or ["No discovery gap data available."],
        feedback_highlights=fb_highlights or ["No creator feedback data available."],
        top_3_recommendations=recs or ["Collect more data to generate recommendations."],
        data_freshness=f"Last {data_window_days} days",
        tracks_analyzed=tracks_analyzed,
        users_analyzed=users_analyzed,
    )
