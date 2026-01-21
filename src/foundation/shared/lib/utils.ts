import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 複数のクラス名を結合し、Tailwind CSS のクラスの衝突を解決する
 * @param inputs クラス名、オブジェクト、配列など
 * @returns 結合されたクラス名の文字列
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
