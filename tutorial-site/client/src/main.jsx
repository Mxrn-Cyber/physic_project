import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { DarkModeProvider } from "./context/DarkModeContext.jsx";
import "./index.css";
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
