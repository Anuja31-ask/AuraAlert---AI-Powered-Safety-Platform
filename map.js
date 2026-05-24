/* =========================================
   AuraAlert – Map Module (Leaflet.js)
   ========================================= */

// Wait for Leaflet to load
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop();
  if (page === 'dashboard.html' || page === 'dashboard') initDashMap();
  if (page === 'heatmap.html' || page === 'heatmap') initHeatmap();
});

// ── Shared tile layer config ──
function getTileLayer() {
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  });
}

// ── User location marker ──
function addUserMarker(map, lat, lng) {
  const userIcon = L.divIcon({
    html: `<div style="
      width:18px;height:18px;
      background:#06b6d4;
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 0 0 4px rgba(6,182,212,0.3), 0 0 20px rgba(6,182,212,0.5);
      animation:none;
    "></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  const marker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
  marker.bindPopup('<b>📍 Your Location</b><br/>Stay safe!');

  // Accuracy circle
  L.circle([lat, lng], {
    radius: 300,
    color: '#06b6d4',
    fillColor: '#06b6d4',
    fillOpacity: 0.08,
    weight: 1
  }).addTo(map);

  return marker;
}

// ── Crime zone circle ──
function addCrimeZone(map, data) {
  const color = data.risk_level === 'high' ? '#ef4444' : data.risk_level === 'medium' ? '#f59e0b' : '#22c55e';
  const radius = data.crime_count * 80;

  const circle = L.circle([data.lat, data.lng], {
    radius,
    color,
    fillColor: color,
    fillOpacity: data.risk_level === 'high' ? 0.25 : 0.15,
    weight: data.risk_level === 'high' ? 2 : 1,
  }).addTo(map);

  circle.bindPopup(`
    <div style="font-family:'DM Sans',sans-serif;min-width:160px;">
      <div style="font-weight:800;font-size:0.95rem;margin-bottom:6px;">${data.area}</div>
      <div style="font-size:0.78rem;color:#64748b;margin-bottom:4px;">📍 ${data.city}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};"></span>
        <span style="font-weight:700;text-transform:capitalize;color:${color};">${data.risk_level} Risk</span>
      </div>
      <div style="font-size:0.78rem;margin-bottom:2px;">🚨 Incidents: <strong>${data.crime_count}</strong></div>
      <div style="font-size:0.78rem;margin-bottom:2px;">⚠️ Type: ${data.crime_type}</div>
      <div style="font-size:0.78rem;">🕐 Peak: ${data.time}</div>
    </div>
  `);

  return circle;
}

// ── Dashboard Mini Map ──
function initDashMap() {
  const mapEl = document.getElementById('dashMap');
  if (!mapEl || !window.L) return;

  const map = L.map('dashMap', { zoomControl: true, scrollWheelZoom: false }).setView([18.5204, 73.8567], 12);
  getTileLayer().addTo(map);

  // Add crime zones for Pune
  const puneData = (window.CRIME_DATA || []).filter(d => d.city === 'Pune');
  puneData.forEach(d => addCrimeZone(map, d));

  // Try get user location
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      map.setView([lat, lng], 13);
      addUserMarker(map, lat, lng);
    },
    () => {
      addUserMarker(map, 18.5204, 73.8567);
    }
  );
}

// ── Full Heatmap ──
function initHeatmap() {
  const mapEl = document.getElementById('mainMap');
  if (!mapEl || !window.L) return;

  const map = L.map('mainMap', { zoomControl: true }).setView([20.5937, 78.9629], 5);
  getTileLayer().addTo(map);

  window.auraMap = map;
  window.crimeMarkers = [];

  // Plot all crime zones
  (window.CRIME_DATA || []).forEach(d => {
    const marker = addCrimeZone(map, d);
    window.crimeMarkers.push({ marker, data: d });
  });

  // Risk list in side panel
  buildRiskList();
  buildAreaStats();
  setAIPrediction();

  // User location
  locateMe();
}

// ── Locate Me ──
function locateMe() {
  const map = window.auraMap;
  if (!map) return;

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      map.setView([lat, lng], 14);

      // Remove old user marker
      if (window.userMarker) map.removeLayer(window.userMarker);
      window.userMarker = addUserMarker(map, lat, lng);

      // Check danger zones
      checkDangerZones(lat, lng);

      // Update panel
      const locText = document.getElementById('locationText');
      if (locText) locText.textContent = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      showToast('success', 'Location found', 'Map centered to your position.');
    },
    err => {
      showToast('warning', 'Location error', 'Using default location (Pune).');
      if (map) map.setView([18.5204, 73.8567], 12);
      addUserMarker(map, 18.5204, 73.8567);
    }
  );
}

// ── Danger Zone Check ──
function checkDangerZones(userLat, userLng) {
  const data = window.CRIME_DATA || [];
  let inDanger = false;
  let nearestDanger = null;
  let nearestDist = Infinity;

  data.forEach(d => {
    if (d.risk_level !== 'high') return;
    const dist = getDistance(userLat, userLng, d.lat, d.lng);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestDanger = d;
    }
    if (dist < 1) inDanger = true;
  });

  // Zone bar
  const zoneBar = document.getElementById('zoneBar');
  const zoneText = document.getElementById('zoneText');
  const zoneLocation = document.getElementById('zoneLocation');
  const mySafetyStatus = document.getElementById('mySafetyStatus');

  if (zoneLocation) zoneLocation.textContent = `📍 ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;

  if (inDanger) {
    if (zoneBar) { zoneBar.className = 'zone-bar danger'; }
    if (zoneText) zoneText.textContent = `⚠️ DANGER: ${nearestDanger.area} hotspot within 1km!`;
    if (mySafetyStatus) { mySafetyStatus.className = 'badge badge-danger'; mySafetyStatus.textContent = '⚠️ Danger Zone'; }

    // Show modal
    const modal = document.getElementById('dangerModal');
    const modalText = document.getElementById('dangerModalText');
    if (modal) {
      if (modalText) modalText.textContent = `You are within 1km of ${nearestDanger.area} — a HIGH RISK zone with ${nearestDanger.crime_count} reported incidents.`;
      modal.classList.add('show');
    }

    // Vibrate
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);

  } else if (nearestDist < 3) {
    if (zoneBar) zoneBar.className = 'zone-bar caution';
    if (zoneText) zoneText.textContent = `⚠️ Caution: ${nearestDanger?.area} is ${nearestDist.toFixed(1)}km away`;
    if (mySafetyStatus) { mySafetyStatus.className = 'badge badge-caution'; mySafetyStatus.textContent = '⚠️ Caution'; }
  } else {
    if (zoneBar) zoneBar.className = 'zone-bar safe';
    if (zoneText) zoneText.textContent = '✅ You are in a SAFE zone';
    if (mySafetyStatus) { mySafetyStatus.className = 'badge badge-safe'; mySafetyStatus.textContent = '✅ Safe Zone'; }
  }
}

function closeDangerModal() {
  const modal = document.getElementById('dangerModal');
  if (modal) modal.classList.remove('show');
}

// ── Risk List (side panel) ──
function buildRiskList() {
  const el = document.getElementById('riskList');
  if (!el) return;

  const top = (window.CRIME_DATA || [])
    .filter(d => d.risk_level === 'high')
    .sort((a, b) => b.crime_count - a.crime_count)
    .slice(0, 5);

  el.innerHTML = top.map(d => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
      <div>
        <div style="font-size:0.82rem;font-weight:600;">${d.area}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);">${d.city} · ${d.crime_type}</div>
      </div>
      <span class="badge badge-danger" style="font-size:0.7rem;">${d.crime_count}</span>
    </div>
  `).join('');
}

// ── Area Stats (side panel) ──
function buildAreaStats() {
  const el = document.getElementById('areaStats');
  if (!el) return;

  const data = window.CRIME_DATA || [];
  const cities = {};
  data.forEach(d => {
    if (!cities[d.city]) cities[d.city] = { total: 0, high: 0 };
    cities[d.city].total += d.crime_count;
    if (d.risk_level === 'high') cities[d.city].high++;
  });

  el.innerHTML = Object.entries(cities).map(([city, s]) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
      <span style="font-weight:600;">📍 ${city}</span>
      <span>${s.total} incidents &nbsp;<span style="color:var(--red);">${s.high} high-risk</span></span>
    </div>
  `).join('');
}

// ── AI Prediction ──
function setAIPrediction() {
  const el = document.getElementById('aiPrediction');
  if (!el) return;

  const hour = new Date().getHours();
  let msg = '';

  if (hour >= 22 || hour < 5) {
    msg = '🔴 <strong>HIGH RISK TIME</strong> — Late night hours show 3.2x higher crime rates. Avoid isolated areas. Use well-lit routes only.';
  } else if (hour >= 18) {
    msg = '🟡 <strong>MEDIUM RISK TIME</strong> — Evening hours have elevated crime rates. Stay aware of surroundings. Avoid Kasba Peth and Hadapsar areas in Pune.';
  } else if (hour >= 12) {
    msg = '🟡 <strong>MODERATE RISK</strong> — Afternoon is generally safer but remain cautious in high-risk zones. Share your location with contacts.';
  } else {
    msg = '🟢 <strong>LOW RISK TIME</strong> — Morning hours are safest. Crime rates are 80% lower. Good time for travel.';
  }

  msg += '<br/><br/>📅 Peak crime days: <strong>Friday–Saturday nights</strong><br/>🎯 Predicted hotspot: <strong>Kasba Peth, Dharavi</strong>';
  el.innerHTML = msg;
}

// Expose
window.locateMe = locateMe;
window.closeDangerModal = closeDangerModal;
