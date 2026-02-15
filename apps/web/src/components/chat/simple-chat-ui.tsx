"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

type SimpleChatUIProps = {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  /** 右パネル用: コンパクト表示 */
  compact?: boolean;
  className?: string;
};

export function SimpleChatUI({
  messages,
  onSend,
  placeholder = "メッセージを入力",
  disabled = false,
  compact = false,
  className,
}: SimpleChatUIProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);
    setText("");
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex flex-col", compact ? "gap-2" : "gap-3", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 space-y-2 overflow-auto rounded-[10px] bg-neutral-50 p-2",
          compact ? "max-h-[200px] min-h-[120px]" : "min-h-[200px] max-h-[400px]",
        )}
      >
        {messages.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-500">メッセージがありません</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.messageId}
              className={msg.sender === "agent" ? "flex justify-start" : "flex justify-end"}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-[10px] px-2 py-1.5 text-sm",
                  msg.sender === "agent"
                    ? "bg-white text-left shadow-sm"
                    : "bg-blue-600 text-white",
                  compact && "px-2 py-1 text-xs",
                )}
              >
                <p className={cn("opacity-80", compact ? "text-[10px]" : "text-[11px]")}>
                  {msg.sender === "agent" ? "AI" : "あなた"}
                </p>
                <p className={compact ? "mt-0.5 text-xs" : "mt-1"}>{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || sending}
          className={compact ? "h-8 text-sm" : ""}
        />
        <Button
          type="submit"
          size={compact ? "sm" : "md"}
          disabled={disabled || sending || !text.trim()}
        >
          {sending ? "送信中..." : "送信"}
        </Button>
      </form>
    </div>
  );
}
