import { ThemeProvider } from "@/components/kora/ThemeProvider";
import BannerAd from "@/components/kora/BannerAd";

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        {children}
        <BannerAd />
      </div>
    </ThemeProvider>
  );
}