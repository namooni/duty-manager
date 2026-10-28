import {useEffect} from 'react';
export const NOTICE_DURATION_MS = 5000;
export function useAutoDismissMessage(
  message: string,
  setMessage: (value: string) => void,
  version = 0,
) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message, setMessage, version]);
}
