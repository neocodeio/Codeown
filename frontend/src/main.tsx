import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react"
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ClerkWrapper } from "./lib/ClerkWrapper";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

root.render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClerkWrapper>
          <App />
          <ToastContainer
            position="bottom-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastStyle={{ borderRadius: '12px', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
          />
          <SpeedInsights />
          <Analytics />
        </ClerkWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);