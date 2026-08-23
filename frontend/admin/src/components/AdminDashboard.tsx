import React, { useState } from 'react';
import { Admin, User, Trip, Zone, Incident, Alert, DashboardStats } from '../types';
import { MapSimulation } from './MapSimulation';
import {
  ShieldAlert,
  AlertOctagon,
  CheckCircle,
  Clock,
  UserCheck,
  MapPin,
  Users,
  Shield,
  Layers,
  Activity,
  PlusCircle,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface AdminDashboardProps {
  currentAdmin: Admin | null;
  admins: Admin[];
  users: User[];
  trips: Trip[];
  zones: Zone[];
  incidents: Incident[];
  alerts: Alert[];
  stats: DashboardStats | null;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  admins,
  users,
  trips,
  zones,
  incidents,
  alerts,
  stats,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'alerts' | 'zones' | 'tourists'>('incidents');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isResolving, setIsResolving] = useState<number | null>(null);

  // New Zone Modal state
  const [showNewZoneModal, setShowNewZoneModal] = useState<boolean>(false);
  const [zoneName, setZoneName] = useState<string>('');
  const [zoneDesc, setZoneDesc] = useState<string>('');
  const [zoneType, setZoneType] = useState<'SAFE' | 'RESTRICTED' | 'DANGER'>('RESTRICTED');
  const [zoneLat, setZoneLat] = useState<number>(11.415);
  const [zoneLng, setZoneLng] = useState<number>(76.698);
  const [zoneRadius, setZoneRadius] = useState<number>(600);
  const [zoneRisk, setZoneRisk] = useState<'LOW' | 'HIGH' | 'CRITICAL'>('HIGH');

  // Handle Acknowledge Alert
  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACKNOWLEDGED',
          acknowledged_by: currentAdmin?.admin_id || 1,
        }),
      });
      onRefreshData();
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  // Handle Close Alert
  const handleCloseAlert = async (alertId: number) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
        }),
      });
      onRefreshData();
    } catch (err) {
      console.error('Failed to close alert', err);
    }
  };

  // Handle Update Incident Status
  const handleUpdateIncidentStatus = async (
    incidentId: number,
    newStatus: 'INVESTIGATING' | 'RESOLVED'
  ) => {
    setIsResolving(incidentId);
    try {
      await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolved_by: newStatus === 'RESOLVED' ? (currentAdmin?.admin_id || 1) : null,
          resolved_at: newStatus === 'RESOLVED' ? new Date().toISOString() : null,
        }),
      });
      onRefreshData();
    } catch (err) {
      console.error('Failed to update incident', err);
    } finally {
      setIsResolving(null);
    }
  };

  // Handle Create Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: zoneName,
          description: zoneDesc,
          zone_type: zoneType,
          latitude: zoneLat,
          longitude: zoneLng,
          radius: zoneRadius,
          risk_level: zoneRisk,
        }),
      });
      if (res.ok) {
        setShowNewZoneModal(false);
        setZoneName('');
        setZoneDesc('');
        onRefreshData();
      }
    } catch (err) {
      console.error('Failed to create zone', err);
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    if (statusFilter === 'ALL') return true;
    return i.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tourists</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-100 font-display">
            {stats?.totalTourists ?? users.length}
          </div>
          <span className="text-[11px] text-sky-400 font-medium">Registered in area</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Trips</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-100 font-display">
            {stats?.activeTrips ?? trips.filter((t) => t.status === 'ACTIVE').length}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">Currently on trail</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Safety Zones</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-100 font-display">
            {stats?.totalZones ?? zones.length}
          </div>
          <span className="text-[11px] text-indigo-400 font-medium">Geofenced perimeters</span>
        </div>

        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-rose-300">
            <span>Open Incidents</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-300 font-display">
            {stats?.openIncidents ?? incidents.filter((i) => i.status !== 'RESOLVED').length}
          </div>
          <span className="text-[11px] text-rose-400 font-medium">Requiring response</span>
        </div>

        <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-rose-300">
            <span>Critical SOS</span>
            <AlertOctagon className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400 font-display">
            {stats?.criticalIncidents ?? incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length}
          </div>
          <span className="text-[11px] text-rose-400 font-medium">High priority triage</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>New Alerts</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-100 font-display">
            {stats?.newAlerts ?? alerts.filter((a) => a.status === 'NEW').length}
          </div>
          <span className="text-[11px] text-amber-400 font-medium">Unacknowledged</span>
        </div>
      </div>

      {/* Main Map + Triage Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Tactical Map */}
        <div className="lg:col-span-7">
          <MapSimulation
            zones={zones}
            incidents={incidents}
            currentLat={11.418}
            currentLng={76.702}
            interactive={false}
          />
        </div>

        {/* Real-time Alerts Feed */}
        <div className="space-y-3 lg:col-span-5">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Live Alert Stream ({alerts.length})
              </span>
            </div>
            <button
              onClick={onRefreshData}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-sky-400 transition"
            >
              <RefreshCw className="h-3 w-3" /> Sync
            </button>
          </div>

          <div className="max-h-[310px] space-y-2.5 overflow-y-auto pr-1">
            {alerts.slice(0, 6).map((alert) => {
              const isCrit = alert.priority === 'CRITICAL';
              return (
                <div
                  key={alert.alert_id}
                  className={`rounded-xl border p-3 text-xs transition-all ${
                    alert.status === 'NEW'
                      ? isCrit
                        ? 'border-rose-500/60 bg-rose-950/40 text-rose-200'
                        : 'border-amber-500/50 bg-amber-950/30 text-amber-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold flex items-center gap-1">
                      {isCrit && <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />}
                      {alert.alert_type}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        alert.status === 'NEW'
                          ? 'bg-rose-500/30 text-rose-300'
                          : alert.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>

                  <p className="mt-1 text-slate-200 font-medium">{alert.message}</p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                    <div className="flex gap-1.5">
                      {alert.status === 'NEW' && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.alert_id)}
                          className="rounded bg-sky-600/80 px-2 py-0.5 text-white font-semibold hover:bg-sky-500 transition"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status === 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => handleCloseAlert(alert.alert_id)}
                          className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 font-semibold hover:bg-slate-700 transition"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs: Incidents Triage, Zones, Tourists */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'incidents'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Incident Triage ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('zones')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'zones'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Geofence Zones ({zones.length})
            </button>
            <button
              onClick={() => setActiveTab('tourists')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'tourists'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Tourists & Trips ({users.length})
            </button>
          </div>

          {activeTab === 'incidents' && (
            <div className="flex items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open Only</option>
                <option value="INVESTIGATING">Investigating Only</option>
                <option value="RESOLVED">Resolved Only</option>
              </select>
            </div>
          )}

          {activeTab === 'zones' && (
            <button
              onClick={() => setShowNewZoneModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Geofence Zone
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* TAB 1: INCIDENTS */}
          {activeTab === 'incidents' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">ID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Details / Location</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Logged At</th>
                    <th className="pb-3 text-right pr-2">Dispatch Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredIncidents.map((incident) => {
                    const isCrit = incident.severity === 'CRITICAL' || incident.incident_type === 'SOS';
                    const trip = trips.find((t) => t.trip_id === incident.trip_id);
                    const user = users.find((u) => u.user_id === trip?.user_id);

                    return (
                      <tr key={incident.incident_id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 pl-2 font-mono text-slate-400">#{incident.incident_id}</td>
                        <td className="py-3 font-semibold text-slate-200">
                          <span className="flex items-center gap-1.5">
                            {isCrit && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
                            {incident.incident_type}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              incident.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : incident.severity === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {incident.severity}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300">
                          <div className="font-medium text-slate-200">{incident.description}</div>
                          <div className="text-[11px] text-slate-400">
                            Tourist: <span className="text-sky-300">{user?.name || 'Tourist'}</span> ({incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)})
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                              incident.status === 'OPEN'
                                ? 'bg-rose-500/20 text-rose-400'
                                : incident.status === 'INVESTIGATING'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {incident.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 text-[11px]">
                          {new Date(incident.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <div className="flex justify-end gap-1.5">
                            {incident.status === 'OPEN' && (
                              <button
                                onClick={() => handleUpdateIncidentStatus(incident.incident_id, 'INVESTIGATING')}
                                className="rounded bg-amber-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-amber-500"
                              >
                                Assign Patrol
                              </button>
                            )}
                            {incident.status !== 'RESOLVED' && (
                              <button
                                onClick={() => handleUpdateIncidentStatus(incident.incident_id, 'RESOLVED')}
                                className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                              >
                                Resolve
                              </button>
                            )}
                            {incident.status === 'RESOLVED' && (
                              <span className="text-emerald-400 text-[11px] font-medium flex items-center justify-end gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> Resolved
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: ZONES */}
          {activeTab === 'zones' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {zones.map((zone) => (
                <div
                  key={zone.zone_id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        zone.zone_type === 'SAFE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : zone.zone_type === 'RESTRICTED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {zone.zone_type} ZONE
                    </span>
                    <span className="text-[11px] text-slate-400">Radius: {zone.radius}m</span>
                  </div>

                  <h3 className="mt-2.5 font-bold text-slate-100">{zone.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{zone.description}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                    <span>GPS: {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</span>
                    <span className="font-semibold text-slate-300">Risk: {zone.risk_level}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: TOURISTS & TRIPS */}
          {activeTab === 'tourists' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registered Tourists
                </h3>
                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.user_id}
                      className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 text-xs text-slate-300"
                    >
                      <div>
                        <div className="font-bold text-slate-100">{u.name}</div>
                        <div className="text-slate-400">{u.email} • {u.phone}</div>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        {u.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Trips & Itineraries
                </h3>
                <div className="space-y-2">
                  {trips.map((t) => {
                    const user = users.find((u) => u.user_id === t.user_id);
                    return (
                      <div
                        key={t.trip_id}
                        className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 text-xs text-slate-300"
                      >
                        <div>
                          <div className="font-bold text-slate-100">{t.destination}</div>
                          <div className="text-slate-400">
                            Tourist: <span className="text-sky-300">{user?.name}</span> • {new Date(t.start_time).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : t.status === 'PLANNED'
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Geofence Zone Modal */}
      {showNewZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Create New Geofence Zone</h3>
            <p className="mt-1 text-xs text-slate-400">
              Establish a geofenced perimeter for tourist safety monitoring.
            </p>

            <form onSubmit={handleCreateZone} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Zone Name</label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Tiger Hill Cliff"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  placeholder="Safety hazard description..."
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Zone Type</label>
                  <select
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value as any)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="SAFE">SAFE</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="DANGER">DANGER</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Risk Level</label>
                  <select
                    value={zoneRisk}
                    onChange={(e) => setZoneRisk(e.target.value as any)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={zoneLat}
                    onChange={(e) => setZoneLat(parseFloat(e.target.value))}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={zoneLng}
                    onChange={(e) => setZoneLng(parseFloat(e.target.value))}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Radius (m)</label>
                  <input
                    type="number"
                    required
                    value={zoneRadius}
                    onChange={(e) => setZoneRadius(parseInt(e.target.value))}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewZoneModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
