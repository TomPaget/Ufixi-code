import { ThemeProvider } from "@/components/kora/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

import { useTheme } from "@/components/kora/ThemeProvider";

function LayoutContent({ children }) {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen" style={{ color: theme === 'light' ? '#ffffff' : '#1a2f42' }}>
      {children}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <style>{`
          :root {
            --dark-bg: #ffffff;
            --dark-card: #ffffff;
          }
        `}</style>
        <LayoutContent>{children}</LayoutContent>
      </ErrorBoundary>
    </ThemeProvider>
  );
}