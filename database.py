"""
AuraAlert – Database Layer (SQLite)
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'auraalert.db')


class Database:
    def __init__(self):
        self.db_path = DB_PATH

    def get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    # ─────────────────────────────────────
    # Init
    # ─────────────────────────────────────

    def init_db(self):
        with self.get_conn() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    phone TEXT,
                    password_hash TEXT NOT NULL,
                    city TEXT,
                    age_group TEXT,
                    blood_group TEXT,
                    medical_conditions TEXT,
                    role TEXT DEFAULT 'user',
                    created_at TEXT
                );

                CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    relation TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS incidents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    incident_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    area TEXT NOT NULL,
                    city TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time_of_day TEXT,
                    risk_level TEXT DEFAULT 'medium',
                    lat REAL,
                    lng REAL,
                    anonymous INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'Pending Review',
                    created_at TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS crime_hotspots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    area TEXT NOT NULL,
                    city TEXT NOT NULL,
                    crime_count INTEGER DEFAULT 0,
                    risk_level TEXT DEFAULT 'medium',
                    lat REAL,
                    lng REAL,
                    time_peak TEXT,
                    crime_type TEXT,
                    updated_at TEXT
                );

                CREATE TABLE IF NOT EXISTS sos_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    lat REAL,
                    lng REAL,
                    message TEXT,
                    contacts_alerted INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'sent',
                    created_at TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS admin (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER UNIQUE NOT NULL,
                    permissions TEXT DEFAULT 'all',
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            """)

            # Seed admin user
            import hashlib
            admin_hash = hashlib.sha256('admin123'.encode()).hexdigest()
            conn.execute("""
                INSERT OR IGNORE INTO users (name, email, phone, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ('Admin User', 'admin@auraalert.com', '1800000000', admin_hash, 'admin', datetime.now().isoformat()))

            # Seed crime hotspots
            hotspots = [
                ('Dharavi', 'Mumbai', 87, 'high', 19.0413, 72.8527, 'night', 'Assault'),
                ('Kurla West', 'Mumbai', 72, 'high', 19.0726, 72.8793, 'night', 'Harassment'),
                ('Govandi', 'Mumbai', 68, 'high', 19.0465, 72.9177, 'evening', 'Robbery'),
                ('Mankhurd', 'Mumbai', 61, 'high', 19.0503, 72.9347, 'night', 'Robbery'),
                ('Antop Hill', 'Mumbai', 55, 'high', 19.0198, 72.8589, 'evening', 'Assault'),
                ('Byculla', 'Mumbai', 49, 'medium', 18.9785, 72.8346, 'evening', 'Harassment'),
                ('Chembur', 'Mumbai', 42, 'medium', 19.0622, 72.8996, 'night', 'Robbery'),
                ('Andheri West', 'Mumbai', 28, 'low', 19.1362, 72.8296, 'morning', 'Suspicious'),
                ('Kasba Peth', 'Pune', 78, 'high', 18.5159, 73.8545, 'night', 'Assault'),
                ('Kondhwa', 'Pune', 65, 'high', 18.4613, 73.8883, 'night', 'Robbery'),
                ('Hadapsar', 'Pune', 58, 'high', 18.5018, 73.9319, 'evening', 'Harassment'),
                ('Wanowrie', 'Pune', 52, 'high', 18.4912, 73.9028, 'night', 'Assault'),
                ('Yerwada', 'Pune', 47, 'medium', 18.5530, 73.9016, 'evening', 'Robbery'),
                ('Kothrud', 'Pune', 40, 'medium', 18.5074, 73.8088, 'evening', 'Harassment'),
                ('Koregaon Park', 'Pune', 22, 'low', 18.5362, 73.8941, 'morning', 'Suspicious'),
                ('Baner', 'Pune', 18, 'low', 18.5590, 73.7888, 'morning', 'Suspicious'),
                ('Paharganj', 'Delhi', 92, 'high', 28.6448, 77.2167, 'night', 'Assault'),
                ('Sangam Vihar', 'Delhi', 85, 'high', 28.5099, 77.2516, 'night', 'Robbery'),
                ('Uttam Nagar', 'Delhi', 79, 'high', 28.6213, 77.0563, 'evening', 'Assault'),
                ('Nangloi', 'Delhi', 74, 'high', 28.6758, 77.0627, 'night', 'Robbery'),
                ('Shahdara', 'Delhi', 68, 'high', 28.6708, 77.2913, 'evening', 'Harassment'),
                ('Laxmi Nagar', 'Delhi', 62, 'high', 28.6355, 77.2782, 'night', 'Chain Snatching'),
                ('Vikaspuri', 'Delhi', 55, 'medium', 28.6391, 77.0708, 'evening', 'Harassment'),
                ('Dwarka', 'Delhi', 45, 'medium', 28.5823, 77.0500, 'evening', 'Robbery'),
            ]
            conn.executemany("""
                INSERT OR IGNORE INTO crime_hotspots
                (area, city, crime_count, risk_level, lat, lng, time_peak, crime_type, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?)
            """, [(h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], datetime.now().isoformat()) for h in hotspots])

            conn.commit()
        print("✅ Database initialized successfully.")

    # ─────────────────────────────────────
    # Users
    # ─────────────────────────────────────

    def create_user(self, data: dict) -> int:
        with self.get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO users (name, email, phone, password_hash, city, age_group,
                blood_group, medical_conditions, role, created_at)
                VALUES (:name, :email, :phone, :password_hash, :city, :age_group,
                :blood_group, :medical_conditions, :role, :created_at)
            """, data)
            conn.commit()
            return cur.lastrowid

    def get_user_by_email(self, email: str):
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
            return dict(row) if row else None

    def get_user_by_id(self, user_id: int):
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
            return dict(row) if row else None

    def update_user(self, user_id: int, data: dict):
        sets = ', '.join(f"{k}=?" for k in data)
        values = list(data.values()) + [user_id]
        with self.get_conn() as conn:
            conn.execute(f"UPDATE users SET {sets} WHERE id=?", values)
            conn.commit()

    def get_all_users(self):
        with self.get_conn() as conn:
            rows = conn.execute("SELECT * FROM users ORDER BY id DESC").fetchall()
            return [dict(r) for r in rows]

    def count_users(self):
        with self.get_conn() as conn:
            return conn.execute("SELECT COUNT(*) FROM users WHERE role='user'").fetchone()[0]

    # ─────────────────────────────────────
    # Contacts
    # ─────────────────────────────────────

    def add_contact(self, user_id: int, data: dict) -> int:
        with self.get_conn() as conn:
            cur = conn.execute(
                "INSERT INTO contacts (user_id, name, phone, relation) VALUES (?,?,?,?)",
                (user_id, data.get('name'), data.get('phone'), data.get('relation', 'Family'))
            )
            conn.commit()
            return cur.lastrowid

    def get_contacts(self, user_id: int):
        with self.get_conn() as conn:
            rows = conn.execute("SELECT * FROM contacts WHERE user_id=?", (user_id,)).fetchall()
            return [dict(r) for r in rows]

    def delete_contact(self, contact_id: int, user_id: int):
        with self.get_conn() as conn:
            conn.execute("DELETE FROM contacts WHERE id=? AND user_id=?", (contact_id, user_id))
            conn.commit()

    # ─────────────────────────────────────
    # Incidents
    # ─────────────────────────────────────

    def create_incident(self, data: dict) -> int:
        with self.get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO incidents
                (user_id, incident_type, description, area, city, date, time_of_day,
                risk_level, lat, lng, anonymous, status, created_at)
                VALUES (:user_id, :incident_type, :description, :area, :city, :date,
                :time_of_day, :risk_level, :lat, :lng, :anonymous, :status, :created_at)
            """, data)
            conn.commit()
            return cur.lastrowid

    def get_incidents(self, city=None, risk_level=None, limit=50):
        query = "SELECT * FROM incidents WHERE 1=1"
        params = []
        if city:
            query += " AND city=?"; params.append(city)
        if risk_level:
            query += " AND risk_level=?"; params.append(risk_level)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        with self.get_conn() as conn:
            rows = conn.execute(query, params).fetchall()
            return [dict(r) for r in rows]

    def update_incident_status(self, incident_id: int, status: str):
        with self.get_conn() as conn:
            conn.execute("UPDATE incidents SET status=? WHERE id=?", (status, incident_id))
            conn.commit()

    def count_incidents(self):
        with self.get_conn() as conn:
            return conn.execute("SELECT COUNT(*) FROM incidents").fetchone()[0]

    def incidents_by_risk(self):
        with self.get_conn() as conn:
            rows = conn.execute(
                "SELECT risk_level, COUNT(*) as count FROM incidents GROUP BY risk_level"
            ).fetchall()
            return {r['risk_level']: r['count'] for r in rows}

    def incidents_by_city(self):
        with self.get_conn() as conn:
            rows = conn.execute(
                "SELECT city, COUNT(*) as count FROM incidents GROUP BY city ORDER BY count DESC"
            ).fetchall()
            return [dict(r) for r in rows]

    def incidents_by_type(self):
        with self.get_conn() as conn:
            rows = conn.execute(
                "SELECT incident_type, COUNT(*) as count FROM incidents GROUP BY incident_type ORDER BY count DESC"
            ).fetchall()
            return [dict(r) for r in rows]

    # ─────────────────────────────────────
    # Hotspots
    # ─────────────────────────────────────

    def get_hotspots(self, city=None, risk_level=None):
        query = "SELECT * FROM crime_hotspots WHERE 1=1"
        params = []
        if city:
            query += " AND city=?"; params.append(city)
        if risk_level:
            query += " AND risk_level=?"; params.append(risk_level)
        query += " ORDER BY crime_count DESC"
        with self.get_conn() as conn:
            rows = conn.execute(query, params).fetchall()
            return [dict(r) for r in rows]

    def count_hotspots(self):
        with self.get_conn() as conn:
            return conn.execute("SELECT COUNT(*) FROM crime_hotspots").fetchone()[0]

    # ─────────────────────────────────────
    # SOS Log
    # ─────────────────────────────────────

    def log_sos(self, data: dict) -> int:
        with self.get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO sos_log (user_id, lat, lng, message, contacts_alerted, created_at)
                VALUES (:user_id, :lat, :lng, :message, :contacts_alerted, :created_at)
            """, data)
            conn.commit()
            return cur.lastrowid

    def get_sos_log(self, limit=50):
        with self.get_conn() as conn:
            rows = conn.execute(
                "SELECT s.*, u.name as user_name FROM sos_log s LEFT JOIN users u ON s.user_id=u.id ORDER BY s.created_at DESC LIMIT ?",
                (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    def count_sos(self):
        with self.get_conn() as conn:
            return conn.execute("SELECT COUNT(*) FROM sos_log").fetchone()[0]
