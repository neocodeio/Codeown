import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react"
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ClerkWrapper } from "./lib/ClerkWrapper";
import "@fortawesome/fontawesome-svg-core/styles.css";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
    <BrowserRouter>
      <ClerkWrapper>
        <App />
        <SpeedInsights />
        <Analytics />
      </ClerkWrapper>
    </BrowserRouter>
);