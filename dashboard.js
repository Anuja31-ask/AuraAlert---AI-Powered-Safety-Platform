/* =========================================
   AuraAlert – Dashboard Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  loadContacts();
  loadReports();
  renderAreaChart();
  updateSafetyScore();
  startLocationWatch();
});

// ── Load User Profile ──
function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem('aura_user') || '{}');
  if (!user.name) return;

  const initial = user.name[0].toUpperCase();

  // Sidebar
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarName = document.getElementById('sidebarName');
  const sidebarRole = document.getElementById('sidebarRole');
  if (sidebarAvatar) sidebarAvatar.textContent = initial;
  if (sidebarName) sidebarName.textContent = user.name;
  if (sidebarRole) sidebarRole.textContent = user.role === 'admin' ? '🔧 Administrator' : '🛡️ Member';

  // Welcome
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg) welcomeMsg.textContent = `${greeting}, ${user.name.split(' ')[0]}! 👋`;

  // Profile card
  const profileAvatar = document.getElementById('profileAvatar');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profilePhone = document.getElementById('profilePhone');
  const profileCity = document.getElementById('profileCity');
  const profileBlood = document.getElementById('profileBlood');
  const profileJoin = document.getElementById('profileJoin');

  if (profileAvatar) profileAvatar.textContent = initial;
  if (profileName) profileName.textContent = user.name;
  if (profileEmail) profileEmail.textContent = user.email;
  if (profilePhone) profilePhone.textContent = '📱 ' + (user.phone || 'Not set');
  if (profileCity) profileCity.textContent = user.city ? '📍 ' + user.city : '';
  if (profileBlood) profileBlood.textContent = user.bloodGroup || '—';
  if (profileJoin) profileJoin.textContent = user.joinDate || 'Recent';

  // Admin link
  const adminLink = document.getElementById('adminSidebarLink');
  if (adminLink && user.role === 'admin') adminLink.style.display = 'flex';
}

// ── Load Contacts ──
function loadContacts() {
  const user = JSON.parse(localStorage.getItem('aura_user') || '{}');
  const contacts = user.contacts || [];
  const el = document.getElementById('contactsList');
  const countEl = document.getElementById('contactCount');

  if (countEl) countEl.textContent = contacts.length;

  if (!el) return;

  if (!contacts.length) {
    el.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:1.5rem;font-size:0.85rem;">
      No contacts added yet.<br/>
      <a href="#" onclick="addContact()" style="color:var(--cyan);margin-top:6px;display:inline-block;">+ Add Emergency Contact</a>
    </div>`;
    return;
  }

  el.innerHTML = contacts.map((c, i) => `
    <div class="contact-item">
      <div class="contact-avatar">${c.name[0]}</div>
      <div class="contact-info">
        <h4>${c.name}</h4>
        <p>${c.relation} · ${c.phone}</p>
      </div>
      <div class="contact-actions">
        <a href="tel:${c.phone}" class="btn btn-ghost btn-sm btn-icon" title="Call">📞</a>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="removeContact(${i})" title="Remove">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ── Add Contact ──
function addContact() {
  const name = prompt('Contact Name:');
  if (!name) return;
  const phone = prompt('Phone Number:');
  if (!phone) return;
  const relation = prompt('Relation (e.g. Mother, Sister, Friend):') || 'Family';

  const user = JSON.parse(localStorage.getItem('aura_user') || '{}');
  if (!user.contacts) user.contacts = [];
  user.contacts.push({ name, phone, relation });
  localStorage.setItem('aura_user', JSON.stringify(user));

  // Update in users array
  const users = JSON.parse(localStorage.getItem('aura_users') || '[]');
  const idx = users.findIndex(u => u.email === user.email);
  if (idx >= 0) { users[idx] = user; localStorage.setItem('aura_users', JSON.stringify(users)); }

  loadContacts();
  showToast('success', 'Contact added', `${name} added as emergency contact.`);
}

// ── Remove Contact ──
function removeContact(i) {
  if (!confirm('Remove this contact?')) return;
  const user = JSON.parse(localStorage.getItem('aura_user') || '{}');
  user.contacts.splice(i, 1);
  localStorage.setItem('aura_user', JSON.stringify(user));

  const users = JSON.parse(localStorage.getItem('aura_users') || '[]');
  const idx = users.findIndex(u => u.email === user.email);
  if (idx >= 0) { users[idx] = user; localStorage.setItem('aura_users', JSON.stringify(users)); }

  loadContacts();
  showToast('info', 'Contact removed', 'Emergency contact removed.');
}

// ── Load Reports ──
function loadReports() {
  const reports = JSON.parse(localStorage.getItem('aura_reports') || '[]');
  const myReports = document.getElementById('myReports');
  const reportCount = document.getElementById('reportCount');
  const tbody = document.getElementById('reportsTable');

  if (myReports) myReports.textContent = reports.length;
  if (reportCount) reportCount.textContent = reports.length;

  if (!tbody) return;

  if (!reports.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">
      No reports yet. <a href="report.html" style="color:var(--cyan);">Report an incident →</a>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = reports.slice(0, 8).map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${r.type}</td>
      <td>${r.area}, ${r.city}</td>
      <td><span class="badge ${r.riskLevel === 'high' ? 'badge-danger' : r.riskLevel === 'medium' ? 'badge-caution' : 'badge-safe'}">${r.riskLevel}</span></td>
      <td style="color:${r.anonymous ? 'var(--green)' : 'var(--yellow)'};">${r.anonymous ? '🔒 Yes' : '👤 No'}</td>
    </tr>
  `).join('');
}

// ── Area Chart ──
function renderAreaChart() {
  const el = document.getElementById('areaChart');
  if (!el) return;

  const topAreas = (window.CRIME_DATA || [])
    .sort((a, b) => b.crime_count - a.crime_count)
    .slice(0, 7);

  const maxCount = topAreas[0]?.crime_count || 100;

  el.innerHTML = topAreas.map(d => {
    const height = Math.round((d.crime_count / maxCount) * 160);
    const col = d.risk_level === 'high' ? 'red' : d.risk_level === 'medium' ? 'yellow' : 'green';
    return `
      <div class="bar-item" title="${d.area}: ${d.crime_count} incidents">
        <div class="bar ${col}" style="height:${height}px;"></div>
        <div class="bar-label">${d.area.split(' ')[0]}</div>
      </div>
    `;
  }).join('');
}

// ── Safety Score (AI simulation) ──
function updateSafetyScore() {
  const hour = new Date().getHours();
  let base = 85;
  if (hour >= 22 || hour < 5) base -= 30;
  else if (hour >= 18) base -= 15;
  else if (hour < 7) base -= 10;

  const scoreEl = document.getElementById('safetyScore');
  if (scoreEl) scoreEl.textContent = Math.max(20, base + Math.floor(Math.random() * 10));
}

// ── Edit Profile ──
function editProfile() {
  const user = JSON.parse(localStorage.getItem('aura_user') || '{}');
  const newName = prompt('Your Name:', user.name || '');
  if (!newName) return;
  const newPhone = prompt('Phone:', user.phone || '');
  const newBlood = prompt('Blood Group:', user.bloodGroup || '');
  const newMed = prompt('Medical Conditions:', user.medConditions || '');

  user.name = newName;
  user.phone = newPhone;
  user.bloodGroup = newBlood;
  user.medConditions = newMed;

  localStorage.setItem('aura_user', JSON.stringify(user));
  const users = JSON.parse(localStorage.getItem('aura_users') || '[]');
  const idx = users.findIndex(u => u.email === user.email);
  if (idx >= 0) { users[idx] = user; localStorage.setItem('aura_users', JSON.stringify(users)); }

  loadUserProfile();
  showToast('success', 'Profile updated', 'Your changes have been saved.');
}

// ── Live Location Watch ──
function startLocationWatch() {
  if (!navigator.geolocation) return;

  navigator.geolocation.watchPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      updateZoneStatus(lat, lng);
      updateLocationDisplay(lat, lng);
    },
    () => {
      // Default to Pune
      updateZoneStatus(18.5204, 73.8567);
      updateLocationDisplay(18.5204, 73.8567);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

// ── Zone Status ──
function updateZoneStatus(lat, lng) {
  const data = window.CRIME_DATA || [];
  let closestDist = Infinity;
  let closestZone = null;

  data.forEach(d => {
    const dist = getDistance(lat, lng, d.lat, d.lng);
    if (dist < closestDist) {
      closestDist = dist;
      closestZone = d;
    }
  });

  const zoneBar = document.getElementById('zoneBar');
  const zoneText = document.getElementById('zoneText');
  const safetyStatus = document.getElementById('safetyStatus');
  const safetyStatusNav = document.getElementById('safetyStatusNav');

  if (!zoneBar) return;

  if (closestZone && closestDist < 1) {
    // DANGER
    zoneBar.className = 'zone-bar danger';
    if (zoneText) zoneText.textContent = `⚠️ DANGER: ${closestZone.area} (${closestDist.toFixed(2)} km)`;
    if (safetyStatus) { safetyStatus.className = 'badge badge-danger'; safetyStatus.textContent = '⚠️ Danger Zone'; }
    if (safetyStatusNav) { safetyStatusNav.className = 'badge badge-danger'; safetyStatusNav.textContent = '⚠️ Danger'; }
  } else if (closestZone && closestDist < 3) {
    // CAUTION
    zoneBar.className = 'zone-bar caution';
    if (zoneText) zoneText.textContent = `⚠️ CAUTION: ${closestZone.area} nearby (${closestDist.toFixed(2)} km)`;
    if (safetyStatus) { safetyStatus.className = 'badge badge-caution'; safetyStatus.textContent = '⚠️ Caution Zone'; }
    if (safetyStatusNav) { safetyStatusNav.className = 'badge badge-caution'; safetyStatusNav.textContent = '⚠️ Caution'; }
  } else {
    // SAFE
    zoneBar.className = 'zone-bar safe';
    if (zoneText) zoneText.textContent = '✅ You are in a SAFE zone';
    if (safetyStatus) { safetyStatus.className = 'badge badge-safe'; safetyStatus.textContent = '✅ Safe Zone'; }
    if (safetyStatusNav) { safetyStatusNav.className = 'badge badge-safe'; safetyStatusNav.textContent = '✅ Safe'; }
  }

  // Update nearby alerts count
  const nearbyEl = document.getElementById('nearbyAlerts');
  if (nearbyEl) {
    const nearby = data.filter(d => getDistance(lat, lng, d.lat, d.lng) < 5 && d.risk_level === 'high').length;
    nearbyEl.textContent = nearby;
  }
}

function updateLocationDisplay(lat, lng) {
  const locationInfo = document.getElementById('locationInfo');
  const zoneLocation = document.getElementById('zoneLocation');
  const text = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  if (locationInfo) locationInfo.textContent = text;
  if (zoneLocation) zoneLocation.textContent = text;
}

// Expose
window.addContact = addContact;
window.removeContact = removeContact;
window.editProfile = editProfile;
