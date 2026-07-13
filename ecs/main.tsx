import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PythonStudio from "../app/PythonStudio";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PythonStudio />
  </StrictMode>,
);
