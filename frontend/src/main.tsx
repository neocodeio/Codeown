import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react"
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ClerkWrapper } from "./lib/ClerkWrapper";
import "@fortawesome/fontawesome-svg-core/styles.css";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://542b494407c8004af3549ac6080c9239@o4510801216995328.ingest.us.sentry.io/4510801218240512",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

const container = document.getElementById("root");
const root = createRoot(container!);

// Add this button component to your app to test Sentry's error tracking
function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
    >
      Break the world
    </button>
  );
}

root.render(
  <Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>}>
    <BrowserRouter>
      <ClerkWrapper>
        <App />
        <SpeedInsights />
        <Analytics />
      </ClerkWrapper>
    </BrowserRouter>
    <ErrorButton />
  </Sentry.ErrorBoundary>
);