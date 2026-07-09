// ponytail: simplified to native loop with exponential backoff, removing p-retry dependency
export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > retries) throw error;
      console.error(`Attempt ${attempt} failed. Retrying...`, error);
      // Exponential backoff: 300ms, 600ms, 1200ms...
      await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, attempt - 1)));
    }
  }
}
