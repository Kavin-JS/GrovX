import { useEffect, useState } from 'react';

/** True while the media query matches (used to size charts on small screens). */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const f = () => setMatches(mq.matches);
    mq.addEventListener('change', f);
    f();
    return () => mq.removeEventListener('change', f);
  }, [query]);
  return matches;
}

export const useIsNarrow = () => useMediaQuery('(max-width: 640px)');
