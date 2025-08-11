import { StandingDeskTimer } from "./components/StandingDeskTimer";
import { ThemeProvider } from "./components/theme-provider";
import { StarsBackground } from "./components/ui/stars-background";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <StandingDeskTimer />
      <StarsBackground className="fixed inset-0" />
    </ThemeProvider>
  );
}

export default App;
