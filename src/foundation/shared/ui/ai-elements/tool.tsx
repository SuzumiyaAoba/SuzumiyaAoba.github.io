import type { HTMLAttributes } from "react";

import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

export type ToolState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

export type ToolProps = HTMLAttributes<HTMLDetailsElement> & {
  defaultOpen?: boolean;
};

export function Tool({ className, defaultOpen = false, ...props }: ToolProps) {
  return (
    <details
      className={cn("group not-prose m-0", className)}
      open={defaultOpen}
      {...props}
    />
  );
}

export type ToolHeaderProps = HTMLAttributes<HTMLElement> & {
  title: string;
  state: ToolState;
};

const stateLabel: Record<ToolState, string> = {
  "input-streaming": "Pending",
  "input-available": "Running",
  "output-available": "Completed",
  "output-error": "Error",
};

export function ToolHeader({ className, title, state, ...props }: ToolHeaderProps) {
  const statusIcon =
    state === "output-available"
      ? "lucide:check-circle-2"
      : state === "output-error"
        ? "lucide:x-circle"
        : state === "input-available"
          ? "lucide:clock-3"
          : "lucide:loader-2";
  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-center justify-between gap-3 px-0 py-0 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon icon="lucide:wrench" className="size-3.5" />
        <span className="truncate">{title}</span>
      </span>
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            state === "output-error"
              ? "bg-destructive/10 text-destructive"
              : state === "output-available"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-muted text-muted-foreground",
          )}
        >
          <Icon
            icon={statusIcon}
            className={cn("size-3", state === "input-streaming" && "animate-spin")}
          />
          {stateLabel[state]}
        </span>
        <Icon
          icon="lucide:chevron-down"
          className="size-3.5 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </span>
    </summary>
  );
}

export type ToolContentProps = HTMLAttributes<HTMLDivElement>;

export function ToolContent({ className, ...props }: ToolContentProps) {
  return (
    <div
      className={cn("mt-1 w-full max-w-full rounded-md px-0 py-2", className)}
      {...props}
    />
  );
}

export type ToolInputProps = HTMLAttributes<HTMLDivElement> & {
  input?: unknown;
};

export function ToolInput({ className, input, ...props }: ToolInputProps) {
  if (input == null) {
    return null;
  }

  return (
    <div className={cn("space-y-1.5 text-xs", className)} {...props}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Parameters
      </p>
      <pre className="overflow-x-auto rounded-md bg-muted/70 px-1 py-2 text-xs leading-5 text-foreground">
        {JSON.stringify(input, null, 2)}
      </pre>
    </div>
  );
}

export type ToolOutputProps = HTMLAttributes<HTMLDivElement> & {
  output?: unknown;
  errorText?: string;
};

export function ToolOutput({ className, output, errorText, ...props }: ToolOutputProps) {
  if (output == null && !errorText) {
    return null;
  }

  const body =
    typeof output === "string"
      ? output
      : output
        ? JSON.stringify(output, null, 2)
        : "";

  return (
    <div className={cn("space-y-1.5 text-xs", className)} {...props}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {errorText ? "Error" : "Result"}
      </p>
      {errorText ? <p className="text-destructive">{errorText}</p> : null}
      {body ? (
        <pre className="overflow-x-auto rounded-md bg-muted/70 px-1 py-2 text-xs leading-5 text-foreground">
          {body}
        </pre>
      ) : null}
    </div>
  );
}
