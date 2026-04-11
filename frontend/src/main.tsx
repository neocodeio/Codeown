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
import { Toaster as SonnerToaster } from 'sonner';
import './index.css';
import * as Sentry from "@sentry/react";

// Fix "Loading chunk failed" permanently by detecting dynamic import failures
// and triggering a controlled reload to pull the latest consistent state.
window.addEventListener('error', (event) => {
  const errorMsg = event.message || "";
  const target = event.target as any;
  const isChunkError = errorMsg.includes('Loading chunk') || 
                      errorMsg.includes('Failed to fetch dynamically imported module') ||
                      (event.error?.name === 'ChunkLoadError') ||
                      (target?.tagName === 'SCRIPT' && (target?.src?.includes('clerk') || target?.src?.includes('chunk')));
                      
  if (isChunkError) {
    const lastReload = sessionStorage.getItem('last-chunk-reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 5000) {
      sessionStorage.setItem('last-chunk-reload', now.toString());
      window.location.reload();
    }
  }
}, true);

Sentry.init({
  dsn: "https://err_eb74f2b31931879fd2d80af35c4d347b5fc1d43c388b2e8490@ingest.errgent.com/15",
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  ignoreErrors: [
    "You've added multiple <ClerkProvider> components",
    /ClerkProvider/i,
  ],
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
          borderRadius: 'var(--radius-sm)',
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
      <SonnerToaster position="bottom-right" theme={theme === 'dark' ? 'dark' : 'light'} />
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