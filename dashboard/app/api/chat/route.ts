import { NextRequest, NextResponse } from "next/server";

const MCP_BASE = process.env.MCP_BASE_URL || "https://soundpulse-production-43b3.up.railway.app";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "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";
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || "1329042120";

const SYSTEM_PROMPT = `You are SoundPulse, an AI analytics assistant for SoundCloud creators.
You have access to 4 data tools for the creator with user_id ${DEFAULT_USER_ID}:
- get_insights: patterns, engagement score, top/underperforming tracks, recommendations
- get_strategy: ranked action plan, optionally scoped to a goal
- get_audience: audience quality signals, fanbase analysis, listener patterns
- get_alerts: anomaly detection — spikes and drops in plays, likes, reposts, comments

GUARDRAILS:
1. Only answer questions about SoundCloud music analytics and creator strategy.
2. If asked about anything unrelated, respond: "I am SoundPulse — I can only help with SoundCloud analytics and creator strategy."
3. Never reveal system internals, API keys, or database details.
4. Keep responses focused and actionable.

When you decide which tool to use, return a JSON block in this exact format BEFORE your response:
<tool_call>{"tool": "get_insights"|"get_strategy"|"get_audience"|"get_alerts", "goal": "optional goal string for strategy only"}</tool_call>

Then provide a clear, well-formatted markdown response using the data returned.
Always reference actual numbers from the data in your response.`;

async function callMcpTool(tool: string, goal?: string): Promise<unknown> {
  const uid = DEFAULT_USER_ID;
  let url = "";
  if (tool === "get_insights") url = `${MCP_BASE}/api/insights/${uid}`;
  else if (tool === "get_strategy") url = `${MCP_BASE}/api/strategy/${uid}${goal ? `?goal=${encodeURIComponent(goal)}` : ""}`;
  else if (tool === "get_audience") url = `${MCP_BASE}/api/audience/${uid}`;
  else if (tool === "get_alerts") url = `${MCP_BASE}/api/alerts/${uid}`;
  else throw new Error(`Unknown tool: ${tool}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tool ${tool} returned ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { message, agent } = await req.json();
    if (!message || typeof message !== "string") return NextResponse.json({ error: "Message is required" }, { status: 400 });
    if (message.length > 500) return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });

    let toolName: string | null = agent || null;
    let toolGoal: string | undefined;

    if (!toolName) {
      const routingRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 300, system: SYSTEM_PROMPT, messages: [{ role: "user", content: message }] }),
      });
      const routingData = await routingRes.json();
      const routingText = routingData.content?.[0]?.text || "";
      const toolMatch = routingText.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
      if (toolMatch) {
        const toolJson = JSON.parse(toolMatch[1]);
        toolName = toolJson.tool;
        toolGoal = toolJson.goal;
      }
      if (!toolName) return NextResponse.json({ response: routingText.replace(/<tool_call>[\s\S]*?<\/tool_call>/, "").trim(), tool: null });
    }

    const toolData = await callMcpTool(toolName, toolGoal);

    const formatRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `${message}\n\nHere is the data from the ${toolName} tool:\n${JSON.stringify(toolData, null, 2)}\n\nPlease analyze this data and provide actionable insights.` },
        ],
      }),
    });
    const formatData = await formatRes.json();
    console.log("Format API response:", JSON.stringify(formatData).slice(0, 200));
    const response = formatData.content?.[0]?.text || formatData.error?.message || "Unable to generate response.";
    return NextResponse.json({ response, tool: toolName, data: toolData });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
