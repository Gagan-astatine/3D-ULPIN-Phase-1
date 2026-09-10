import React from "react";
import { createRoot } from "react-dom/client";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./styles/global.css";
import App from "./App.jsx";

// Resolve relative to the application URL, including deployments in subdirectories.
window.CESIUM_BASE_URL = new URL("cesium/", document.baseURI).href;
createRoot(document.getElementById("root")).render(<App />);
