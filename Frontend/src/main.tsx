import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthContextProvider } from "./auth/context/AuthContext";
import { HistoryManagerProvider } from "./auth/context/historyManager";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthContextProvider>
      <HistoryManagerProvider>
        <App />
      </HistoryManagerProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
