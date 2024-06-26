import type { FC, PropsWithChildren } from "hono/jsx";

import { Daily } from "./daily";
import { Emacs } from "./emacs";
import { Keyboard } from "./keyboard";
import { Mathematics } from "./mathematics";
import { Nix } from "./nix";
import { Programming } from "./programming";
import { Stock } from "./stock";

export const IconFromText: FC<
  PropsWithChildren<{
    text: string;
    width: string;
    height: string;
  }>
> = ({ text, width, height, children }) => {
  const iconProps = { width, height };
  switch (text) {
    case "キーボード":
      return <Keyboard {...iconProps} />;
    case "株":
      return <Stock {...iconProps} />;
    case "週報":
      return <Daily {...iconProps} />;
    case "Emacs":
      return <Emacs {...iconProps} />;
    case "Nix":
      return <Nix {...iconProps} />;
    case "数学":
      return <Mathematics {...iconProps} />;
    case "プログラミング":
      return <Programming {...iconProps} />;
  }

  return <>{children}</>;
};
