import { useEffect, useState } from 'react';

function query(q: string): MediaQueryList | null {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(q) : null;
  } catch {
    return null;
  }
}

/** Live `matchMedia(q).matches`; false where `matchMedia` is missing (jsdom, old browsers). */
export function useMediaQuery(q: string): boolean {
  const [matches, setMatches] = useState(() => query(q)?.matches ?? false);
  useEffect(() => {
    const mq = query(q);
    if (!mq) return;
    setMatches(mq.matches);
    const onChange = () => setMatches(mq.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener?.(onChange);
    return () => mq.removeListener?.(onChange);
  }, [q]);
  return matches;
}

/** A phone held sideways: the table and the action bar go side by side (same query as the CSS). */
export const PHONE_LANDSCAPE = '(pointer: coarse) and (orientation: landscape) and (max-height: 560px)';
