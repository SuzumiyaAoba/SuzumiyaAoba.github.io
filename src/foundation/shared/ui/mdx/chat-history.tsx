import type { ReactNode } from "react";

import { renderMdx } from "@/shared/lib/mdx";
import { cn } from "@/shared/lib/utils";
import {
  Message,
  MessageContent,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  Response,
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolState,
} from "@/shared/ui/ai-elements";

export type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  state: ToolState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  toolInvocations?: ToolInvocation[];
};

export type ChatHistoryProps = {
  messages: ChatMessage[];
  variant?: "contained" | "flat";
};

function sanitizeMdxContent(content: string): string {
  return content.replace(/<((?:https?:\/\/)[^>]+)>/g, "$1");
}

async function renderMessageContent(content: string): Promise<ReactNode> {
  return renderMdx(sanitizeMdxContent(content));
}

export async function ChatHistory({ messages, variant = "contained" }: ChatHistoryProps) {
  const rendered = await Promise.all(
    messages.map(async (message) => {
      const [content, reasoning] = await Promise.all([
        renderMessageContent(message.content),
        message.reasoning ? renderMessageContent(message.reasoning) : Promise.resolve(null),
      ]);
      return { ...message, content, reasoning };
    }),
  );

  return (
    <div className="not-prose flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
      {rendered.map((message, index) => (
        <Message key={`${message.role}-${index}`} from={message.role}>
          <MessageContent
            from={message.role}
            variant={variant}
            className={cn(
              message.role === "user" ? "bg-muted/80" : "bg-background",
              "shadow-[0_1px_0_rgba(0,0,0,0.04)]",
            )}
          >
            {message.reasoning || (message.toolInvocations && message.toolInvocations.length > 0) ? (
              <div className="flex flex-col gap-2">
                {message.reasoning ? (
                  <Reasoning>
                    <ReasoningTrigger />
                    <ReasoningContent>{message.reasoning}</ReasoningContent>
                  </Reasoning>
                ) : null}
                {message.toolInvocations && message.toolInvocations.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {message.toolInvocations.map((invocation) => (
                      <Tool key={invocation.toolCallId}>
                        <ToolHeader
                          title={invocation.toolName}
                          state={invocation.state}
                        />
                        <ToolContent>
                          <div className={cn("space-y-3")}>
                            <ToolInput input={invocation.input} />
                            <ToolOutput
                              output={invocation.output}
                              {...(invocation.errorText ? { errorText: invocation.errorText } : {})}
                            />
                          </div>
                        </ToolContent>
                      </Tool>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <Response>{message.content}</Response>
          </MessageContent>
        </Message>
      ))}
    </div>
  );
}
