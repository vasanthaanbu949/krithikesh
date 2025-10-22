````markdown
# RoadSense UI (krithikesh) - Global

This branch adds global map support using Leaflet and React-Leaflet, lets users search worldwide locations with Nominatim, click the map to add locations, and upload images per location for local crack-detection analysis.

Quick start:

1. Install
   npm install

2. Run dev server
   npm run dev

3. Build for production
   npm run build

Notes:
- The app uses OpenStreetMap tiles and Nominatim for geocoding; these services have usage policies. For production use, consider a service with an API key or your own geocoding backend.
- Crack detection is still a lightweight luminance heuristic in the client. Replace analyzeImageForCracks() with a server-side ML model or external API for production-grade detection and privacy.
- Uploaded images are stored in-memory (object URLs) and will not persist. Add a backend (S3, Firebase, etc.) to store images and alerts.

What's included in this branch:
- package.json (adds leaflet + react-leaflet)
- index.html
- src/main.jsx
- src/index.css
- src/components/RoadSenseApp.jsx (main app)
- tailwind and postcss configs (unchanged)

````