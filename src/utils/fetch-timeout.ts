/**
 * Relay abort without forwarding the Event argument as the abort reason.
 * Using .bind() avoids closure scope capture (memory leak prevention).
 */
function relayAbort(this: AbortController) {
  this.abort();
}

/** Returns a bound abort relay for use as an event listener. */
export function bindAbortRelay(controller: AbortController): () => void {
  return relayAbort.bind(controller);
}

/**
 * Fetch wrapper that adds timeout support via AbortController.
 *
 * @param url - The URL to fetch
 * @param init - RequestInit options (headers, method, body, etc.)
 * @param timeoutMs - Timeout in milliseconds
 * @param fetchFn - The fetch implementation to use (defaults to global fetch)
 * @returns The fetch Response
 * @throws AbortError if the request times out
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(controller.abort.bind(controller), Math.max(1, timeoutMs));
  try {
    return await fetchFn(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch wrapper with timeout and retry support.
 *
 * @param url - The URL to fetch
 * @param init - RequestInit options (headers, method, body, etc.)
 * @param options - Options for timeout and retries
 * @param options.timeoutMs - Timeout in milliseconds
 * @param options.maxRetries - Maximum number of retries
 * @param options.retryDelayMs - Delay between retries in milliseconds
 * @param options.retryableStatuses - HTTP status codes that should be retried
 * @param options.fetchFn - The fetch implementation to use (defaults to global fetch)
 * @returns The fetch Response
 * @throws Error if all retries fail
 */
export async function fetchWithTimeoutAndRetry(
  url: string,
  init: RequestInit,
  options: {
    timeoutMs: number;
    maxRetries?: number;
    retryDelayMs?: number;
    retryableStatuses?: number[];
    fetchFn?: typeof fetch;
  },
): Promise<Response> {
  const {
    timeoutMs,
    maxRetries = 3,
    retryDelayMs = 1000,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    fetchFn = fetch,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs, fetchFn);

      // Check if the status is retryable
      if (retryableStatuses.includes(response.status) && attempt < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(2, attempt)));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Only retry on network errors, not on abort errors
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
}
