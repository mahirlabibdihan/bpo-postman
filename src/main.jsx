import React from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./styles/global.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
