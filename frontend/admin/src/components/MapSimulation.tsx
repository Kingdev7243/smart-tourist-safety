import React from 'react';
import { Zone, Incident } from '../types';
import { ShieldAlert, AlertTriangle, ShieldCheck, MapPin, Radio } from 'lucide-react';

interface MapSimulationProps {
  zones: Zone[];
  incidents: Incident[];
  currentLat: number;
  currentLng: number;
  onSelectLocation?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export const MapSimulation: React.FC<MapSimulationProps> = ({
  zones,
  incidents,
  currentLat,
  currentLng,
  onSelectLocation,
  interactive = true,
}) => {
  // Center roughly on Ooty/Nilgiris/Kodaikanal coordinate bounding box
  // Default center: 11.418, 76.700
  const centerLat = 11.418;
  const centerLng = 76.702;
  const zoomScale = 2200; // pixels per degree

  const mapWidth = 600;
  const mapHeight = 360;

  // Convert lat/lng to SVG pixel space
  const project = (lat: number, lng: number) => {
    const x = mapWidth / 2 + (lng - centerLng) * zoomScale;
    const y = mapHeight / 2 - (lat - centerLat) * zoomScale;
    return { x, y };
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onSelectLocation) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Inverse project
    const lng = centerLng + (clickX - mapWidth / 2) / zoomScale;
    const lat = centerLat - (clickY - mapHeight / 2) / zoomScale;
    onSelectLocation(parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5)));
  };

  const touristPos = project(currentLat, currentLng);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl">
      {/* Map Header Status */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
          <span>Tactical Radar & Geofence Matrix</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500/80"></span> Safe
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500/80"></span> Restricted
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500/80"></span> Danger
          </span>
          {interactive && (
            <span className="hidden rounded bg-slate-800 px-2 py-0.5 text-sky-400 sm:inline-block">
              Click map to reposition GPS
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative aspect-[16/9] max-h-[380px] w-full cursor-crosshair overflow-hidden">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="h-full w-full select-none"
          onClick={handleMapClick}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>
            <radialGradient id="safeGrad">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </radialGradient>
            <radialGradient id="restrictedGrad">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.08" />
            </radialGradient>
            <radialGradient id="dangerGrad">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
            </radialGradient>
          </defs>

          <rect width={mapWidth} height={mapHeight} fill="#090d16" />
          <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

          {/* Contour elevation simulation lines */}
          <ellipse cx="280" cy="190" rx="190" ry="120" fill="none" stroke="#172554" strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx="280" cy="190" rx="140" ry="85" fill="none" stroke="#1e1b4b" strokeWidth="1" strokeDasharray="4 4" />

          {/* Render Geofence Zones */}
          {zones.map((zone) => {
            const { x, y } = project(zone.latitude, zone.longitude);
            // Rough pixel radius conversion (meters to degrees to pixels)
            const pixelRadius = Math.max(22, (zone.radius / 111000) * zoomScale * 0.85);

            let strokeColor = '#10b981';
            let fillGrad = 'url(#safeGrad)';
            let textColor = 'text-emerald-400';

            if (zone.zone_type === 'RESTRICTED') {
              strokeColor = '#f59e0b';
              fillGrad = 'url(#restrictedGrad)';
              textColor = 'text-amber-400';
            } else if (zone.zone_type === 'DANGER') {
              strokeColor = '#ef4444';
              fillGrad = 'url(#dangerGrad)';
              textColor = 'text-rose-400';
            }

            return (
              <g key={zone.zone_id} className="transition-all duration-300">
                {/* Outer zone circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={pixelRadius}
                  fill={fillGrad}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  strokeDasharray={zone.zone_type === 'SAFE' ? 'none' : '4 3'}
                />

                {/* Center marker */}
                <circle cx={x} cy={y} r="3" fill={strokeColor} />

                {/* Zone Label */}
                <text
                  x={x}
                  y={y - pixelRadius - 5}
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="9.5"
                  fontWeight="600"
                  className="pointer-events-none drop-shadow"
                >
                  {zone.name} ({zone.radius}m)
                </text>
              </g>
            );
          })}

          {/* Render Incidents / SOS markers */}
          {incidents
            .filter((i) => i.status !== 'RESOLVED')
            .map((inc) => {
              const { x, y } = project(inc.latitude, inc.longitude);
              const isCritical = inc.severity === 'CRITICAL' || inc.incident_type === 'SOS';

              return (
                <g key={inc.incident_id}>
                  {/* Pulsing ring for active incident */}
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="none"
                    stroke={isCritical ? '#ef4444' : '#f59e0b'}
                    strokeWidth="1.5"
                    className="animate-ping"
                    opacity="0.75"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill={isCritical ? '#ef4444' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

          {/* Tourist Pin (Current Position) */}
          <g transform={`translate(${touristPos.x}, ${touristPos.y})`}>
            {/* Pulsing radar beam */}
            <circle cx="0" cy="0" r="16" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
            <circle cx="0" cy="0" r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
            <text x="0" y="-12" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" className="drop-shadow">
              📍 Current Location
            </text>
          </g>
        </svg>

        {/* Floating coordinates indicator */}
        <div className="absolute bottom-3 left-3 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-md shadow-lg">
          <div>LAT: <span className="text-sky-400">{currentLat.toFixed(5)}°N</span></div>
          <div>LNG: <span className="text-sky-400">{currentLng.toFixed(5)}°E</span></div>
        </div>
      </div>
    </div>
  );
};
