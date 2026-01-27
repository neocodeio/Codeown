import ReactDOM from "react-dom/client";
import { StrictMode } from 'react'
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react"
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ClerkWrapper } from "./lib/ClerkWrapper";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js'
posthog.capture('my_custom_event', { property: 'value' })

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2025-11-30',
} as const

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkWrapper>
        <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
          <App />
          <SpeedInsights />
          <Analytics />
        </PostHogProvider>
      </ClerkWrapper>
    </BrowserRouter>
  </StrictMode>
);