"use client";

import { AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function AmazonAssociate() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div 
      className="px-4 border rounded-lg"
      style={{
        backgroundColor: isDark ? "rgb(146 64 14 / 0.2)" : "rgb(254 243 199)",
        borderColor: isDark ? "rgb(146 64 14)" : "rgb(251 191 36)",
      }}
    >
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-2">
        <AlertTriangle 
          className="w-5 h-5 flex-shrink-0" 
          style={{ color: isDark ? "rgb(251 191 36)" : "rgb(217 119 6)" }}
        />
        <p className="!my-2 font-bold">Amazon アソシエイトについて</p>
        </div>
        <div>
          <p 
            className="!mt-0 mb-1 text-sm"
            style={{ color: isDark ? "rgb(251 191 36)" : "rgb(146 64 14)" }}
          >
            この記事には Amazon アソシエイトのリンクが含まれています。
            Amazonのアソシエイトとして、SuzumiyaAoba は適格販売により収入を得ています。
          </p>
        </div>
      </div>
    </div>
  );
}
