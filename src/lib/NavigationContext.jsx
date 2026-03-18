import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/** Root tab paths — back button hidden on these. */
const ROOT_PATHS = new Set(['/', '/Home', '/History', '/FindTradesmen', '/Settings']);

const NavContext = createContext(null);

export function NavigationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [direction, setDirection] = useState('none');
  // Per-tab back stacks: { [tabPath]: string[] }
  const [tabStacks, setTabStacks] = useState({});
  const activeTabRef = useRef(location.pathname);

  /** The current tab root (root paths map to themselves, deep paths to their tab). */
  function resolveTab(path) {
    for (const root of ROOT_PATHS) {
      if (path === root || path.startsWith(root + '/')) return root;
    }
    return '/Home'; // default
  }

  const activeTab = resolveTab(location.pathname);
  const currentStack = tabStacks[activeTab] ?? [];
  // Can go back if the current tab has stack entries, OR we're on a non-root page
  // (handles direct URL navigation where push() wasn't called)
  const canGoBack = currentStack.length > 0 || !ROOT_PATHS.has(location.pathname);

  /** Intercept native browser back gesture — mark as backward. */
  useEffect(() => {
    const onPopState = () => setDirection('backward');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /** Track tab changes to reset direction. */
  useEffect(() => {
    activeTabRef.current = location.pathname;
  }, [location.pathname]);

  /** Navigate deeper (slide right in). */
  const push = useCallback((path, opts) => {
    const tab = resolveTab(location.pathname);
    setDirection('forward');
    setTabStacks(prev => ({
      ...prev,
      [tab]: [...(prev[tab] ?? []), location.pathname],
    }));
    navigate(path, opts);
  }, [navigate, location.pathname]);

  /** Switch root tabs (fade, clears that tab's forward stack but preserves it). */
  const switchTab = useCallback((path) => {
    setDirection('none');
    navigate(path);
  }, [navigate]);

  /** Go back in the current tab's stack. */
  const goBack = useCallback(() => {
    const tab = resolveTab(location.pathname);
    setDirection('backward');
    setTabStacks(prev => ({
      ...prev,
      [tab]: (prev[tab] ?? []).slice(0, -1),
    }));
    navigate(-1);
  }, [navigate, location.pathname]);

  return (
    <NavContext.Provider value={{ direction, push, switchTab, goBack, canGoBack, activeTab }}>
      {children}
    </NavContext.Provider>
  );
}

/** Safe hook — no-op defaults when used outside provider. */
export function useNav() {
  return useContext(NavContext) ?? {
    direction: 'none',
    push: () => {},
    switchTab: () => {},
    goBack: () => {},
    canGoBack: false,
    activeTab: '/Home',
  };
}