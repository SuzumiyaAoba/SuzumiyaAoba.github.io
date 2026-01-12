"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

type MermaidProps = {
  code: string;
  className?: string;
};

export function Mermaid({ code, className }: MermaidProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const reactId = useId();
  const renderId = `mermaid-${reactId.replace(/:/g, "")}`;

  useEffect(() => {
    let isActive = true;

    const render = async () => {
      try {
        mermaid.initialize({ startOnLoad: false });
        const { svg } = await mermaid.render(renderId, code);
        if (isActive) {
          setSvg(svg);
          setHasError(false);
        }
      } catch {
        if (isActive) {
          setHasError(true);
        }
      }
    };

    render();

    return () => {
      isActive = false;
    };
  }, [code, renderId]);

  if (hasError) {
    return (
      <pre className={className}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div className={className}>
      <div
        className="mx-auto w-full text-center [&>svg]:mx-auto [&>svg]:inline-block [&>svg]:h-auto [&>svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg ?? "" }}
      />
    </div>
  );
}
