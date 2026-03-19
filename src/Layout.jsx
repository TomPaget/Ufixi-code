import { ThemeProvider } from "@/components/kora/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTheme } from "@/components/kora/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/kora/BottomNav";
import { useNav } from "@/lib/NavigationContext";

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
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <style>{`
          :root {
            --color-primary: #E8530A;
            --color-primary-hover: #C94408;
            --color-accent: #D93870;
            --color-success: #1D9E75;
            --color-text-primary: #00172F;
            --color-text-secondary: rgba(0,23,47,0.55);
            --color-bg: #FDF6EE;
            --color-surface: rgba(255,255,255,0.55);
          }
          body {
            background: #FDF6EE;
            min-height: 100vh;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #00172F;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Vetch', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            letter-spacing: -0.02em;
          }
        `}</style>
        <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
      </ErrorBoundary>
    </ThemeProvider>
  );
}