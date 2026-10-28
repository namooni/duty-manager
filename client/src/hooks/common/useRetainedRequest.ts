import {useEffect, useState} from 'react';
import {getErrorMessage} from '@/utils/errors/message';
type Result<T> = {
  key: string;
  version: string | number;
  data: T | undefined;
  pending: boolean;
  error: string;
};
/** Keep successful results during refreshes of the same query, including empty results. */
export function useRetainedRequest<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  version: string | number = 0,
  enabled = true,
) {
  const [result, setResult] = useState<Result<T>>({
    key,
    version,
    data: undefined,
    pending: true,
    error: '',
  });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setResult(previous => ({
      key,
      version,
      data: previous.key === key ? previous.data : undefined,
      pending: true,
      error: '',
    }));
    Promise.resolve()
      .then(() => load(controller.signal))
      .then(data => {
        if (!controller.signal.aborted) setResult({key, version, data, pending: false, error: ''});
      })
      .catch(cause => {
        if (!controller.signal.aborted)
          setResult(previous => ({
            key,
            version,
            data: previous.key === key ? previous.data : undefined,
            pending: false,
            error: getErrorMessage(cause),
          }));
      });
    return () => controller.abort();
  }, [key, load, version, enabled]);
  const current = enabled && result.key === key;
  const data = current ? result.data : undefined;
  const pending = enabled && (!current || result.pending || result.version !== version);
  return {
    data,
    error: current && result.version === version ? result.error : '',
    hasData: data !== undefined,
    loading: pending && data === undefined,
    refreshing: pending && data !== undefined,
    pending,
  };
}
