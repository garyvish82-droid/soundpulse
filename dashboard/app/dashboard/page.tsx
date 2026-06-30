"use client";

import { useEffect, useRef, useState } from "react";
import { AGENTS, SUGGESTIONS, type Agent } from "@/lib/agents";
import AgentCard from "./components/AgentCard";
import ChatInput from "./components/ChatInput";
import DashboardHeader from "./components/DashboardHeader";
import EmptyState from "./components/EmptyState";
import MessageBubble from "./components/MessageBubble";
import SuggestionChips from "./components/SuggestionChips";
import TypingIndicator from "./components/TypingIndicator";
import type { Message } from "./types";

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(message: string, agentId?: string) {
    if (!message.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    setActiveAgent(agentId || null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, agent: agentId }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.error ? `Error: ${data.error}` : data.response, tool: data.tool },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again.", tool: null }]);
    } finally {
      setLoading(false);
      setActiveAgent(null);
    }
  }

  function handleAgent(agent: Agent) {
    if (loading) return;
    send(`Run ${agent.label.toLowerCase()} analysis`, agent.id);
  }

  const isEmpty = messages.length === 0;
  const activeAgentMeta = AGENTS.find((a) => a.id === activeAgent);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <DashboardHeader />

      {/* Agent trigger pads */}
      <div className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
        <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-wider text-text-faint">
          Analyze your music →
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isActive={activeAgent === agent.id}
              disabled={loading}
              onRun={handleAgent}
            />
          ))}
        </div>
      </div>

      {/* Conversation */}
      <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {isEmpty ? (
          <EmptyState onSelectSuggestion={(s) => send(s)} />
        ) : (
          <div className="mx-auto flex max-w-[720px] flex-col gap-5">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {loading && <TypingIndicator label={activeAgentMeta?.loading ?? "Analyzing..."} />}

            {!loading && messages.length > 0 && (
              <SuggestionChips suggestions={SUGGESTIONS} onSelect={(s) => send(s)} variant="pill" />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <ChatInput value={input} onChange={setInput} onSend={() => send(input)} disabled={loading} />
    </div>
  );
}
