/**
 * Parallel Processing Utilities
 * 
 * Utilities for efficient parallel processing with concurrency control
 */

/**
 * Process items in parallel with controlled concurrency
 * 
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param concurrency - Maximum number of concurrent operations (default: 5)
 * @returns Array of results in the same order as input items
 */
export async function processInParallel<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const executing: Set<Promise<void>> = new Set();

  for (let i = 0; i < items.length; i++) {
    const promise = processor(items[i], i).then((result) => {
      results[i] = result;
      executing.delete(promise);
    });

    executing.add(promise);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(Array.from(executing));
  return results;
}

/**
 * Process items in batches with controlled concurrency within each batch
 * 
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param batchSize - Number of items per batch
 * @param concurrency - Maximum concurrent operations per batch
 * @param delayBetweenBatches - Delay in ms between batches (default: 500)
 * @returns Array of results
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  batchSize: number,
  concurrency: number = 5,
  delayBetweenBatches: number = 500
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processInParallel(
      batch,
      (item, idx) => processor(item, i + idx),
      concurrency
    );
    results.push(...batchResults);

    // Add delay between batches (except after last batch)
    if (i + batchSize < items.length && delayBetweenBatches > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in ms (default: 1000)
 * @param maxDelay - Maximum delay in ms (default: 10000)
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(totalDelay)}ms`);
      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError!;
}

/**
 * Create a rate limiter that ensures minimum delay between calls
 * 
 * @param minDelay - Minimum delay in ms between calls
 * @returns Rate-limited function wrapper
 */
export function createRateLimiter(minDelay: number) {
  let lastCall = 0;

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall < minDelay) {
      await new Promise((resolve) => 
        setTimeout(resolve, minDelay - timeSinceLastCall)
      );
    }

    lastCall = Date.now();
    return fn();
  };
}

