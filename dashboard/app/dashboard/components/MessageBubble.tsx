import { Logo } from "@/components/icons";
import { AGENTS } from "@/lib/agents";
import type { Message } from "../types";
import MarkdownText from "./MarkdownText";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const agent = message.tool ? AGENTS.find((a) => a.id === message.tool) : undefined;
  const AgentIcon = agent?.icon;

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <Logo size={28} className="mt-0.5" />}

      <div
        className={`max-w-[580px] rounded-xl border px-4 py-3.5 text-[0.8rem] ${
          isUser ? "bg-[#1e3a5f] border-brand/20" : "bg-surface border-border"
        }`}
      >
        {agent && AgentIcon && (
          <div className="mb-2.5 flex items-center gap-1.5 border-b border-border pb-2.5">
            <AgentIcon size={14} style={{ color: agent.color }} />
            <span className="font-mono text-[0.65rem] tracking-wide text-text-faint">
              {agent.label.toUpperCase()} AGENT
            </span>
          </div>
        )}
        {isUser ? (
          <span className="text-text">{message.content}</span>
        ) : (
          <MarkdownText text={message.content} />
        )}
      </div>

      {isUser && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-[0.65rem] font-medium text-text-faint"
          aria-hidden="true"
        >
          G
        </div>
      )}
    </div>
  );
}
