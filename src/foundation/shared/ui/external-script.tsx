import type { ScriptHTMLAttributes } from "react";

export default function ExternalScript({
  strategy: _strategy,
  ...props
}: ScriptHTMLAttributes<HTMLScriptElement> & { strategy?: string }) {
  return <script {...props} />;
}
