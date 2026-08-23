export type Role = 'SUPER_ADMIN' | 'OPERATOR' | 'INSPECTOR';
export type AdminStatus = 'ACTIVE' | 'INACTIVE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type TripStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type ZoneType = 'SAFE' | 'RESTRICTED' | 'DANGER';
export type RiskLevel = 'LOW' | 'HIGH' | 'CRITICAL';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'CLOSED';
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Admin {
  admin_id: number;
  name: string;
  email: string;
  role: Role;
  status: AdminStatus;
  created_at: string;
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  created_at: string;
}

export interface Trip {
  trip_id: number;
  user_id: number;
  destination: string;
  start_time: string;
  end_time: string;
  status: TripStatus;
}

export interface Zone {
  zone_id: number;
  name: string;
  description: string;
  zone_type: ZoneType;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  risk_level: RiskLevel;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Incident {
  incident_id: number;
  trip_id: number;
  zone_id: number | null;
  incident_type: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
}

export interface Alert {
  alert_id: number;
  incident_id: number | null;
  alert_type: string;
  message: string;
  priority: AlertPriority;
  status: AlertStatus;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: number | null;
  closed_at: string | null;
}

export interface DashboardStats {
  totalTourists: number;
  activeTrips: number;
  totalZones: number;
  openIncidents: number;
  criticalIncidents: number;
  newAlerts: number;
  resolvedIncidents: number;
}
