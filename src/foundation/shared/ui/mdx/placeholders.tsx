import type { ComponentType, PropsWithChildren } from "react";

export function createPlaceholder(
  name: string,
): ComponentType<PropsWithChildren<Record<string, unknown>>> {
  const Placeholder = ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => {
    return (
      <div data-mdx-placeholder={name} data-props={Object.keys(props).join(",")}>
        {children}
      </div>
    );
  };
  Placeholder.displayName = `MdxPlaceholder(${name})`;
  return Placeholder;
}
