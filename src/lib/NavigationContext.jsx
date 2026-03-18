import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/** Pages that are "root" tabs — no back button should show on these. */
const ROOT_PATHS = new Set(['/', '/Home', '/History', '/FindTradesmen', '/Settings']);

const NavContext = createContext(null);

export function NavigationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [direction, setDirection] = useState('forward');

  /** Navigate deeper into a stack (slide in from right). */
  const push = useCallback((path, opts) => {
    setDirection('forward');
    navigate(path, opts);
  }, [navigate]);

  /** Switch root tabs (fade only, no slide). */
  const switchTab = useCallback((path) => {
    setDirection('none');
    navigate(path);
  }, [navigate]);

  /** Go back in the stack (slide in from left). */
  const goBack = useCallback(() => {
    setDirection('backward');
    navigate(-1);
  }, [navigate]);

  const canGoBack = !ROOT_PATHS.has(location.pathname);

  return (
    <NavContext.Provider value={{ direction, push, switchTab, goBack, canGoBack }}>
      {children}
    </NavContext.Provider>
  );
}

/** Safe hook — returns no-op defaults outside provider. */
export function useNav() {
  return useContext(NavContext) ?? {
    direction: 'forward',
    push: (p) => {},
    switchTab: (p) => {},
    goBack: () => {},
    canGoBack: false,
  };
}