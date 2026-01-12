import type { AnnotationHandler } from "codehike/code";
import { InnerLine } from "codehike/code";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function HoverContainer({ children }: { children: ReactNode }) {
  return <div className="hover-container">{children}</div>;
}

export const hover: AnnotationHandler = {
  name: "hover",
  onlyIfAnnotated: true,
  Line: ({ annotation, ...props }) => (
    <InnerLine merge={props} className="transition-opacity" data-line={annotation?.query || ""} />
  ),
};

type MdxLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href?: string;
};

export function MdxLink({ href, children, className, ...rest }: MdxLinkProps) {
  if (href?.startsWith("hover:")) {
    const hoverKey = href.slice("hover:".length);
    return (
      <span
        className="underline decoration-dotted underline-offset-4"
        data-hover={hoverKey}
        {...rest}
      >
        {children}
      </span>
    );
  }

  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} className={className} {...rest}>
          {children}
        </a>
      );
    }
    const isExternal = href.startsWith("http") || href.startsWith("mailto:");
    if (isExternal) {
      return (
        <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      );
    }

    const linkProps = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    ) as Omit<ComponentPropsWithoutRef<typeof Link>, "href">;

    return (
      <Link href={href} className={className} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <span className={className} {...rest}>
      {children}
    </span>
  );
}
