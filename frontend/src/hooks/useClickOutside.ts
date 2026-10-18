import { useEffect, type RefObject } from 'react';

/**
 * Calls `onOutside` when a mousedown happens outside the referenced element.
 * Only listens while `active` is true.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  active = true
): void {
  useEffect(() => {
    if (!active) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [ref, onOutside, active]);
}
