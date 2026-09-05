import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { DarkModeProvider } from "./context/DarkModeContext.jsx";
import "./index.css";

// Registered only in production builds: the dev server already serves fresh
// content on every request, and a service worker caching `npm run dev`'s
// output would be a confusing thing to debug around. Registration itself is
// wrapped in a try/catch and gated on browser support -- a browser without
// service worker support (or one that blocks it, e.g. some in-app browsers)
// just runs the site as an ordinary page, nothing depends on this succeeding.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <DarkModeProvider>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </DarkModeProvider>,
);
