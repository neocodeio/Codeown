import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react"
import App from "./App";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { BrowserRouter } from "react-router-dom";
import { ClerkWrapper } from "./lib/ClerkWrapper";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://err_eb74f2b31931879fd2d80af35c4d347b5fc1d43c388b2e8490@ingest.errgent.com/15",
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});
// Unregister any existing service workers to prevent errors
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('Unregistering existing service worker:', registration);
      registration.unregister();
    }
  }).catch(function(error) {
    console.log('Service worker unregistration failed:', error);
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const container = document.getElementById("root");
const root = createRoot(container!);

const AppWrapper = () => {
  const { theme } = useTheme();
  
  return (
    <>
      <App />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
        toastStyle={{
          borderRadius: '2px',
          fontSize: '13px',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          boxShadow: 'none',
          border: '0.5px solid var(--border-hairline)',
          backgroundColor: 'var(--bg-page)',
          color: 'var(--text-primary)',
          textTransform: 'uppercase'
        }}
      />
      <SpeedInsights />
      <Analytics />
    </>
  );
};

root.render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <ClerkWrapper>
            <AppWrapper />
          </ClerkWrapper>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);