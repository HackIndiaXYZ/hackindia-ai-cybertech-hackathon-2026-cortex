import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClimateThemeProvider } from "./theme/ClimateThemeProvider";
import { LocationProvider } from "./context/LocationContext";
import AnimatedBackground from "./components/AnimatedBackground";
import NavBar from "./components/NavBar";
import DisclaimerBanner from "./components/DisclaimerBanner";
import Footer from "./components/Footer";
import ZoneDebugSwitcher from "./components/ZoneDebugSwitcher";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import ComparePage from "./pages/ComparePage";
import LibraryPage from "./pages/LibraryPage";
import EmergencyPage from "./pages/EmergencyPage";
import { ToastProvider } from "./components/Toast";
import ScrollToTop from "./components/ScrollToTop";

/** Inner component so we can call useLocation inside <BrowserRouter> */
function AnimatedRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<HomePage />}      />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/compare"   element={<ComparePage />}   />
      <Route path="/library"   element={<LibraryPage />}   />
      <Route path="/emergency" element={<EmergencyPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ClimateThemeProvider initial="NEUTRAL">
        <LocationProvider>
          {/* Canvas / static background - sits behind everything (z-index -1) */}
          <AnimatedBackground />

        <BrowserRouter>
          <ScrollToTop />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100dvh",
              /* background is transparent so AnimatedBackground shows through */
              background: "transparent",
            }}
          >
            <NavBar />
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <AnimatedRoutes />
            </main>
            <DisclaimerBanner />
            <Footer />
          </div>
        </BrowserRouter>

        {/* Debug zone switcher - only rendered in dev builds */}
        {import.meta.env.DEV && <ZoneDebugSwitcher />}
      </LocationProvider>
    </ClimateThemeProvider>
    </ToastProvider>
  );
}
