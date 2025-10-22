import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's default icon path (works when bundlers don't copy images)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl p-4 shadow-lg ${className}`}>{children}</div>;
}

export default function RoadSenseApp() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [markers, setMarkers] = useState(() => [
    { id: 1, lat: 13.0827, lon: 80.2707, status: "Healthy", images: [] , name: 'Chennai, India'},
    { id: 2, lat: 40.7128, lon: -74.0060, status: "Moderate", images: [] , name: 'New York, USA'},
    { id: 3, lat: 51.5074, lon: -0.1278, status: "Critical", images: [] , name: 'London, UK'}
  ]);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [zoom, setZoom] = useState(2);

  const tabs = [
    { id: "dashboard", icon: "🗺️", label: "Dashboard" },
    { id: "detection", icon: "📷", label: "Crack Detection" },
    { id: "alerts", icon: "⚠️", label: "Alerts & Reports" },
    { id: "healing", icon: "🧩", label: "Self-Healing Tracker" }
  ];

  function addMarker(lat, lon, name) {
    setMarkers(prev => {
      const id = prev.length ? Math.max(...prev.map(m => m.id)) + 1 : 1;
      return [...prev, { id, lat, lon, status: 'Unknown', images: [], name: name || `Point ${id}` }];
    });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white py-4 shadow-md flex items-center justify-center">
        <h1 className="text-2xl font-bold tracking-wide">🚗 RoadSense — Global Road Health Monitor</h1>
      </header>

      <nav className="flex justify-around bg-white shadow-md py-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex flex-col items-center text-sm font-medium transition-all ${
              selectedTab === tab.id ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 p-6">
        {selectedTab === "dashboard" && (
          <DashboardGlobal
            markers={markers}
            addMarker={addMarker}
            center={mapCenter}
            zoom={zoom}
            setMapCenter={setMapCenter}
            setZoom={setZoom}
            setMarkers={setMarkers}
          />
        )}
        {selectedTab === "detection" && <CrackDetectionGlobal markers={markers} setMarkers={setMarkers} addMarker={addMarker} />}
        {selectedTab === "alerts" && <AlertsReports markers={markers} />}
        {selectedTab === "healing" && <HealingTracker />}
      </main>
    </div>
  );
}

function DashboardGlobal({ markers, addMarker, center, zoom, setMapCenter, setZoom, setMarkers }) {
  const [query, setQuery] = useState('');
  const mapRef = useRef();

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const name = window.prompt('Name for this location (optional)');
        addMarker(e.latlng.lat, e.latlng.lng, name || 'User location');
      },
      moveend(e) {
        const map = e.target;
        setMapCenter([map.getCenter().lat, map.getCenter().lng]);
        setZoom(map.getZoom());
      }
    });
    return null;
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query) return;
    // Use Nominatim for geocoding
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await resp.json();
    if (data && data.length) {
      const first = data[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      setMapCenter([lat, lon]);
      setZoom(13);
    } else {
      alert('Location not found');
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">🗺️ Global Road Health Map</h2>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input aria-label="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search place or address" className="border px-3 py-1 rounded" />
          <button className="bg-blue-600 text-white px-3 py-1 rounded">Go</button>
        </form>
      </div>

      <div style={{ height: 520 }} className="rounded-xl overflow-hidden border">
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} whenCreated={map => mapRef.current = map}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
          {markers.map(m => (
            <Marker key={m.id} position={[m.lat, m.lon]}>
              <Popup>
                <div className="min-w-[200px]">
                  <b>{m.name || `Point ${m.id}`}</b>
                  <p>Status: <span className={`font-semibold ${m.status==='Healthy' ? 'text-green-600' : m.status==='Critical' ? 'text-red-600' : 'text-yellow-600'}`}>{m.status}</span></p>
                  <div className="mt-2">
                    <label className="text-sm">Upload image for detection:</label>
                    <input type="file" accept="image/*" onChange={async (e)=>{
                      const file = e.target.files[0];
                      if (!file) return;
                      const objectUrl = URL.createObjectURL(file);
                      const img = new Image();
                      img.onload = async () => {
                        const res = analyzeImageForCracks(img);
                        setMarkers(prev => prev.map(pm => pm.id===m.id ? { ...pm, images: [...pm.images, { url: objectUrl, result: res }] } : pm));
                      };
                      img.src = objectUrl;
                    }} />
                  </div>
                  {m.images && m.images.length>0 && (
                    <div className="mt-2">
                      <b>Images</b>
                      <ul className="mt-1">
                        {m.images.map((im, idx) => (
                          <li key={idx} className="py-1 border-t">
                            <img src={im.url} alt="uploaded" style={{ maxWidth: 160 }} />
                            <div className="text-sm mt-1">{im.result.detected ? '⚠️ Crack-like patterns' : '✅ No cracks detected'} — mean={im.result.mean.toFixed(2)}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p className="mt-3 text-gray-700">Tip: Click anywhere on the map to add a location. Use search to jump to a city or address worldwide.</p>
    </Card>
  );
}

function CrackDetectionGlobal({ markers, setMarkers, addMarker }) {
  const [selectedLocationId, setSelectedLocationId] = useState(markers[0]?.id || null);
  const [imageURL, setImageURL] = useState(null);
  const [resultText, setResultText] = useState(null);
  const canvasRef = useRef(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const analyzeImageForCracks = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not available");
    const ctx = canvas.getContext("2d");
    const maxDim = 512;
    let w = img.width;
    let h = img.height;
    if (Math.max(w, h) > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      gray[i] = 0.299 * data[i*4] + 0.587 * data[i*4+1] + 0.114 * data[i*4+2];
    }
    let sum = 0;
    for (let i=0; i<w*h; i++) sum += gray[i];
    const mean = sum / (w*h);
    return { mean, detected: mean>100 };
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageURL(url);
    setResultText("Analyzing...");
    const img = new Image();
    img.onload = () => {
      const res = analyzeImageForCracks(img);
      setResultText(res.detected ? `⚠️ Crack-like patterns detected — mean=${res.mean.toFixed(2)}` : `✅ No cracks detected — mean=${res.mean.toFixed(2)}`);
      // Attach to selected marker
      if (selectedLocationId) {
        setMarkers(prev => prev.map(pm => pm.id===selectedLocationId ? { ...pm, images: [...pm.images, { url, result: res }] } : pm));
      } else {
        // create a marker at (0,0)
        addMarker(0,0, 'New location');
      }
    };
    img.src = url;
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">📷 Crack Detection (global)</h2>
      <div className="flex gap-4 items-center">
        <label>Select location:</label>
        <select value={selectedLocationId||''} onChange={e=>setSelectedLocationId(Number(e.target.value))} className="border px-2 py-1 rounded">
          {markers.map(m => <option key={m.id} value={m.id}>{m.name || `Point ${m.id}`} ({m.lat.toFixed(2)},{m.lon.toFixed(2)})</option>)}
        </select>
        <input type="file" accept="image/*" onChange={(e)=>handleImageFile(e.target.files[0])} />
      </div>
      <div className="mt-4 flex gap-6 items-start">
        {imageURL && <img src={imageURL} alt="uploaded" className="w-64 rounded-xl shadow-md" />}
        <canvas ref={canvasRef} style={{ display: imageURL ? 'block' : 'none', maxWidth: 400, borderRadius: 8 }} />
        {resultText && <p className="mt-3 font-semibold">{resultText}</p>}
      </div>
    </Card>
  );
}

function AlertsReports({ markers }) {
  const alerts = markers.map(m => ({ id: m.id, severity: m.status === 'Critical' ? 'High' : m.status==='Moderate' ? 'Medium' : 'Low', location: m.name || `${m.lat.toFixed(2)},${m.lon.toFixed(2)}`, status: m.status=== 'Critical' ? 'Pending' : 'In Progress' }));
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">⚠️ Maintenance Alerts</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Severity</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map(a => (
            <tr key={a.id} className="border-b hover:bg-gray-50">
              <td className="py-2 font-medium">{a.severity}</td>
              <td>{a.location}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function HealingTracker() {
  const healingData = [
    { id: 1, zone: "Zone A", status: "Active" },
    { id: 2, zone: "Zone B", status: "Idle" },
    { id: 3, zone: "Zone C", status: "Repair Completed" }
  ];
  const statusColor = status => status==='Active' ? 'text-green-600' : status==='Idle' ? 'text-yellow-600' : 'text-blue-600';
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">🧩 Self-Healing Material Tracker</h2>
      <ul>
        {healingData.map(item => (
          <li key={item.id} className="flex justify-between py-2 border-b">
            <span className="font-medium">{item.zone}</span>
            <span className={`${statusColor(item.status)} font-semibold`}>{item.status}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}