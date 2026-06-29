import pRetry from 'p-retry'

export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  return pRetry(fn, {
    retries,
    onFailedAttempt: (error) => {
      console.error(`Attempt ${error.attemptNumber} failed. Retrying...`, error)
    },
    minTimeout: 300,
    factor: 2,
  })
}
