import { ThemeProvider } from "@/components/kora/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTheme } from "@/components/kora/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/kora/BottomNav";

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
            transition={{ duration: 0.12, ease: "easeInOut" }}
            style={{ minHeight: '100vh' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <style>{`
                :root {
                  --color-primary: #7C6FE0;
                  --color-primary-hover: #6B5FD0;
                  --color-accent: #E264AB;
                  --color-success: #1D9E75;
                  --color-text-primary: #151528;
                  --color-text-secondary: #6B6A8E;
                  --color-bg: #F5F4FF;
                  --color-surface: #FFFFFF;
                }
                body {
                  background: linear-gradient(135deg, #fdf6ff 0%, #fff5f0 50%, #fef0fa 100%);
                  min-height: 100vh;
                  font-family: 'DM Sans', sans-serif;
                }
              `}</style>
        <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
      </ErrorBoundary>
    </ThemeProvider>
  );
}