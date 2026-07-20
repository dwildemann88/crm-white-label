import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { CrmProvider } from "./app/CrmContext";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CrmProvider>
      <App />
    </CrmProvider>
  </StrictMode>,
);

// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import { SupabaseConnectionTest } from "./pages/SupabaseConnectionTest";

// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <SupabaseConnectionTest />
//   </StrictMode>,
// );
