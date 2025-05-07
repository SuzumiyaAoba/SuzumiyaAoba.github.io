import { memo } from "react";
import { RakutenProductAdComponent } from "../RakutenProductAdComponent";

/**
 * 「依存性注入原則と実践パターン」の本の広告コンポーネント
 */
export const DependencyInjectionPrinciplesPracticesAndPatterns = memo(() => {
  return (
    <RakutenProductAdComponent
      itemCode="dependency-injection-book-001"
      width="468px"
      height="60px"
      description="依存性注入原則と実践パターン"
    />
  );
});

DependencyInjectionPrinciplesPracticesAndPatterns.displayName =
  "DependencyInjectionPrinciplesPracticesAndPatterns";
