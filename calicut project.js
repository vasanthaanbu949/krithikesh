import React, { useState, useRef, useEffect } from "react";

// RoadSense App - Final Fixed Version with working Map
export default function RoadSenseApp() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const tabs = [
    { id: "dashboard", icon: "🗺️", label: "Dashboard" },
    { id: "detection", icon: "📷", label: "Crack Detection" },
    { id: "alerts", icon: "⚠️", label: "Alerts & Reports" },
    { id: "healing", icon: "🧩", label: "Self-Healing Tracker" }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white py-4 shadow-md flex items-center justify-center">
        <h1 className="text-2xl font-bold tracking-wide">🚗 RoadSense — Smart Road Health Monitor</h1>
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
        {selectedTab === "dashboard" && <Dashboard />}
        {selectedTab === "detection" && <CrackDetection />}
        {selectedTab === "alerts" && <AlertsReports />}
        {selectedTab === "healing" && <HealingTracker />}
      </main>
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl p-4 shadow-lg ${className}`}>{children}</div>;
}

// ---------------- Dashboard ----------------
function Dashboard() {
  const roads = [
    { id: 1, lat: 13.0827, lon: 80.2707, status: "Healthy" },
    { id: 2, lat: 13.05, lon: 80.22, status: "Moderate" },
    { id: 3, lat: 13.1, lon: 80.28, status: "Critical" }
  ];

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">🧭 Real-Time Road Health Map (demo)</h2>
      <div className="w-full rounded-xl overflow-hidden bg-gray-50 border" style={{ height: 420 }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#f0f4f8' }}>
          {roads.map((r) => {
            const left = ((r.lon - 80.22) / (80.28 - 80.22)) * 100;
            const top = ((13.1 - r.lat) / (13.1 - 13.05)) * 100;
            const color = r.status === 'Healthy' ? '#16a34a' : r.status === 'Moderate' ? '#f59e0b' : '#ef4444';
            return (
              <div
                key={r.id}
                style={{
                  position: 'absolute',
                  top: `${top}%`,
                  left: `${left}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 10
                }}
              >
                {r.id}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-gray-700">Roads are color-coded: 🟢 Healthy | 🟠 Moderate | 🔴 Critical</p>
    </Card>
  );
}

// ---------------- Crack Detection ----------------
function CrackDetection() {
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
    };
    img.src = url;
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">📷 Crack Detection</h2>
      <input type="file" accept="image/*" onChange={(e)=>handleImageFile(e.target.files[0])} />
      <div className="mt-4 flex gap-6 items-start">
        {imageURL && <img src={imageURL} alt="uploaded" className="w-64 rounded-xl shadow-md" />}
        <canvas ref={canvasRef} style={{ display: imageURL ? 'block' : 'none', maxWidth: 400, borderRadius: 8 }} />
        {resultText && <p className="mt-3 font-semibold">{resultText}</p>}
      </div>
    </Card>
  );
}

// ---------------- AlertsReports ----------------
function AlertsReports() {
  const alerts = [
    { id: 1, severity: "High", location: "NH-45, Chennai", status: "Pending" },
    { id: 2, severity: "Medium", location: "ECR, Pondicherry", status: "In Progress" },
    { id: 3, severity: "Low", location: "OMR, Chennai", status: "Resolved" }
  ];
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

// ---------------- HealingTracker ----------------
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