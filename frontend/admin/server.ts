import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "smart-tourist-safety-secret-key-2026";
const JWT_ALGORITHM = (process.env.JWT_ALGORITHM as jwt.Algorithm) || "HS256";
const JWT_EXPIRE_MINUTES = parseInt(process.env.JWT_EXPIRE_MINUTES || "60", 10);

app.use(cors());
app.use(express.json());

// In-Memory Database storage (seeded from database/seed.sql)
interface AdminRecord {
  admin_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "SUPER_ADMIN" | "OPERATOR" | "INSPECTOR";
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
}

interface UserRecord {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
}

interface TripRecord {
  trip_id: number;
  user_id: number;
  destination: string;
  start_time: string;
  end_time: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

interface ZoneRecord {
  zone_id: number;
  name: string;
  description: string;
  zone_type: "SAFE" | "RESTRICTED" | "DANGER";
  latitude: number;
  longitude: number;
  radius: number; // meters
  risk_level: "LOW" | "HIGH" | "CRITICAL";
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
}

interface IncidentRecord {
  incident_id: number;
  trip_id: number;
  zone_id: number | null;
  incident_type: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
}

interface AlertRecord {
  alert_id: number;
  incident_id: number | null;
  alert_type: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "NEW" | "ACKNOWLEDGED" | "CLOSED";
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: number | null;
  closed_at: string | null;
}

// Global In-Memory state
let admins: AdminRecord[] = [];
let users: UserRecord[] = [];
let trips: TripRecord[] = [];
let zones: ZoneRecord[] = [];
let incidents: IncidentRecord[] = [];
let alerts: AlertRecord[] = [];

// Seed database function
function initSeedData() {
  const salt = bcrypt.genSaltSync(10);
  admins = [
    {
      admin_id: 1,
      name: "Kingston",
      email: "admin@safety.com",
      password_hash: bcrypt.hashSync("admin123", salt),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      created_at: new Date("2026-08-01T09:00:00Z").toISOString(),
    },
    {
      admin_id: 2,
      name: "Ravi",
      email: "ravi@safety.com",
      password_hash: bcrypt.hashSync("operator123", salt),
      role: "OPERATOR",
      status: "ACTIVE",
      created_at: new Date("2026-08-05T10:00:00Z").toISOString(),
    },
    {
      admin_id: 3,
      name: "Inspector Sharma",
      email: "inspector@safety.com",
      password_hash: bcrypt.hashSync("inspector123", salt),
      role: "INSPECTOR",
      status: "ACTIVE",
      created_at: new Date("2026-08-10T11:00:00Z").toISOString(),
    },
  ];

  users = [
    {
      user_id: 1,
      name: "Arun Kumar",
      email: "arun@gmail.com",
      phone: "9876543210",
      status: "ACTIVE",
      created_at: new Date("2026-08-12T08:30:00Z").toISOString(),
    },
    {
      user_id: 2,
      name: "Rahul Das",
      email: "rahul@gmail.com",
      phone: "9876543211",
      status: "ACTIVE",
      created_at: new Date("2026-08-14T09:15:00Z").toISOString(),
    },
    {
      user_id: 3,
      name: "Priya Sharma",
      email: "priya@gmail.com",
      phone: "9876543212",
      status: "ACTIVE",
      created_at: new Date("2026-08-15T11:45:00Z").toISOString(),
    },
  ];

  trips = [
    {
      trip_id: 1,
      user_id: 1,
      destination: "Ooty",
      start_time: "2026-08-18T09:00:00.000Z",
      end_time: "2026-08-20T18:00:00.000Z",
      status: "COMPLETED",
    },
    {
      trip_id: 2,
      user_id: 1,
      destination: "Coorg",
      start_time: "2026-08-25T08:00:00.000Z",
      end_time: "2026-08-27T20:00:00.000Z",
      status: "PLANNED",
    },
    {
      trip_id: 3,
      user_id: 2,
      destination: "Munnar",
      start_time: "2026-08-17T10:00:00.000Z",
      end_time: "2026-08-19T18:00:00.000Z",
      status: "COMPLETED",
    },
    {
      trip_id: 4,
      user_id: 3,
      destination: "Kodaikanal",
      start_time: "2026-08-20T09:00:00.000Z",
      end_time: "2026-08-22T18:00:00.000Z",
      status: "ACTIVE",
    },
  ];

  zones = [
    {
      zone_id: 1,
      name: "Ooty Lake Boating Area",
      description: "Main tourist boating area with safe surveillance perimeter.",
      zone_type: "SAFE",
      latitude: 11.4064,
      longitude: 76.6932,
      radius: 500,
      risk_level: "LOW",
      status: "ACTIVE",
      created_at: new Date("2026-08-01T00:00:00Z").toISOString(),
    },
    {
      zone_id: 2,
      name: "Forest Reserve Zone",
      description: "Dense forest reserve, high wild animal activity. Entry strictly restricted after dusk.",
      zone_type: "RESTRICTED",
      latitude: 11.4200,
      longitude: 76.7000,
      radius: 1000,
      risk_level: "HIGH",
      status: "ACTIVE",
      created_at: new Date("2026-08-01T00:00:00Z").toISOString(),
    },
    {
      zone_id: 3,
      name: "Landslide Risk Cliff",
      description: "Steep rocky mountain incline prone to rapid rockfall during seasonal showers.",
      zone_type: "DANGER",
      latitude: 11.4300,
      longitude: 76.7100,
      radius: 750,
      risk_level: "CRITICAL",
      status: "ACTIVE",
      created_at: new Date("2026-08-01T00:00:00Z").toISOString(),
    },
    {
      zone_id: 4,
      name: "Pillar Rocks Fog Ridge",
      description: "Steep precipice with rapid low-visibility fog conditions.",
      zone_type: "DANGER",
      latitude: 10.2185,
      longitude: 77.4715,
      radius: 600,
      risk_level: "CRITICAL",
      status: "ACTIVE",
      created_at: new Date("2026-08-01T00:00:00Z").toISOString(),
    },
  ];

  incidents = [
    {
      incident_id: 1,
      trip_id: 1,
      zone_id: 2,
      incident_type: "GEOFENCE_VIOLATION",
      description: "Tourist entered the restricted forest zone without authorization.",
      latitude: 11.4205,
      longitude: 76.7002,
      severity: "HIGH",
      status: "OPEN",
      created_at: "2026-08-19T19:00:00.000Z",
      resolved_at: null,
      resolved_by: null,
    },
    {
      incident_id: 2,
      trip_id: 1,
      zone_id: 1,
      incident_type: "SOS",
      description: "Tourist triggered emergency panic button near Ooty lake.",
      latitude: 11.4062,
      longitude: 76.6938,
      severity: "CRITICAL",
      status: "INVESTIGATING",
      created_at: "2026-08-19T19:15:00.000Z",
      resolved_at: null,
      resolved_by: null,
    },
    {
      incident_id: 3,
      trip_id: 3,
      zone_id: null,
      incident_type: "MEDICAL",
      description: "Tourist reported severe altitude sickness/fainting in hilly terrain.",
      latitude: 10.0889,
      longitude: 77.0595,
      severity: "HIGH",
      status: "RESOLVED",
      created_at: "2026-08-19T17:30:00.000Z",
      resolved_at: "2026-08-19T18:45:00.000Z",
      resolved_by: 1,
    },
  ];

  alerts = [
    {
      alert_id: 1,
      incident_id: 1,
      alert_type: "GEOFENCE",
      message: "Arun Kumar crossed into Forest Zone (High Risk).",
      priority: "HIGH",
      status: "ACKNOWLEDGED",
      created_at: "2026-08-19T19:02:00.000Z",
      acknowledged_at: "2026-08-19T19:05:00.000Z",
      acknowledged_by: 2,
      closed_at: null,
    },
    {
      alert_id: 2,
      incident_id: 2,
      alert_type: "SOS_PANIC",
      message: "EMERGENCY: Arun Kumar triggered SOS button!",
      priority: "CRITICAL",
      status: "NEW",
      created_at: "2026-08-19T19:16:00.000Z",
      acknowledged_at: null,
      acknowledged_by: null,
      closed_at: null,
    },
    {
      alert_id: 3,
      incident_id: 3,
      alert_type: "MEDICAL",
      message: "Medical assistance requested for Rahul Das.",
      priority: "HIGH",
      status: "CLOSED",
      created_at: "2026-08-19T17:35:00.000Z",
      acknowledged_at: "2026-08-19T17:40:00.000Z",
      acknowledged_by: 1,
      closed_at: "2026-08-19T18:45:00.000Z",
    },
  ];
}

initSeedData();

// Helper: Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Authentication Middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ detail: "Missing authentication token." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET_KEY) as { sub: string; role: string };
    const admin = admins.find((a) => a.admin_id === parseInt(payload.sub, 10));
    if (!admin || admin.status !== "ACTIVE") {
      return res.status(401).json({ detail: "Admin account invalid or inactive." });
    }
    (req as any).admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Invalid or expired token." });
  }
}

// ----------------------------------------------------
// 1. Root & Health Endpoints
// ----------------------------------------------------
app.get("/api", (req, res) => {
  res.json({ message: "Smart Tourist Safety API is running" });
});

app.get("/health/database", (req, res) => {
  res.json({ database: "connected", result: 1 });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Reset endpoint for testing demo flows
app.post("/api/reset-seed", (req, res) => {
  initSeedData();
  res.json({ message: "Seed database successfully re-initialized." });
});

// ----------------------------------------------------
// 2. Auth Endpoints (/api/auth)
// ----------------------------------------------------
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ detail: "Email and password are required." });
  }

  const admin = admins.find((a) => a.email.toLowerCase() === email.toLowerCase());

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ detail: "Incorrect email or password." });
  }

  if (admin.status !== "ACTIVE") {
    return res.status(403).json({ detail: "This admin account is inactive." });
  }

  const token = jwt.sign(
    { sub: admin.admin_id.toString(), role: admin.role },
    JWT_SECRET_KEY,
    { algorithm: JWT_ALGORITHM, expiresIn: `${JWT_EXPIRE_MINUTES}m` }
  );

  const { password_hash, ...safeAdmin } = admin;

  res.json({
    access_token: token,
    token_type: "bearer",
    admin: safeAdmin,
  });
});

app.get("/api/auth/admins", (req, res) => {
  const safeAdmins = admins.map(({ password_hash, ...safe }) => safe);
  res.json(safeAdmins);
});

// ----------------------------------------------------
// 3. Users Endpoints (/api/users)
// ----------------------------------------------------
app.get("/api/users", (req, res) => {
  res.json(users);
});

app.get("/api/users/:user_id", (req, res) => {
  const userId = parseInt(req.params.user_id, 10);
  const user = users.find((u) => u.user_id === userId);
  if (!user) {
    return res.status(404).json({ detail: `User ${userId} not found.` });
  }
  res.json(user);
});

app.post("/api/users", (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(422).json({ detail: "name, email, and phone are required" });
  }

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ detail: "A user with this email already exists." });
  }

  const newUser: UserRecord = {
    user_id: users.length > 0 ? Math.max(...users.map((u) => u.user_id)) + 1 : 1,
    name,
    email,
    phone,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// ----------------------------------------------------
// 4. Trips Endpoints (/api/trips)
// ----------------------------------------------------
app.get("/api/trips", (req, res) => {
  res.json(trips);
});

app.get("/api/trips/:trip_id", (req, res) => {
  const tripId = parseInt(req.params.trip_id, 10);
  const trip = trips.find((t) => t.trip_id === tripId);
  if (!trip) {
    return res.status(404).json({ detail: `Trip ${tripId} not found.` });
  }
  res.json(trip);
});

app.post("/api/trips", (req, res) => {
  const { user_id, destination, start_time, end_time } = req.body;
  if (!user_id || !destination || !start_time || !end_time) {
    return res.status(422).json({ detail: "user_id, destination, start_time, and end_time are required" });
  }

  const userExists = users.some((u) => u.user_id === user_id);
  if (!userExists) {
    return res.status(404).json({ detail: `User ${user_id} not found.` });
  }

  const newTrip: TripRecord = {
    trip_id: trips.length > 0 ? Math.max(...trips.map((t) => t.trip_id)) + 1 : 1,
    user_id,
    destination,
    start_time,
    end_time,
    status: "ACTIVE",
  };

  trips.push(newTrip);
  res.status(201).json(newTrip);
});

app.patch("/api/trips/:trip_id", (req, res) => {
  const tripId = parseInt(req.params.trip_id, 10);
  const trip = trips.find((t) => t.trip_id === tripId);
  if (!trip) {
    return res.status(404).json({ detail: `Trip ${tripId} not found.` });
  }

  const { destination, start_time, end_time, status } = req.body;
  if (destination !== undefined) trip.destination = destination;
  if (start_time !== undefined) trip.start_time = start_time;
  if (end_time !== undefined) trip.end_time = end_time;
  if (status !== undefined) trip.status = status;

  res.json(trip);
});

// ----------------------------------------------------
// 5. Zones Endpoints (/api/zones)
// ----------------------------------------------------
app.get("/api/zones", (req, res) => {
  res.json(zones);
});

app.get("/api/zones/:zone_id", (req, res) => {
  const zoneId = parseInt(req.params.zone_id, 10);
  const zone = zones.find((z) => z.zone_id === zoneId);
  if (!zone) {
    return res.status(404).json({ detail: `Zone ${zoneId} not found.` });
  }
  res.json(zone);
});

app.post("/api/zones", (req, res) => {
  const { name, description, zone_type, latitude, longitude, radius, risk_level } = req.body;
  if (!name || !zone_type || latitude === undefined || longitude === undefined || radius === undefined || !risk_level) {
    return res.status(422).json({ detail: "Missing required zone parameters." });
  }

  const newZone: ZoneRecord = {
    zone_id: zones.length > 0 ? Math.max(...zones.map((z) => z.zone_id)) + 1 : 1,
    name,
    description: description || "",
    zone_type,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    radius: parseFloat(radius),
    risk_level,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  };

  zones.push(newZone);
  res.status(201).json(newZone);
});

app.patch("/api/zones/:zone_id", (req, res) => {
  const zoneId = parseInt(req.params.zone_id, 10);
  const zone = zones.find((z) => z.zone_id === zoneId);
  if (!zone) {
    return res.status(404).json({ detail: `Zone ${zoneId} not found.` });
  }

  const { name, description, zone_type, latitude, longitude, radius, risk_level, status } = req.body;
  if (name !== undefined) zone.name = name;
  if (description !== undefined) zone.description = description;
  if (zone_type !== undefined) zone.zone_type = zone_type;
  if (latitude !== undefined) zone.latitude = parseFloat(latitude);
  if (longitude !== undefined) zone.longitude = parseFloat(longitude);
  if (radius !== undefined) zone.radius = parseFloat(radius);
  if (risk_level !== undefined) zone.risk_level = risk_level;
  if (status !== undefined) zone.status = status;

  res.json(zone);
});

// ----------------------------------------------------
// 6. Incidents Endpoints (/api/incidents)
// ----------------------------------------------------
app.get("/api/incidents", (req, res) => {
  res.json(incidents);
});

app.get("/api/incidents/:incident_id", (req, res) => {
  const incidentId = parseInt(req.params.incident_id, 10);
  const incident = incidents.find((i) => i.incident_id === incidentId);
  if (!incident) {
    return res.status(404).json({ detail: `Incident ${incidentId} not found.` });
  }
  res.json(incident);
});

app.post("/api/incidents", (req, res) => {
  const { trip_id, zone_id, incident_type, description, latitude, longitude, severity } = req.body;

  if (!trip_id || !incident_type || latitude === undefined || longitude === undefined || !severity) {
    return res.status(422).json({ detail: "Missing required incident fields." });
  }

  const trip = trips.find((t) => t.trip_id === trip_id);
  if (!trip) {
    return res.status(404).json({ detail: `Trip ${trip_id} not found.` });
  }

  const newIncident: IncidentRecord = {
    incident_id: incidents.length > 0 ? Math.max(...incidents.map((i) => i.incident_id)) + 1 : 1,
    trip_id,
    zone_id: zone_id || null,
    incident_type,
    description: description || "",
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    severity,
    status: "OPEN",
    created_at: new Date().toISOString(),
    resolved_at: null,
    resolved_by: null,
  };

  incidents.unshift(newIncident);

  // Automatically trigger a corresponding Alert (per Step 10 & 11 in agent.md)
  const touristUser = users.find((u) => u.user_id === trip.user_id);
  const userName = touristUser ? touristUser.name : "Tourist";
  const priority = severity === "CRITICAL" ? "CRITICAL" : severity === "HIGH" ? "HIGH" : "MEDIUM";
  
  let alertMessage = `${userName} reported ${incident_type}: ${description || "Emergency event occurred"}`;
  if (incident_type === "SOS") {
    alertMessage = `EMERGENCY: ${userName} pressed SOS panic button!`;
  } else if (incident_type === "GEOFENCE_VIOLATION") {
    alertMessage = `${userName} breached restricted safety zone boundary!`;
  }

  const newAlert: AlertRecord = {
    alert_id: alerts.length > 0 ? Math.max(...alerts.map((a) => a.alert_id)) + 1 : 1,
    incident_id: newIncident.incident_id,
    alert_type: incident_type === "SOS" ? "SOS_PANIC" : incident_type,
    message: alertMessage,
    priority: priority as any,
    status: "NEW",
    created_at: new Date().toISOString(),
    acknowledged_at: null,
    acknowledged_by: null,
    closed_at: null,
  };

  alerts.unshift(newAlert);

  res.status(201).json(newIncident);
});

app.patch("/api/incidents/:incident_id", (req, res) => {
  const incidentId = parseInt(req.params.incident_id, 10);
  const incident = incidents.find((i) => i.incident_id === incidentId);
  if (!incident) {
    return res.status(404).json({ detail: `Incident ${incidentId} not found.` });
  }

  const { zone_id, description, severity, status, resolved_at, resolved_by } = req.body;
  if (zone_id !== undefined) incident.zone_id = zone_id;
  if (description !== undefined) incident.description = description;
  if (severity !== undefined) incident.severity = severity;
  if (status !== undefined) {
    incident.status = status;
    if (status === "RESOLVED" && !incident.resolved_at) {
      incident.resolved_at = new Date().toISOString();
    }
  }
  if (resolved_at !== undefined) incident.resolved_at = resolved_at;
  if (resolved_by !== undefined) incident.resolved_by = resolved_by;

  res.json(incident);
});

// ----------------------------------------------------
// 7. Alerts Endpoints (/api/alerts)
// ----------------------------------------------------
app.get("/api/alerts", (req, res) => {
  res.json(alerts);
});

app.get("/api/alerts/:alert_id", (req, res) => {
  const alertId = parseInt(req.params.alert_id, 10);
  const alert = alerts.find((a) => a.alert_id === alertId);
  if (!alert) {
    return res.status(404).json({ detail: `Alert ${alertId} not found.` });
  }
  res.json(alert);
});

app.patch("/api/alerts/:alert_id", (req, res) => {
  const alertId = parseInt(req.params.alert_id, 10);
  const alert = alerts.find((a) => a.alert_id === alertId);
  if (!alert) {
    return res.status(404).json({ detail: `Alert ${alertId} not found.` });
  }

  const { status, acknowledged_at, acknowledged_by, closed_at } = req.body;
  if (status !== undefined) {
    alert.status = status;
    if (status === "ACKNOWLEDGED" && !alert.acknowledged_at) {
      alert.acknowledged_at = new Date().toISOString();
    }
    if (status === "CLOSED" && !alert.closed_at) {
      alert.closed_at = new Date().toISOString();
    }
  }
  if (acknowledged_at !== undefined) alert.acknowledged_at = acknowledged_at;
  if (acknowledged_by !== undefined) alert.acknowledged_by = acknowledged_by;
  if (closed_at !== undefined) alert.closed_at = closed_at;

  res.json(alert);
});

// ----------------------------------------------------
// 8. Real-time Geofence Checking & SOS Simulators
// ----------------------------------------------------
app.post("/api/geofence/check", (req, res) => {
  const { trip_id, latitude, longitude } = req.body;
  if (!trip_id || latitude === undefined || longitude === undefined) {
    return res.status(422).json({ detail: "trip_id, latitude, and longitude are required." });
  }

  const trip = trips.find((t) => t.trip_id === trip_id);
  if (!trip) {
    return res.status(404).json({ detail: `Trip ${trip_id} not found.` });
  }

  const breaches: { zone: ZoneRecord; distance: number }[] = [];
  const nearbyZones: { zone: ZoneRecord; distance: number; inside: boolean }[] = [];

  for (const zone of zones.filter((z) => z.status === "ACTIVE")) {
    const dist = calculateDistanceMeters(latitude, longitude, zone.latitude, zone.longitude);
    const isInside = dist <= zone.radius;
    nearbyZones.push({ zone, distance: Math.round(dist), inside: isInside });

    if (isInside && (zone.zone_type === "RESTRICTED" || zone.zone_type === "DANGER")) {
      breaches.push({ zone, distance: Math.round(dist) });
    }
  }

  // If newly breached, create incident & alert
  let createdIncident: IncidentRecord | null = null;
  let createdAlert: AlertRecord | null = null;

  if (breaches.length > 0) {
    const primaryBreach = breaches[0];
    const user = users.find((u) => u.user_id === trip.user_id);
    const userName = user ? user.name : "Tourist";

    createdIncident = {
      incident_id: incidents.length > 0 ? Math.max(...incidents.map((i) => i.incident_id)) + 1 : 1,
      trip_id,
      zone_id: primaryBreach.zone.zone_id,
      incident_type: "GEOFENCE_VIOLATION",
      description: `${userName} entered ${primaryBreach.zone.name} (${primaryBreach.zone.zone_type} zone).`,
      latitude,
      longitude,
      severity: primaryBreach.zone.risk_level === "CRITICAL" ? "CRITICAL" : "HIGH",
      status: "OPEN",
      created_at: new Date().toISOString(),
      resolved_at: null,
      resolved_by: null,
    };
    incidents.unshift(createdIncident);

    createdAlert = {
      alert_id: alerts.length > 0 ? Math.max(...alerts.map((a) => a.alert_id)) + 1 : 1,
      incident_id: createdIncident.incident_id,
      alert_type: "GEOFENCE",
      message: `Zone Breach: ${userName} entered ${primaryBreach.zone.name} (${primaryBreach.distance}m from center)`,
      priority: primaryBreach.zone.risk_level === "CRITICAL" ? "CRITICAL" : "HIGH",
      status: "NEW",
      created_at: new Date().toISOString(),
      acknowledged_at: null,
      acknowledged_by: null,
      closed_at: null,
    };
    alerts.unshift(createdAlert);
  }

  res.json({
    status: breaches.length > 0 ? "BREACH_DETECTED" : "SAFE",
    breaches,
    nearbyZones,
    incident: createdIncident,
    alert: createdAlert,
  });
});

// Analytics endpoint for admin dashboard
app.get("/api/stats", (req, res) => {
  res.json({
    totalTourists: users.length,
    activeTrips: trips.filter((t) => t.status === "ACTIVE").length,
    totalZones: zones.length,
    openIncidents: incidents.filter((i) => i.status === "OPEN" || i.status === "INVESTIGATING").length,
    criticalIncidents: incidents.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED").length,
    newAlerts: alerts.filter((a) => a.status === "NEW").length,
    resolvedIncidents: incidents.filter((i) => i.status === "RESOLVED").length,
  });
});

// ----------------------------------------------------
// 9. Vite Server & Static Middleware
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Tourist Safety Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
