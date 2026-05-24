/* =========================================
   AuraAlert – Global Script
   ========================================= */

// ── Page Loader ──
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 400);
    }, 600);
  }
  initNav();
  checkAuth();
});

// ── Auth Check ──
function checkAuth() {
  const protectedPages = ['dashboard.html', 'sos.html', 'report.html', 'admin.html'];
  const currentPage = location.pathname.split('/').pop();
  const isLogged = localStorage.getItem('aura_logged') === 'true';

  if (protectedPages.includes(currentPage) && !isLogged) {
    showToast('warning', 'Login required', 'Please sign in to continue.');
    setTimeout(() => location.href = 'login.html', 1200);
    return;
  }

  if (currentPage === 'admin.html') {
    const user = JSON.parse(localStorage.getItem('aura_user') || '{}');
    if (user.role !== 'admin') {
      showToast('error', 'Access denied', 'Admins only.');
      setTimeout(() => location.href = 'dashboard.html', 1200);
    }
  }
}

// ── Nav Init ──
function initNav() {
  const isLogged = localStorage.getItem('aura_logged') === 'true';
  const user = JSON.parse(localStorage.getItem('aura_user') || '{}');

  // Update login/logout buttons if on index
  const loginBtn = document.getElementById('navLoginBtn');
  const regBtn = document.getElementById('navRegisterBtn');

  if (isLogged && loginBtn) {
    loginBtn.textContent = '📊 Dashboard';
    loginBtn.href = 'dashboard.html';
  }
  if (isLogged && regBtn) {
    regBtn.textContent = '👤 ' + (user.name ? user.name.split(' ')[0] : 'Account');
    regBtn.href = 'dashboard.html';
  }

  // Admin sidebar link
  const adminLink = document.getElementById('adminSidebarLink');
  if (adminLink && user.role === 'admin') adminLink.style.display = 'flex';

  // Highlight active nav
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(l => {
    if (l.href === location.href || l.href.endsWith(location.pathname.split('/').pop())) {
      l.classList.add('active');
    }
  });
}

// ── Hamburger Menu ──
function toggleMenu() {
  const nav = document.getElementById('navLinks');
  nav.classList.toggle('open');
}

// ── Logout ──
function logout() {
  localStorage.removeItem('aura_logged');
  localStorage.removeItem('aura_user');
  showToast('info', 'Signed out', 'You have been logged out.');
  setTimeout(() => location.href = 'login.html', 1000);
}

// ── Toast Notifications ──
function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Password Toggle ──
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// ── Format date ──
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Distance between coords (km) ──
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Crime Dataset ──
const CRIME_DATA = [
  {area:'Dharavi',crime_count:87,risk_level:'high',lat:19.0413,lng:72.8527,time:'night',city:'Mumbai',crime_type:'Assault'},
  {area:'Kurla West',crime_count:72,risk_level:'high',lat:19.0726,lng:72.8793,time:'night',city:'Mumbai',crime_type:'Harassment'},
  {area:'Govandi',crime_count:68,risk_level:'high',lat:19.0465,lng:72.9177,time:'evening',city:'Mumbai',crime_type:'Robbery'},
  {area:'Mankhurd',crime_count:61,risk_level:'high',lat:19.0503,lng:72.9347,time:'night',city:'Mumbai',crime_type:'Robbery'},
  {area:'Antop Hill',crime_count:55,risk_level:'high',lat:19.0198,lng:72.8589,time:'evening',city:'Mumbai',crime_type:'Assault'},
  {area:'Byculla',crime_count:49,risk_level:'medium',lat:18.9785,lng:72.8346,time:'evening',city:'Mumbai',crime_type:'Harassment'},
  {area:'Mazgaon',crime_count:44,risk_level:'medium',lat:18.9761,lng:72.8413,time:'evening',city:'Mumbai',crime_type:'Harassment'},
  {area:'Chembur',crime_count:42,risk_level:'medium',lat:19.0622,lng:72.8996,time:'night',city:'Mumbai',crime_type:'Robbery'},
  {area:'Malad East',crime_count:38,risk_level:'medium',lat:19.1763,lng:72.8587,time:'evening',city:'Mumbai',crime_type:'Suspicious'},
  {area:'Borivali East',crime_count:35,risk_level:'medium',lat:19.2313,lng:72.8777,time:'night',city:'Mumbai',crime_type:'Chain Snatching'},
  {area:'Kasba Peth',crime_count:78,risk_level:'high',lat:18.5159,lng:73.8545,time:'night',city:'Pune',crime_type:'Assault'},
  {area:'Kondhwa',crime_count:65,risk_level:'high',lat:18.4613,lng:73.8883,time:'night',city:'Pune',crime_type:'Robbery'},
  {area:'Hadapsar',crime_count:58,risk_level:'high',lat:18.5018,lng:73.9319,time:'evening',city:'Pune',crime_type:'Harassment'},
  {area:'Wanowrie',crime_count:52,risk_level:'high',lat:18.4912,lng:73.9028,time:'night',city:'Pune',crime_type:'Assault'},
  {area:'Yerwada',crime_count:47,risk_level:'medium',lat:18.5530,lng:73.9016,time:'evening',city:'Pune',crime_type:'Robbery'},
  {area:'Kothrud',crime_count:40,risk_level:'medium',lat:18.5074,lng:73.8088,time:'evening',city:'Pune',crime_type:'Harassment'},
  {area:'Pimpri',crime_count:38,risk_level:'medium',lat:18.6273,lng:73.7996,time:'night',city:'Pune',crime_type:'Suspicious'},
  {area:'Chinchwad',crime_count:35,risk_level:'medium',lat:18.6441,lng:73.8055,time:'evening',city:'Pune',crime_type:'Chain Snatching'},
  {area:'Shivajinagar',crime_count:30,risk_level:'medium',lat:18.5308,lng:73.8474,time:'evening',city:'Pune',crime_type:'Harassment'},
  {area:'Deccan Gymkhana',crime_count:25,risk_level:'low',lat:18.5167,lng:73.8393,time:'morning',city:'Pune',crime_type:'Suspicious'},
  {area:'Paharganj',crime_count:92,risk_level:'high',lat:28.6448,lng:77.2167,time:'night',city:'Delhi',crime_type:'Assault'},
  {area:'Sangam Vihar',crime_count:85,risk_level:'high',lat:28.5099,lng:77.2516,time:'night',city:'Delhi',crime_type:'Robbery'},
  {area:'Uttam Nagar',crime_count:79,risk_level:'high',lat:28.6213,lng:77.0563,time:'evening',city:'Delhi',crime_type:'Assault'},
  {area:'Nangloi',crime_count:74,risk_level:'high',lat:28.6758,lng:77.0627,time:'night',city:'Delhi',crime_type:'Robbery'},
  {area:'Shahdara',crime_count:68,risk_level:'high',lat:28.6708,lng:77.2913,time:'evening',city:'Delhi',crime_type:'Harassment'},
  {area:'Laxmi Nagar',crime_count:62,risk_level:'high',lat:28.6355,lng:77.2782,time:'night',city:'Delhi',crime_type:'Chain Snatching'},
  {area:'Karawal Nagar',crime_count:59,risk_level:'medium',lat:28.7516,lng:77.2534,time:'night',city:'Delhi',crime_type:'Suspicious'},
  {area:'Vikaspuri',crime_count:55,risk_level:'medium',lat:28.6391,lng:77.0708,time:'evening',city:'Delhi',crime_type:'Harassment'},
  {area:'Dwarka',crime_count:45,risk_level:'medium',lat:28.5823,lng:77.0500,time:'evening',city:'Delhi',crime_type:'Robbery'},
  {area:'Rohini',crime_count:42,risk_level:'medium',lat:28.7200,lng:77.1100,time:'night',city:'Delhi',crime_type:'Chain Snatching'},
  {area:'Koregaon Park',crime_count:22,risk_level:'low',lat:18.5362,lng:73.8941,time:'morning',city:'Pune',crime_type:'Suspicious'},
  {area:'Baner',crime_count:18,risk_level:'low',lat:18.5590,lng:73.7888,time:'morning',city:'Pune',crime_type:'Suspicious'},
  {area:'Hinjewadi',crime_count:15,risk_level:'low',lat:18.5912,lng:73.7389,time:'morning',city:'Pune',crime_type:'Suspicious'},
  {area:'Andheri West',crime_count:28,risk_level:'low',lat:19.1362,lng:72.8296,time:'morning',city:'Mumbai',crime_type:'Suspicious'},
  {area:'Bandra West',crime_count:20,risk_level:'low',lat:19.0596,lng:72.8295,time:'morning',city:'Mumbai',crime_type:'Suspicious'},
];

// Expose globally
window.CRIME_DATA = CRIME_DATA;
window.getDistance = getDistance;
window.showToast = showToast;
window.logout = logout;
window.togglePassword = togglePassword;
window.toggleMenu = toggleMenu;
