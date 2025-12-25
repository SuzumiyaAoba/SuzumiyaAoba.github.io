"use client";

import { ChatHistory } from "@/components/ChatHistory";
import { chatReasoningLow } from "@/data/chat-history/chat-reasoning-low";
import { chatReasoningHigh } from "@/data/chat-history/chat-reasoning-high";
import { chatImprovedPrompt } from "@/data/chat-history/chat-improved-prompt";

export const ChatReasoningLow = () => (
  <ChatHistory messages={chatReasoningLow.messages} />
);

export const ChatReasoningHigh = () => (
  <ChatHistory messages={chatReasoningHigh.messages} />
);

export const ChatImprovedPrompt = () => (
  <ChatHistory messages={chatImprovedPrompt.messages} />
);
