import { ThemeProvider } from "@/components/kora/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import TimedAdBreak from "@/components/kora/TimedAdBreak";
import { useTheme } from "@/components/kora/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";

function LayoutContent({ children, currentPageName }) {
    const { theme } = useTheme();

    return (
      <div className="min-h-screen" style={{ color: theme === 'light' ? '#ffffff' : '#1a2f42' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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
                body {
                  background: linear-gradient(160deg, #B8D8D8 0%, #C8D8E8 40%, #D0D8E8 70%, #C8D0E0 100%);
                  min-height: 100vh;
                }
              `}</style>
        <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
      </ErrorBoundary>
    </ThemeProvider>
  );
}