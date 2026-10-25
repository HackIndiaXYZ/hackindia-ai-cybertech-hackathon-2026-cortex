import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Returns true when the user has requested reduced motion via
 * the OS / browser `prefers-reduced-motion: reduce` setting.
 * Falls back to false if the hook cannot determine the preference.
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}
