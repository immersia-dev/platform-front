import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css"; // ⚠️ ESSENCIAL

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={typeof __XR_ENV_BASE__ !== 'undefined' ? __XR_ENV_BASE__ : ''}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
