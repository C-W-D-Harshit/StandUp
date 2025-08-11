import { StandingDeskTimer } from "./components/StandingDeskTimer";
import { ThemeProvider } from "./components/theme-provider";
import { StarsBackground } from "./components/ui/stars-background";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <StandingDeskTimer />
      <StarsBackground className="fixed inset-0" />
      <Analytics />
    </ThemeProvider>
  );
}

export default App;
