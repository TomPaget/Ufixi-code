import { ThemeProvider } from "@/components/kora/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTheme } from "@/components/kora/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/kora/BottomNav";
import { NavigationProvider, useNav } from "@/lib/NavigationContext";

/** Variants for slide-based page transitions. */
const variants = {
  forward: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit:    { x: '-40%', opacity: 0 },
  },
  backward: {
    initial: { x: '-40%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit:    { x: '100%', opacity: 0 },
  },
  none: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit:    { opacity: 0 },
  },
};

const TRANSITION = { duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] };

function LayoutContent({ children, currentPageName }) {
  const { theme } = useTheme();
  const { direction } = useNav();
  const v = variants[direction] ?? variants.forward;

  return (
    <div className="min-h-screen" style={{ color: theme === 'light' ? '#ffffff' : '#1a2f42', overflowX: 'hidden' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentPageName}
          initial={v.initial}
          animate={v.animate}
          exit={v.exit}
          transition={TRANSITION}
          style={{ minHeight: '100vh', willChange: 'transform' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <BottomNav />
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
        {/* NavigationProvider lives inside Router (via App.jsx), so it can use useNavigate/useLocation */}
        <NavigationProvider>
          <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
        </NavigationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}