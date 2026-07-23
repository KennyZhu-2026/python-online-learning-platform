import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PythonStudio from "./PythonStudio";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PythonStudio />
  </StrictMode>,
);
