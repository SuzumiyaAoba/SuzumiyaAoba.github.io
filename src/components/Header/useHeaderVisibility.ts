import { useState, useEffect, useRef } from "react";

const SCROLL_THRESHOLD = 10;

/**
 * ヘッダーの表示状態を管理するためのカスタムフック
 *
 * スクロール位置に応じて、ヘッダーが表示されるべきか、
 * また、スクロールされて背景が変化するべきかを判定します。
 *
 * @returns {{
 *   isScrolled: boolean; // ページがスクロールされているか
 *   isVisible: boolean;  // ヘッダーが表示されるべきか
 * }}
 */
export const useHeaderVisibility = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const isAtTopRef = useRef(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 最上部にいるかどうかの判定
      const isAtTop = currentScrollY <= SCROLL_THRESHOLD;
      if (isAtTopRef.current !== isAtTop) {
        setIsScrolled(!isAtTop);
        isAtTopRef.current = isAtTop;
      }

      // スクロール方向に基づいて表示/非表示を決定
      if (currentScrollY > SCROLL_THRESHOLD) {
        if (currentScrollY < lastScrollYRef.current) {
          setIsVisible(true); // 上にスクロール
        } else if (currentScrollY > lastScrollYRef.current) {
          setIsVisible(false); // 下にスクロール
        }
      } else {
        setIsVisible(true); // スクロールが閾値以下なら表示
      }

      lastScrollYRef.current = currentScrollY;
    };

    const opts = { passive: true };
    window.addEventListener("scroll", handleScroll, opts);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldBeVisible = isVisible || isAtTopRef.current;

  return { isScrolled, isVisible: shouldBeVisible };
}; 