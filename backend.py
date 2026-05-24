"""
AuraAlert – Flask Backend API
AI-Powered Women's Safety Platform
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import hashlib
import json
import math
import os
import csv
import io
from datetime import datetime, timedelta
from functools import wraps
from database import Database

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'auraalert-secret-key-2025')
CORS(app, supports_credentials=True)

db = Database()

# ─────────────────────────────────────
# Utilities
# ─────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized', 'message': 'Login required'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        user = db.get_user_by_id(session['user_id'])
        if not user or user.get('role') != 'admin':
            return jsonify({'error': 'Forbidden', 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate km distance between two GPS points."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat/2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon/2)**2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def success(data=None, message='Success', code=200):
    return jsonify({'success': True, 'message': message, 'data': data}), code

def error(message='Error', code=400):
    return jsonify({'success': False, 'error': message}), code


# ─────────────────────────────────────
# Auth Routes
# ─────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    required = ['name', 'email', 'phone', 'password']
    if not all(k in data for k in required):
        return error('Missing required fields')

    if db.get_user_by_email(data['email']):
        return error('Email already registered', 409)

    user_id = db.create_user({
        'name': data['name'].strip(),
        'email': data['email'].lower().strip(),
        'phone': data['phone'].strip(),
        'password_hash': hash_password(data['password']),
        'city': data.get('city', ''),
        'age_group': data.get('age_group', ''),
        'blood_group': data.get('blood_group', ''),
        'medical_conditions': data.get('medical_conditions', ''),
        'role': 'user',
        'created_at': datetime.now().isoformat()
    })

    # Add emergency contacts
    contacts = data.get('contacts', [])
    for c in contacts[:5]:  # max 5 contacts
        db.add_contact(user_id, c)

    session['user_id'] = user_id
    user = db.get_user_by_id(user_id)
    user.pop('password_hash', None)
    return success(user, 'Registration successful', 201)


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return error('Email and password required')

    user = db.get_user_by_email(data['email'].lower())
    if not user or user['password_hash'] != hash_password(data['password']):
        return error('Invalid credentials', 401)

    session['user_id'] = user['id']
    user.pop('password_hash', None)
    return success(user, 'Login successful')


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return success(message='Logged out')


@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_me():
    user = db.get_user_by_id(session['user_id'])
    if not user:
        return error('User not found', 404)
    user.pop('password_hash', None)
    contacts = db.get_contacts(user['id'])
    user['contacts'] = contacts
    return success(user)


# ─────────────────────────────────────
# User Routes
# ─────────────────────────────────────

@app.route('/api/user/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    allowed = ['name', 'phone', 'city', 'age_group', 'blood_group', 'medical_conditions']
    update_data = {k: v for k, v in data.items() if k in allowed}
    db.update_user(session['user_id'], update_data)
    return success(message='Profile updated')


@app.route('/api/user/contacts', methods=['GET'])
@login_required
def get_contacts():
    contacts = db.get_contacts(session['user_id'])
    return success(contacts)


@app.route('/api/user/contacts', methods=['POST'])
@login_required
def add_contact():
    data = request.get_json()
    if not data.get('name') or not data.get('phone'):
        return error('Name and phone required')
    contact_id = db.add_contact(session['user_id'], data)
    return success({'id': contact_id}, 'Contact added', 201)


@app.route('/api/user/contacts/<int:contact_id>', methods=['DELETE'])
@login_required
def delete_contact(contact_id):
    db.delete_contact(contact_id, session['user_id'])
    return success(message='Contact deleted')


# ─────────────────────────────────────
# Incident Reports
# ─────────────────────────────────────

@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    city = request.args.get('city')
    risk = request.args.get('risk_level')
    limit = int(request.args.get('limit', 50))
    incidents = db.get_incidents(city=city, risk_level=risk, limit=limit)
    return success(incidents)


@app.route('/api/incidents', methods=['POST'])
@login_required
def create_incident():
    data = request.get_json()
    required = ['incident_type', 'description', 'area', 'city', 'date']
    if not all(k in data for k in required):
        return error('Missing required fields')

    user_id = None if data.get('anonymous') else session['user_id']

    incident_id = db.create_incident({
        'user_id': user_id,
        'incident_type': data['incident_type'],
        'description': data['description'].strip(),
        'area': data['area'].strip(),
        'city': data['city'],
        'date': data['date'],
        'time_of_day': data.get('time_of_day', 'evening'),
        'risk_level': data.get('risk_level', 'medium'),
        'lat': data.get('lat'),
        'lng': data.get('lng'),
        'anonymous': data.get('anonymous', True),
        'status': 'Pending Review',
        'created_at': datetime.now().isoformat()
    })

    return success({'id': incident_id}, 'Incident reported successfully', 201)


@app.route('/api/incidents/<int:incident_id>/status', methods=['PUT'])
@admin_required
def update_incident_status(incident_id):
    data = request.get_json()
    db.update_incident_status(incident_id, data.get('status', 'Verified'))
    return success(message='Status updated')


# ─────────────────────────────────────
# Crime Hotspots
# ─────────────────────────────────────

@app.route('/api/hotspots', methods=['GET'])
def get_hotspots():
    city = request.args.get('city')
    risk = request.args.get('risk_level')
    hotspots = db.get_hotspots(city=city, risk_level=risk)
    return success(hotspots)


@app.route('/api/hotspots/nearby', methods=['GET'])
def get_nearby_hotspots():
    try:
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
        radius = float(request.args.get('radius', 5))
    except (TypeError, ValueError):
        return error('lat, lng are required numbers')

    all_hotspots = db.get_hotspots()
    nearby = []
    for h in all_hotspots:
        if h.get('lat') and h.get('lng'):
            dist = haversine_distance(lat, lng, h['lat'], h['lng'])
            if dist <= radius:
                h['distance_km'] = round(dist, 2)
                nearby.append(h)

    nearby.sort(key=lambda x: x['distance_km'])
    return success(nearby)


# ─────────────────────────────────────
# Safety Status
# ─────────────────────────────────────

@app.route('/api/safety/status', methods=['GET'])
def get_safety_status():
    try:
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
    except (TypeError, ValueError):
        return error('lat and lng required')

    hotspots = db.get_hotspots(risk_level='high')
    min_dist = float('inf')
    nearest = None

    for h in hotspots:
        if h.get('lat') and h.get('lng'):
            d = haversine_distance(lat, lng, h['lat'], h['lng'])
            if d < min_dist:
                min_dist = d
                nearest = h

    if min_dist < 1:
        status = 'danger'
        message = f"⚠️ You are within 1km of {nearest['area']} — HIGH RISK ZONE"
        color = '#ef4444'
    elif min_dist < 3:
        status = 'caution'
        message = f"⚠️ Caution: {nearest['area']} is {min_dist:.1f}km away"
        color = '#f59e0b'
    else:
        status = 'safe'
        message = '✅ You are in a safe zone'
        color = '#22c55e'

    # AI Safety Score (time-based)
    hour = datetime.now().hour
    score = 90
    if 22 <= hour or hour < 5:
        score -= 40
    elif hour >= 18:
        score -= 20
    score = max(10, min(100, score + (5 - int(min_dist * 2))))

    return success({
        'status': status,
        'message': message,
        'color': color,
        'nearest_hotspot': nearest,
        'distance_km': round(min_dist, 2),
        'safety_score': score,
        'time_risk': 'high' if (22 <= hour or hour < 5) else 'medium' if hour >= 18 else 'low'
    })


# ─────────────────────────────────────
# SOS
# ─────────────────────────────────────

@app.route('/api/sos/trigger', methods=['POST'])
@login_required
def trigger_sos():
    data = request.get_json()
    user = db.get_user_by_id(session['user_id'])
    contacts = db.get_contacts(session['user_id'])

    lat = data.get('lat', 0)
    lng = data.get('lng', 0)
    maps_link = f"https://maps.google.com/?q={lat},{lng}"
    timestamp = datetime.now().strftime('%d %b %Y, %I:%M %p')

    message = (
        f"🆘 EMERGENCY ALERT!\n"
        f"Name: {user['name']}\n"
        f"📍 Location: {maps_link}\n"
        f"🕐 Time: {timestamp}\n"
        f"📞 Please call immediately!\n"
        f"Sent via AuraAlert Safety Platform"
    )

    # Log SOS event
    db.log_sos({
        'user_id': session['user_id'],
        'lat': lat,
        'lng': lng,
        'message': message,
        'contacts_alerted': len(contacts),
        'created_at': datetime.now().isoformat()
    })

    return success({
        'message_sent': message,
        'contacts_alerted': len(contacts),
        'timestamp': timestamp,
        'maps_link': maps_link
    }, f'SOS alert sent to {len(contacts)} contacts')


# ─────────────────────────────────────
# AI Predictions
# ─────────────────────────────────────

@app.route('/api/ai/predict', methods=['GET'])
def predict_risk():
    try:
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
    except (TypeError, ValueError):
        return error('lat and lng required')

    hour = datetime.now().hour
    day = datetime.now().weekday()  # 0=Monday

    # Time risk factor
    if 22 <= hour or hour < 5:
        time_risk = 'very_high'
        time_factor = 0.9
    elif hour >= 18:
        time_risk = 'high'
        time_factor = 0.6
    elif hour >= 12:
        time_risk = 'medium'
        time_factor = 0.3
    else:
        time_risk = 'low'
        time_factor = 0.1

    # Day risk factor
    day_factor = 0.7 if day >= 4 else 0.3  # Weekend higher

    # Nearby hotspot factor
    hotspots = db.get_hotspots(risk_level='high')
    nearby_high = sum(
        1 for h in hotspots
        if h.get('lat') and h.get('lng') and
        haversine_distance(lat, lng, h['lat'], h['lng']) < 3
    )

    # Composite risk score (0-100)
    risk_score = min(100, int(
        (time_factor * 40) + (day_factor * 20) + (nearby_high * 15) + 10
    ))

    if risk_score >= 70:
        risk_level = 'high'
        recommendation = 'Stay indoors or in populated, well-lit areas. Share location with family.'
    elif risk_score >= 40:
        risk_level = 'medium'
        recommendation = 'Be alert. Avoid isolated areas. Keep emergency contacts ready.'
    else:
        risk_level = 'low'
        recommendation = 'Area appears safe. Keep your AuraAlert active as a precaution.'

    return success({
        'risk_score': risk_score,
        'risk_level': risk_level,
        'time_risk': time_risk,
        'nearby_high_risk_zones': nearby_high,
        'recommendation': recommendation,
        'prediction_time': datetime.now().isoformat(),
        'factors': {
            'time_of_day': time_factor,
            'day_of_week': day_factor,
            'nearby_hotspots': nearby_high
        }
    })


@app.route('/api/ai/safe-routes', methods=['GET'])
def suggest_safe_routes():
    try:
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
    except (TypeError, ValueError):
        return error('lat and lng required')

    hotspots = db.get_hotspots(risk_level='high')

    # Find safe nearby zones (no high-risk within 2km)
    safe_zones = db.get_hotspots(risk_level='low')
    suggestions = []
    for zone in safe_zones:
        if zone.get('lat') and zone.get('lng'):
            dist = haversine_distance(lat, lng, zone['lat'], zone['lng'])
            # Check no high-risk nearby
            safe = all(
                haversine_distance(zone['lat'], zone['lng'], h['lat'], h['lng']) > 2
                for h in hotspots if h.get('lat') and h.get('lng')
            )
            if safe and dist < 10:
                zone['distance_km'] = round(dist, 2)
                suggestions.append(zone)

    suggestions.sort(key=lambda z: z['distance_km'])
    return success(suggestions[:5], 'Safe zones nearby')


# ─────────────────────────────────────
# Admin Routes
# ─────────────────────────────────────

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    stats = {
        'total_users': db.count_users(),
        'total_incidents': db.count_incidents(),
        'total_hotspots': db.count_hotspots(),
        'total_sos': db.count_sos(),
        'incidents_by_risk': db.incidents_by_risk(),
        'incidents_by_city': db.incidents_by_city(),
        'incidents_by_type': db.incidents_by_type(),
        'recent_sos': db.get_sos_log(limit=10)
    }
    return success(stats)


@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_users():
    users = db.get_all_users()
    for u in users:
        u.pop('password_hash', None)
    return success(users)


@app.route('/api/admin/incidents', methods=['GET'])
@admin_required
def admin_incidents():
    incidents = db.get_incidents(limit=200)
    return success(incidents)


# ─────────────────────────────────────
# Dataset Route
# ─────────────────────────────────────

@app.route('/api/dataset/crime', methods=['GET'])
def get_crime_dataset():
    """Return the loaded crime dataset as JSON."""
    data = []
    csv_path = os.path.join(os.path.dirname(__file__), 'dataset', 'crime_data.csv')
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row['lat'] = float(row['lat'])
                row['lng'] = float(row['lng'])
                row['crime_count'] = int(row['crime_count'])
                data.append(row)
    except FileNotFoundError:
        return error('Dataset not found', 404)
    return success(data)


# ─────────────────────────────────────
# Health Check
# ─────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'app': 'AuraAlert',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    db.init_db()
    print("🛡️  AuraAlert Backend starting...")
    print("📡 API running at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
