import { StandingDeskTimer } from "./components/StandingDeskTimer";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <StandingDeskTimer />
    </ThemeProvider>
  );
}

export default App;
