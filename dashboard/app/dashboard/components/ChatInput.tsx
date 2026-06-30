"use client";

import { useId } from "react";
import { SendIcon } from "@/components/icons";

const MAX_LENGTH = 500;
const WARN_THRESHOLD = 400;
const DANGER_THRESHOLD = 480;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export default function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const inputId = useId();
  const counterId = useId();

  return (
    <div className="border-t border-border bg-bg px-4 py-3.5 sm:px-6">
      <div className="mx-auto flex max-w-[720px] gap-2.5">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="sr-only">
            Ask SoundPulse about your music
          </label>
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder='e.g. "Why is one track getting 3× more reposts than the others?"'
            disabled={disabled}
            aria-describedby={value.length > WARN_THRESHOLD ? counterId : undefined}
            className="min-h-[44px] w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 pr-12 text-[0.8rem] text-text outline-none transition-colors placeholder:text-text-faint disabled:opacity-50 focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          {value.length > WARN_THRESHOLD && (
            <span
              id={counterId}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[0.6rem]"
              style={{ color: value.length > DANGER_THRESHOLD ? "var(--color-danger)" : "var(--color-text-faint)" }}
            >
              {value.length}/{MAX_LENGTH}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-brand px-4 text-[0.75rem] font-semibold tracking-wide text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Send
          <SendIcon size={13} />
        </button>
      </div>
    </div>
  );
}
