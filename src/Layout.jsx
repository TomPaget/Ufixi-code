import { ThemeProvider } from "@/components/kora/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import TimedAdBreak from "@/components/kora/TimedAdBreak";
import { useTheme } from "@/components/kora/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";

function LayoutContent({ children, currentPageName }) {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen" style={{ color: theme === 'light' ? '#ffffff' : '#1E2D40' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPageName}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.01, y: -4 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{ minHeight: '100vh' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <TimedAdBreak />
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
        <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
      </ErrorBoundary>
    </ThemeProvider>
  );
}