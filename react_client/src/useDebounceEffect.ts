import { useEffect, DependencyList } from "react";

export function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  deps: DependencyList = []
) {
  useEffect(() => {
    const t = setTimeout(() => {
      // Call the function without passing deps
      fn();
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
  }, deps); // Dependencies array for useEffect
}
