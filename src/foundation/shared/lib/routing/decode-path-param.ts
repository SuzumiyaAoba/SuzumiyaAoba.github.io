/** 不正なパーセントエンコードでもルートパラメーターを失わない。 */
export function decodePathParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
