import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import 'leaflet/dist/leaflet.css';
import RoadSenseApp from "./components/RoadSenseApp";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RoadSenseApp />
  </React.StrictMode>
);