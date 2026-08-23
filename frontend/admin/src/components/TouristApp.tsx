import React, { useState, useEffect } from 'react';
import { User, Trip, Zone, Incident, Alert } from '../types';
import { MapSimulation } from './MapSimulation';
import {
  AlertOctagon,
  ShieldCheck,
  AlertTriangle,
  Compass,
  FileText,
  Send,
  CheckCircle2,
  PhoneCall,
  Navigation,
  MapPin,
  BellRing,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface TouristAppProps {
  users: User[];
  trips: Trip[];
  zones: Zone[];
  incidents: Incident[];
  alerts: Alert[];
  onRefreshData: () => void;
}

export const TouristApp: React.FC<TouristAppProps> = ({
  users,
  trips,
  zones,
  incidents,
  alerts,
  onRefreshData,
}) => {
  // Current logged in tourist (defaults to Priya Sharma or Arun Kumar)
  const [selectedUserId, setSelectedUserId] = useState<number>(users[0]?.user_id || 1);
  const currentUser = users.find((u) => u.user_id === selectedUserId) || users[0];
  const userTrips = trips.filter((t) => t.user_id === currentUser?.user_id);
  const activeTrip = userTrips.find((t) => t.status === 'ACTIVE') || userTrips[0];

  // GPS Simulation coordinates
  const [currentLat, setCurrentLat] = useState<number>(11.4064);
  const [currentLng, setCurrentLng] = useState<number>(76.6932);
  const [geofenceResult, setGeofenceResult] = useState<any>(null);
  const [isCheckingGeofence, setIsCheckingGeofence] = useState<boolean>(false);

  // SOS state
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosSuccessMessage, setSosSuccessMessage] = useState<string | null>(null);

  // Incident filing form state
  const [showIncidentForm, setShowIncidentForm] = useState<boolean>(false);
  const [incidentType, setIncidentType] = useState<string>('MEDICAL');
  const [incidentSeverity, setIncidentSeverity] = useState<string>('HIGH');
  const [incidentDescription, setIncidentDescription] = useState<string>('');
  const [incidentSubmitting, setIncidentSubmitting] = useState<boolean>(false);
  const [incidentNotice, setIncidentNotice] = useState<string | null>(null);

  // Check geofence whenever GPS changes
  const checkGeofence = async (lat: number, lng: number) => {
    if (!activeTrip) return;
    setIsCheckingGeofence(true);
    try {
      const res = await fetch('/api/geofence/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: activeTrip.trip_id,
          latitude: lat,
          longitude: lng,
        }),
      });
      const data = await res.json();
      setGeofenceResult(data);
      if (data.status === 'BREACH_DETECTED') {
        onRefreshData();
      }
    } catch (err) {
      console.error('Failed to check geofence', err);
    } finally {
      setIsCheckingGeofence(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    checkGeofence(lat, lng);
  };

  // Initial geofence check
  useEffect(() => {
    if (currentUser) {
      checkGeofence(currentLat, currentLng);
    }
  }, [selectedUserId]);

  // SOS Trigger handler
  const triggerSOS = async () => {
    if (!activeTrip) return;
    setIsSosActive(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: activeTrip.trip_id,
          zone_id: geofenceResult?.breaches?.[0]?.zone?.zone_id || null,
          incident_type: 'SOS',
          description: `EMERGENCY SOS triggered by ${currentUser.name} at coordinates (${currentLat}, ${currentLng})!`,
          latitude: currentLat,
          longitude: currentLng,
          severity: 'CRITICAL',
        }),
      });

      if (res.ok) {
        setSosSuccessMessage('🚨 SOS DISPATCH TRANSMITTED! Emergency authorities and nearest patrol units have been alerted.');
        onRefreshData();
      }
    } catch (err) {
      console.error('SOS request failed', err);
    } finally {
      setIsSosActive(false);
    }
  };

  // Incident filing submit handler
  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    setIncidentSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: activeTrip.trip_id,
          zone_id: geofenceResult?.breaches?.[0]?.zone?.zone_id || null,
          incident_type: incidentType,
          description: incidentDescription || `Reported ${incidentType} safety issue`,
          latitude: currentLat,
          longitude: currentLng,
          severity: incidentSeverity,
        }),
      });

      if (res.ok) {
        setIncidentNotice('Incident / E-FIR filed successfully! Assigned to safety dispatch.');
        setIncidentDescription('');
        setShowIncidentForm(false);
        onRefreshData();
      }
    } catch (err) {
      console.error('Failed to submit incident', err);
    } finally {
      setIncidentSubmitting(false);
    }
  };

  // Preset location quick buttons
  const locationPresets = [
    { label: 'Ooty Lake (Safe)', lat: 11.4064, lng: 76.6932, type: 'safe' },
    { label: 'Forest Reserve (Restricted Breach)', lat: 11.4205, lng: 76.7002, type: 'warning' },
    { label: 'Landslide Cliff (Danger Breach)', lat: 11.4300, lng: 76.7100, type: 'danger' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: User switcher & Trip Context */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/30 border border-sky-500/30 text-sky-400">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Tourist Safety Companion</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live GPS Active
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">{currentUser?.name} ({currentUser?.phone})</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-400 font-medium">Switch Tourist:</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SOS Alert Notification banner if triggered */}
      {sosSuccessMessage && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-rose-200">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-6 w-6 text-rose-400 shrink-0 animate-bounce" />
            <p className="text-sm font-semibold">{sosSuccessMessage}</p>
          </div>
          <button
            onClick={() => setSosSuccessMessage(null)}
            className="text-xs font-bold text-rose-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {incidentNotice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-emerald-200">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            {incidentNotice}
          </div>
          <button onClick={() => setIncidentNotice(null)} className="text-xs text-emerald-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tourist Grid: Map, Geofence Radar, SOS Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Map & GPS Presets */}
        <div className="space-y-4 lg:col-span-8">
          <MapSimulation
            zones={zones}
            incidents={incidents}
            currentLat={currentLat}
            currentLng={currentLng}
            onSelectLocation={handleLocationChange}
            interactive={true}
          />

          {/* Quick Location Preset Selector */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                GPS Coordinate Simulator (Demonstration Presets)
              </span>
              <span className="text-[11px] text-slate-400">
                Simulate walking into different zone perimeters
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {locationPresets.map((preset) => {
                const isCurrent =
                  Math.abs(currentLat - preset.lat) < 0.001 && Math.abs(currentLng - preset.lng) < 0.001;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handleLocationChange(preset.lat, preset.lng)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'border border-sky-500 bg-sky-500/20 text-sky-200 ring-1 ring-sky-500'
                        : 'border border-slate-800 bg-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <Navigation className="h-3.5 w-3.5 text-sky-400" />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Geofence Breach Radar & SOS Trigger */}
        <div className="space-y-4 lg:col-span-4">
          {/* Geofence Detection Card */}
          <div
            className={`rounded-xl border p-4 transition-all backdrop-blur-md ${
              geofenceResult?.status === 'BREACH_DETECTED'
                ? 'border-rose-500/50 bg-rose-950/30'
                : 'border-slate-800 bg-slate-900/80'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Geofence Status
              </span>
              {isCheckingGeofence && (
                <span className="text-[10px] text-sky-400 animate-pulse">Calculating radar...</span>
              )}
            </div>

            {geofenceResult?.status === 'BREACH_DETECTED' ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 rounded-lg bg-rose-500/20 p-2.5 text-rose-300 border border-rose-500/30">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 animate-bounce" />
                  <div className="text-xs">
                    <span className="font-bold block">ZONE BREACH DETECTED!</span>
                    <span>You entered {geofenceResult.breaches[0]?.zone?.name} ({geofenceResult.breaches[0]?.zone?.risk_level} Risk).</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300">
                  An automatic telemetry alert has been dispatched to the Safety Control room. Please proceed to the safe perimeter immediately.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 p-3 text-emerald-300 border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold block">In Safe Perimeter</span>
                  <span className="text-slate-400 text-[11px]">No active geofence violations detected.</span>
                </div>
              </div>
            )}
          </div>

          {/* Emergency SOS Panic Button */}
          <div className="rounded-xl border border-rose-900/50 bg-gradient-to-b from-rose-950/40 to-slate-900 p-5 text-center shadow-xl">
            <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-400">
              <AlertOctagon className="h-4 w-4 text-rose-400" />
              Emergency Panic Protocol
            </div>
            <p className="mb-4 text-[11px] text-slate-400">
              Press to instantly broadcast your GPS to Police, Medical, & Forest Rangers
            </p>

            <button
              onClick={triggerSOS}
              disabled={isSosActive}
              className="group relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-rose-500 bg-rose-600 text-white font-extrabold text-lg shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <span className="absolute inset-0 rounded-full bg-rose-400 opacity-25 group-hover:animate-ping" />
              {isSosActive ? 'SENDING...' : 'SOS'}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <PhoneCall className="h-3.5 w-3.5 text-rose-400" />
              <span>Direct Hotline: 112 (Police) / 108 (Ambulance)</span>
            </div>
          </div>

          {/* Quick Actions: File E-FIR / Incident */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <button
              onClick={() => setShowIncidentForm(!showIncidentForm)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-700 transition"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                {showIncidentForm ? 'Close Incident Form' : 'File E-FIR / Report Incident'}
              </span>
              <span className="text-[11px] text-slate-400">{showIncidentForm ? '▲' : '▼'}</span>
            </button>

            {showIncidentForm && (
              <form onSubmit={handleSubmitIncident} className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Incident Category</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="MEDICAL">Medical Emergency / Injury</option>
                    <option value="LOST_ROUTE">Lost Route / Disoriented</option>
                    <option value="WILDLIFE">Wild Animal Sighting</option>
                    <option value="THEFT">Theft / Luggage Lost</option>
                    <option value="HARASSMENT">Harassment / Safety Concern</option>
                    <option value="NATURAL_HAZARD">Landslide / Flash Flood</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Severity</label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="LOW">Low (Information)</option>
                    <option value="MEDIUM">Medium (Assistance Needed)</option>
                    <option value="HIGH">High (Urgent Response)</option>
                    <option value="CRITICAL">Critical (Immediate Hazard)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Details</label>
                  <textarea
                    rows={2}
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    placeholder="Describe what happened..."
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={incidentSubmitting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  {incidentSubmitting ? 'Transmitting...' : 'Submit Official Report'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
