# AuraAlert---AI-Powered-Safety-Platform
AuraAlert is an intelligent women’s safety platform designed to provide real-time danger detection, automated SOS alerts, geospatial crime analysis, and community-based incident reporting. The system combines location intelligence, crime hotspot visualization, and emergency communication to enhance proactive public safety.


**Features:**
  ◾Secure User Authentication & Registration
  ◾Interactive Crime Risk Heatmap
  ◾Real-Time Danger Zone Detection
  ◾Automatic & Manual SOS Alert System
  ◾Live GPS Location Sharing
  ◾Anonymous Incident Reporting
  ◾Admin Analytics Dashboard
  ◾Emergency SMS Alerts using Fast2SMS
  ◾Secure Password Hashing with bcrypt

**System Architecture**

AuraAlert follows a modular architecture consisting of:

1️⃣ Frontend Layer
  ◾Streamlit-based interactive UI
  ◾User authentication screens
  ◾Heatmap visualization
  ◾SOS controls
2️⃣ Backend Layer
  ◾FastAPI-based API services
  ◾Authentication logic
  ◾Risk analysis engine
  ◾Emergency alert processing
3️⃣ Database Layer
  ◾SQLite database
  ◾User records
  ◾Incident reports
  ◾Crime hotspot storage
4️⃣ External Services
  ◾Fast2SMS API for SOS notifications
  ◾GPS & geolocation services


**Tech Stack**
1. Frontend
  ◾Streamlit
  ◾HTML
  ◾CSS
  ◾JavaScript
2. Backend
  ◾Python
  ◾FastAPI
3. Database
  ◾SQLite
4. Data & Visualization
  ◾Pandas
  ◾NumPy
  ◾Folium
5. Security
  ◾JWT Authentication
  ◾Passlib (bcrypt hashing)
6. Communication
  ◾Fast2SMS API

**Project Structure**
  
  AuraAlert/
  │
  ├── backend/
  │   ├── main.py
  │   ├── auth.py
  │   ├── database.py
  │   ├── models.py
  │   ├── routes/
  │
  ├── frontend/
  │   ├── app.py
  │   ├── static/
  │   ├── templates/
  │
  ├── dataset/
  │   ├── crime_data.csv
  │
  ├── requirements.txt
  ├── README.md
  └── .env
