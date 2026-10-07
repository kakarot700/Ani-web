import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// The old localStorage "auth" layer is gone — wipe any credentials it left
// behind, since it stored passwords in plain text.
for (const key of ["otaku-users", "otaku-current-user"]) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
