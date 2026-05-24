# 🛡️ AuraAlert – AI-Powered Women's Safety Platform

> Real-time geospatial crime analytics, danger zone detection, one-tap SOS, and AI safety intelligence.

![AuraAlert](https://img.shields.io/badge/AuraAlert-v1.0.0-06b6d4?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-green?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-3.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## 🎯 What is AuraAlert?

AuraAlert is a **production-ready AI-powered women's safety platform** that provides:

- 🗺️ **Live Crime Heatmap** — Interactive map with red/yellow/green risk zones
- ⚠️ **Danger Zone Detection** — Alerts when you're within 1km of a hotspot
- 🆘 **One-tap SOS** — Sends live location to emergency contacts instantly
- 🤖 **AI Risk Prediction** — Predicts danger by time, day, and location
- 📋 **Anonymous Reporting** — Community-powered incident reports
- 📊 **Admin Dashboard** — Full analytics with charts and user management
- 🏥 **Emergency Services** — Nearest police stations and hospitals
- 🔒 **Secure Auth** — Password hashing, session management, input validation

---

## 📁 Project Structure

```
/AuraAlert
├── index.html          # Landing page with hero, features, stats
├── login.html          # Login page with demo + admin quick-fill
├── register.html       # 3-step registration wizard
├── dashboard.html      # User dashboard: stats, map, profile, contacts
├── heatmap.html        # Full-screen crime heatmap with filters
├── sos.html            # SOS emergency page with hold-to-send button
├── report.html         # Incident report form + history
├── admin.html          # Admin panel: users, reports, analytics
│
├── style.css           # Global dark theme + glassmorphism styles
├── auth.css            # Login/register page styles
├── dashboard.css       # Dashboard layout + sidebar + charts
│
├── script.js           # Global utilities: toast, auth, distance, crime data
├── auth.js             # Auth form validation helpers
├── dashboard.js        # Dashboard logic: profile, contacts, charts, location
├── map.js              # Leaflet.js map integration + danger detection
│
├── backend.py          # Flask REST API (15 endpoints)
├── database.py         # SQLite database layer (all CRUD operations)
├── requirements.txt    # Python dependencies
│
├── dataset/
│   └── crime_data.csv  # 35 crime zones: Mumbai, Pune, Delhi
│
└── README.md           # This file
```

---

## 🚀 Quick Start (Frontend Only — No Backend Needed)

The frontend works **100% without the backend** using localStorage!

```bash
# 1. Download / clone the project
git clone https://github.com/yourname/auraalert.git
cd AuraAlert

# 2. Open in browser
# Simply open index.html in any modern browser

# OR use a local server (recommended):
npx serve .
# OR
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Demo User | demo@auraalert.com | demo123 |
| Admin | admin@auraalert.com | admin123 |

Click **"Demo Login"** or **"Admin Login"** buttons on the login page to auto-fill.

---

## ⚙️ Backend Setup (Python Flask)

```bash
# 1. Make sure Python 3.10+ is installed
python3 --version

# 2. Navigate to project folder
cd AuraAlert

# 3. Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
# OR
venv\Scripts\activate           # Windows

# 4. Install dependencies
pip install -r requirements.txt

# 5. Initialize and run backend
python backend.py
# API running at: http://localhost:5000
```

The backend auto-creates the SQLite database and seeds:
- Admin user (`admin@auraalert.com` / `admin123`)
- 24 crime hotspots across Mumbai, Pune, Delhi

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | None |
| POST | `/api/auth/register` | Register user | None |
| POST | `/api/auth/login` | Login | None |
| POST | `/api/auth/logout` | Logout | User |
| GET | `/api/auth/me` | Current user | User |
| PUT | `/api/user/profile` | Update profile | User |
| GET | `/api/user/contacts` | Get contacts | User |
| POST | `/api/user/contacts` | Add contact | User |
| DELETE | `/api/user/contacts/:id` | Remove contact | User |
| GET | `/api/incidents` | Get incidents | None |
| POST | `/api/incidents` | Report incident | User |
| GET | `/api/hotspots` | Crime hotspots | None |
| GET | `/api/hotspots/nearby` | Nearby hotspots | None |
| GET | `/api/safety/status` | Zone status | None |
| POST | `/api/sos/trigger` | Trigger SOS | User |
| GET | `/api/ai/predict` | AI risk prediction | None |
| GET | `/api/ai/safe-routes` | Safe zone suggestions | None |
| GET | `/api/admin/stats` | Admin statistics | Admin |
| GET | `/api/admin/users` | All users | Admin |

### Example: Safety Status
```
GET /api/safety/status?lat=18.5204&lng=73.8567

Response:
{
  "success": true,
  "data": {
    "status": "caution",
    "message": "⚠️ Caution: Kasba Peth is 2.1km away",
    "safety_score": 72,
    "time_risk": "medium"
  }
}
```

---

## ☁️ Free Deployment Options

### Option 1: Vercel (Frontend)
```bash
npm install -g vercel
vercel --prod
```

### Option 2: Render (Full Stack with Backend)
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn backend:app`
6. Set environment: `SECRET_KEY=your-secret-here`

### Option 3: Railway
```bash
railway login
railway init
railway up
```

### Option 4: Python Anywhere (Free)
1. Upload files to PythonAnywhere
2. Create a new web app with Flask
3. Set WSGI to point to `backend.py`
4. Install packages via console

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#070b14` | Page background |
| `--bg-secondary` | `#0d1425` | Card backgrounds |
| `--cyan` | `#06b6d4` | Primary accent, links |
| `--green` | `#22c55e` | Safe zones, success |
| `--red` | `#ef4444` | Danger zones, SOS |
| `--yellow` | `#f59e0b` | Caution zones |
| `--font-display` | Syne | Headings, numbers |
| `--font-body` | DM Sans | Body text, UI |

---

## 🔒 Security Features

- ✅ SHA-256 password hashing (backend) / btoa encoding (frontend demo)
- ✅ Session-based authentication with Flask
- ✅ SQL injection prevention via parameterized queries
- ✅ Input sanitization on all forms
- ✅ CORS configuration for API
- ✅ Admin role-based access control
- ✅ Anonymous report option for user privacy

---

## 📊 Dataset

The `dataset/crime_data.csv` contains **35 crime zones** with:
- `area` — Locality name
- `crime_count` — Number of reported incidents
- `risk_level` — high / medium / low
- `lat`, `lng` — GPS coordinates
- `time` — Peak time (night/evening/morning)
- `city` — Mumbai / Pune / Delhi
- `crime_type` — Assault / Robbery / Harassment / etc.

Data is sourced from publicly available crime reports and Pune Police statistics (2022-2023).

---

## 📱 Mobile Features

- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ GPS geolocation API
- ✅ Vibration API on danger detection
- ✅ Touch events for SOS button hold
- ✅ Hamburger navigation menu

---

## 🤖 AI Features

1. **Safety Score** — Dynamic score based on time of day + nearby hotspots
2. **Risk Prediction** — Predicts risk level using time, day, and location factors
3. **Safe Route Suggestions** — Identifies nearby low-risk zones
4. **Zone Classification** — Auto-classifies areas as Safe / Caution / Danger
5. **Crime Pattern Analysis** — Night vs day risk ratios, peak day detection

---

## 🆘 Emergency Helplines (India)

| Service | Number |
|---------|--------|
| Emergency | 112 |
| Police | 100 |
| Women Helpline | 1091 |
| Ambulance | 108 |
| Childline | 1098 |

---

## 📄 License

MIT License — Free to use, modify, and distribute with attribution.

---

## 🙏 Acknowledgements

- [Leaflet.js](https://leafletjs.com/) — Open-source maps
- [OpenStreetMap](https://openstreetmap.org/) — Map tiles
- [Pune Police](https://punepolice.gov.in/) — Crime statistics data
- Google Fonts: Syne + DM Sans

---

Built with ❤️ for Women's Safety | AuraAlert 2025
