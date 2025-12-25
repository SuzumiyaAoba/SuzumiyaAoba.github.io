"use client";

import { Message, MessageContent } from "./ai-elements/message";
import { Response } from "./ai-elements/response";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "./ai-elements/reasoning";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
  ToolInputProps,
  ToolOutputProps,
} from "./ai-elements/tool";
import { cn } from "@/libs/utils";
import markdownStyles from "@/styles/markdown-base.module.scss";
import chatStyles from "./ChatHistory.module.scss";
import type { ToolUIPart } from "ai";

export type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  state: ToolUIPart["state"];
  input?: ToolInputProps["input"];
  output?: ToolOutputProps["output"];
  errorText?: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  avatar?: string;
  reasoning?: string;
  toolInvocations?: ToolInvocation[];
};

export type ChatHistoryProps = {
  messages: ChatMessage[];
  userAvatar?: string;
  assistantAvatar?: string;
  variant?: "contained" | "flat";
};

export const ChatHistory = ({
  messages,
  userAvatar = "/avatar-user.png",
  assistantAvatar = "/avatar-assistant.png",
  variant = "contained",
}: ChatHistoryProps) => {
  return (
    <div className="flex flex-col gap-0 rounded-lg border border-border bg-background p-4">
      {messages.map((message, index) => (
        <Message key={index} from={message.role}>
          <MessageContent variant={variant}>
            {message.reasoning && (
              <Reasoning>
                <ReasoningTrigger />
                <ReasoningContent>{message.reasoning}</ReasoningContent>
              </Reasoning>
            )}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex flex-col gap-2 mb-2">
                {message.toolInvocations.map((invocation) => (
                  <Tool key={invocation.toolCallId} defaultOpen={false}>
                    <ToolHeader
                      state={invocation.state}
                      type={`tool-${invocation.toolName}`}
                      title={invocation.toolName}
                    />
                    <ToolContent>
                      {(invocation as any).input && (
                        <ToolInput input={invocation.input} />
                      )}
                      <ToolOutput
                        output={invocation.output}
                        errorText={invocation.errorText}
                      />
                    </ToolContent>
                  </Tool>
                ))}
              </div>
            )}
            <Response
              className={cn(markdownStyles.markdown, chatStyles.chatMarkdown)}
            >
              {message.content}
            </Response>
          </MessageContent>
        </Message>
      ))}
    </div>
  );
};
