import { useState, useRef, useCallback } from "react";

/**
 * Reusable pull-to-refresh hook.
 * Returns { pullY, pullRefreshing, handlers } where handlers should be spread onto the scroll container.
 */
export function usePullToRefresh(onRefresh) {
  const [pullY, setPullY] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 70;

  const handleRefresh = useCallback(async () => {
    setPullRefreshing(true);
    setPullY(0);
    await onRefresh();
    setPullRefreshing(false);
  }, [onRefresh]);

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) setPullY(Math.min(diff * 0.4, PULL_THRESHOLD));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullY >= PULL_THRESHOLD) {
      handleRefresh();
    } else {
      setPullY(0);
    }
  }, [pullY, handleRefresh]);

  return {
    pullY,
    pullRefreshing,
    PULL_THRESHOLD,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}