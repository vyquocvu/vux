import { useEffect, useState } from 'react';
import type { TocEntry } from 'utils/toc';

/** Line just below the sticky back-bar; a heading counts as read once it passes it. */
const OFFSET = 120;

/**
 * Returns the id of the heading currently in view. Scroll-driven rather than
 * IntersectionObserver so a 14-heading article picks one winner deterministically
 * instead of flickering between two intersecting sections.
 */
export const useActiveHeading = (toc: TocEntry[]): string => {
  const [active, setActive] = useState('');

  useEffect(() => {
    if (toc.length < 2) return;
    const read = () => {
      const line = window.scrollY + OFFSET;
      let winner = toc[0].id;
      for (const entry of toc) {
        const el = document.getElementById(entry.id);
        if (el && el.offsetTop <= line) winner = entry.id;
      }
      setActive((prev) => (prev === winner ? prev : winner));
    };
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [toc]);

  return active;
};

export default useActiveHeading;
