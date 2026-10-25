export function cacheAsync<Args extends unknown[], Value>(
  load: (...args: Args) => Promise<Value>,
  _keys?: string[]
): (...args: Args) => Promise<Value> {
  const entries = new Map<string, Promise<Value>>();
  return async (...args: Args): Promise<Value> => {
    if (process.env["NODE_ENV"] !== "production") {
      return await load(...args);
    }
    const key = JSON.stringify(args);
    const existing = entries.get(key);
    if (existing) {
      return await existing;
    }
    const result = load(...args);
    entries.set(key, result);
    try {
      return await result;
    } catch (error) {
      entries.delete(key);
      throw error;
    }
  };
}
