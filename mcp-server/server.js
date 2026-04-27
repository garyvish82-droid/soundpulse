#!/usr/bin/env node
/**
 * SoundPulse MCP HTTP Server
 * Wraps the MCP server with HTTP/SSE transport for Claude.ai integration
 */

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const { createClient } = require("@supabase/supabase-js");
const { z } = require("zod");
const express = require("express");
require("dotenv").config({ path: "../.env" });

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function createMcpServer() {
  const server = new McpServer({
    name: "soundpulse",
    version: "1.0.0",
  });

  // ── get_insights ──────────────────────────────────────────────────────────
  server.tool(
    "get_insights",
    "Get AI-generated pattern analysis and insights for a SoundCloud creator's tracks",
    {
      user_id: z.string().describe("SoundCloud user ID"),
      track_id: z.string().optional().describe("Optional: filter to a specific track ID"),
      timeframe: z.string().optional().describe("Optional: e.g. '7d', '30d', 'all'"),
    },
    async ({ user_id }) => {
      const { data, error } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user_id)
        .eq("agent_type", "insight")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw new Error(`DB error: ${error.message}`);
      if (!data || data.length === 0) {
        return { content: [{ type: "text", text: `No insights found for user ${user_id}.` }] };
      }

      const insight = data[0];
      const result = {
        summary: insight.summary,
        engagement_score: insight.engagement_score,
        top_performer: { id: insight.top_performer_id, title: insight.top_performer_title },
        underperformer: { id: insight.underperformer_id, title: insight.underperformer_title },
        patterns: insight.patterns,
        recommendations: insight.recommendations,
        generated_at: insight.created_at,
        track_count: insight.track_count,
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── get_strategy ──────────────────────────────────────────────────────────
  server.tool(
    "get_strategy",
    "Get a ranked strategic action plan for a SoundCloud creator, optionally scoped to a specific goal",
    {
      user_id: z.string().describe("SoundCloud user ID"),
      goal: z.string().optional().describe("Optional goal: 'more reposts', 'grow Germany', 'improve completion rate'"),
    },
    async ({ user_id, goal }) => {
      const { data, error } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user_id)
        .eq("agent_type", "strategy")
        .order("created_at", { ascending: false });

      if (error) throw new Error(`DB error: ${error.message}`);
      if (!data || data.length === 0) {
        return { content: [{ type: "text", text: `No strategy found for user ${user_id}.` }] };
      }

      let strategy = data[0];
      if (goal) {
        const match = data.find(r =>
          r.raw_json?.goal_param?.toLowerCase().includes(goal.toLowerCase()) ||
          r.raw_json?.goal?.toLowerCase().includes(goal.toLowerCase())
        );
        if (match) strategy = match;
      }

      const result = {
        goal: strategy.raw_json?.goal || "General strategy",
        strategy_summary: strategy.summary,
        actions: strategy.recommendations,
        quick_win: strategy.raw_json?.quick_win,
        watch_metric: strategy.raw_json?.watch_metric,
        generated_at: strategy.created_at,
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── get_audience ──────────────────────────────────────────────────────────
  server.tool(
    "get_audience",
    "Get audience breakdown and listener persona analysis for a SoundCloud creator",
    {
      user_id: z.string().describe("SoundCloud user ID"),
    },
    async ({ user_id }) => {
      const { data, error } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user_id)
        .eq("agent_type", "insight")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw new Error(`DB error: ${error.message}`);
      if (!data || data.length === 0) {
        return { content: [{ type: "text", text: `No audience data found for user ${user_id}.` }] };
      }

      const insight = data[0];
      const result = {
        user_id,
        engagement_score: insight.engagement_score,
        audience_signals: {
          core_fanbase_quality: insight.engagement_score >= 6
            ? "High — consistent 6-7% like rate indicates attentive, loyal audience"
            : "Developing — engagement rates suggest casual listeners",
          audience_ceiling: insight.track_count <= 5
            ? "Limited catalog constrains audience growth — more releases needed"
            : "Established catalog with growth potential",
          top_performing_content: insight.top_performer_title,
          underperforming_content: insight.underperformer_title,
        },
        patterns: insight.patterns,
        generated_at: insight.created_at,
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── get_alerts ────────────────────────────────────────────────────────────
  server.tool(
    "get_alerts",
    "Get anomaly detection alerts — spikes and drops in track performance metrics",
    {
      user_id: z.string().describe("SoundCloud user ID"),
    },
    async ({ user_id }) => {
      const { data, error } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user_id)
        .eq("agent_type", "anomaly")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw new Error(`DB error: ${error.message}`);
      if (!data || data.length === 0) {
        return { content: [{ type: "text", text: `No alerts found for user ${user_id}.` }] };
      }

      const report = data[0];
      const result = {
        alert_count: report.raw_json?.alert_count || 0,
        severity: report.raw_json?.severity || "none",
        summary: report.summary,
        alerts: report.recommendations || [],
        generated_at: report.created_at,
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  return server;
}

// ── SSE endpoint for Claude.ai ────────────────────────────────────────────
const transports = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => delete transports[transport.sessionId]);
  const server = createMcpServer();
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (!transport) {
    return res.status(404).json({ error: "Session not found" });
  }
  await transport.handlePostMessage(req, res, req.body);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", server: "soundpulse-mcp", version: "1.0.0" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SoundPulse MCP HTTP server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
});