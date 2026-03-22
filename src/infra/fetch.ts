import { bindAbortRelay, fetchWithTimeoutAndRetry } from "../utils/fetch-timeout.js";

type FetchWithPreconnect = typeof fetch & {
  preconnect: (url: string, init?: { credentials?: RequestCredentials }) => void;
};

type RequestInitWithDuplex = RequestInit & { duplex?: "half" };

const wrapFetchWithAbortSignalMarker = Symbol.for("openclaw.fetch.abort-signal-wrapped");

type FetchWithAbortSignalMarker = typeof fetch & {
  [wrapFetchWithAbortSignalMarker]?: true;
};

function withDuplex(
  init: RequestInit | undefined,
  input: RequestInfo | URL,
): RequestInit | undefined {
  const hasInitBody = init?.body != null;
  const hasRequestBody =
    !hasInitBody &&
    typeof Request !== "undefined" &&
    input instanceof Request &&
    input.body != null;
  if (!hasInitBody && !hasRequestBody) {
    return init;
  }
  if (init && "duplex" in (init as Record<string, unknown>)) {
    return init;
  }
  return init
    ? ({ ...init, duplex: "half" as const } as RequestInitWithDuplex)
    : ({ duplex: "half" as const } as RequestInitWithDuplex);
}

export function wrapFetchWithAbortSignal(fetchImpl: typeof fetch): typeof fetch {
  if ((fetchImpl as FetchWithAbortSignalMarker)[wrapFetchWithAbortSignalMarker]) {
    return fetchImpl;
  }

  const wrapped = ((input: RequestInfo | URL, init?: RequestInit) => {
    const patchedInit = withDuplex(init, input);
    const signal = patchedInit?.signal;
    if (!signal) {
      return fetchImpl(input, patchedInit);
    }
    if (typeof AbortSignal !== "undefined" && signal instanceof AbortSignal) {
      return fetchImpl(input, patchedInit);
    }
    if (typeof AbortController === "undefined") {
      return fetchImpl(input, patchedInit);
    }
    if (typeof signal.addEventListener !== "function") {
      return fetchImpl(input, patchedInit);
    }
    const controller = new AbortController();
    const onAbort = bindAbortRelay(controller);
    let listenerAttached = false;
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
      listenerAttached = true;
    }
    const cleanup = () => {
      if (!listenerAttached || typeof signal.removeEventListener !== "function") {
        return;
      }
      listenerAttached = false;
      try {
        signal.removeEventListener("abort", onAbort);
      } catch {
        // Foreign/custom AbortSignal implementations may throw here.
        // Never let cleanup mask the original fetch result/error.
      }
    };
    try {
      const response = fetchImpl(input, { ...patchedInit, signal: controller.signal });
      return response.finally(cleanup);
    } catch (error) {
      cleanup();
      throw error;
    }
  }) as FetchWithPreconnect;

  const wrappedFetch = Object.assign(wrapped, fetchImpl) as FetchWithPreconnect;
  const fetchWithPreconnect = fetchImpl as FetchWithPreconnect;
  wrappedFetch.preconnect =
    typeof fetchWithPreconnect.preconnect === "function"
      ? fetchWithPreconnect.preconnect.bind(fetchWithPreconnect)
      : () => {};

  Object.defineProperty(wrappedFetch, wrapFetchWithAbortSignalMarker, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return wrappedFetch;
}

export function resolveFetch(fetchImpl?: typeof fetch): typeof fetch | undefined {
  const resolved = fetchImpl ?? globalThis.fetch;
  if (!resolved) {
    return undefined;
  }
  return wrapFetchWithAbortSignal(resolved);
}

export function createFetchWithRetry(
  fetchImpl?: typeof fetch,
  options?: {
    timeoutMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    retryableStatuses?: number[];
  },
): typeof fetch {
  const baseFetch = resolveFetch(fetchImpl) || fetch;

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    // 对中国特定域名使用优化的超时和重试策略
    const isChineseDomain =
      url.includes(".cn") ||
      url.includes("aliyun") ||
      url.includes("huawei") ||
      url.includes("baidu");

    const defaultOptions = {
      timeoutMs: isChineseDomain ? 15000 : 10000,
      maxRetries: isChineseDomain ? 3 : 2,
      retryDelayMs: isChineseDomain ? 2000 : 1000,
      retryableStatuses: [408, 429, 500, 502, 503, 504],
      fetchFn: baseFetch,
    };

    const finalOptions = { ...defaultOptions, ...options };

    return fetchWithTimeoutAndRetry(url, init || {}, finalOptions);
  };
}
