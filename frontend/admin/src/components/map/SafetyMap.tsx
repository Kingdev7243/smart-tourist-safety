import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  Copy,
  Check,
  X,
  Crosshair,
  Compass,
  Filter,
  Maximize2,
  Navigation,
  Eye,
  EyeOff,
  Radio
} from 'lucide-react';
import { Zone, Incident, RiskLevel, SeverityLevel } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';

interface SafetyMapProps {
  zones: Zone[];
  incidents: Incident[];
  selectedIncidentId?: number | null;
  selectedZoneId?: number | null;
  onSelectIncident?: (incident: Incident | null) => void;
  onSelectZone?: (zone: Zone | null) => void;
  height?: string;
}

interface InspectedPoint {
  lat: number;
  lng: number;
  screenX: number;
  screenY: number;
}

export const SafetyMap: React.FC<SafetyMapProps> = ({
  zones,
  incidents,
  selectedIncidentId,
  selectedZoneId,
  onSelectIncident,
  onSelectZone,
  height = '560px',
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Layer filters
  const [showZones, setShowZones] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SeverityLevel>('ALL');
  const [showLegend, setShowLegend] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Clicked coordinate inspection point
  const [inspectedPoint, setInspectedPoint] = useState<InspectedPoint | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Inspected objects
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);

  // Synchronize incoming props
  useEffect(() => {
    if (selectedZoneId) {
      const found = zones.find((z) => z.zone_id === selectedZoneId);
      if (found) {
        setActiveZone(found);
        setActiveIncident(null);
        setInspectedPoint({
          lat: found.latitude,
          lng: found.longitude,
          screenX: 0,
          screenY: 0,
        });
      }
    }
  }, [selectedZoneId, zones]);

  useEffect(() => {
    if (selectedIncidentId) {
      const found = incidents.find((i) => i.incident_id === selectedIncidentId);
      if (found) {
        setActiveIncident(found);
        setActiveZone(null);
        setInspectedPoint({
          lat: found.latitude,
          lng: found.longitude,
          screenX: 0,
          screenY: 0,
        });
      }
    }
  }, [selectedIncidentId, incidents]);

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.max(300, Math.floor(entry.contentRect.width)),
          height: Math.max(260, Math.floor(entry.contentRect.height)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute map bounding box dynamically from real API coordinates
  const bounds = useMemo(() => {
    const points: { lat: number; lng: number }[] = [];
    zones.forEach((z) => {
      points.push({ lat: z.latitude, lng: z.longitude });
      // Account for radius (approx 1 deg lat ≈ 111,000m)
      const latOffset = (z.radius || 500) / 111000;
      points.push({ lat: z.latitude + latOffset, lng: z.longitude });
      points.push({ lat: z.latitude - latOffset, lng: z.longitude });
    });
    incidents.forEach((i) => points.push({ lat: i.latitude, lng: i.longitude }));

    if (points.length === 0) {
      return {
        minLat: 11.35,
        maxLat: 11.45,
        minLng: 76.65,
        maxLng: 76.75,
        centerLat: 11.41,
        centerLng: 76.70,
      };
    }

    const minLat = Math.min(...points.map((p) => p.lat));
    const maxLat = Math.max(...points.map((p) => p.lat));
    const minLng = Math.min(...points.map((p) => p.lng));
    const maxLng = Math.max(...points.map((p) => p.lng));

    const latSpan = Math.max(maxLat - minLat, 0.02);
    const lngSpan = Math.max(maxLng - minLng, 0.02);

    const latPadding = latSpan * 0.15;
    const lngPadding = lngSpan * 0.15;

    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
    };
  }, [zones, incidents]);

  // Coordinate Projection Helper (Lat/Lng to base SVG pixel space)
  const project = useCallback((lat: number, lng: number) => {
    const margin = 40;
    const drawWidth = Math.max(100, dimensions.width - margin * 2);
    const drawHeight = Math.max(100, dimensions.height - margin * 2);

    const latSpan = bounds.maxLat - bounds.minLat || 0.05;
    const lngSpan = bounds.maxLng - bounds.minLng || 0.05;

    const normX = (lng - bounds.minLng) / lngSpan;
    const normY = (bounds.maxLat - lat) / latSpan;

    const x = margin + normX * drawWidth;
    const y = margin + normY * drawHeight;

    return { x, y };
  }, [bounds, dimensions]);

  // Inverse Projection Helper (Screen pixel coordinates back to real Lat/Lng)
  const unproject = useCallback((screenX: number, screenY: number) => {
    const margin = 40;
    const drawWidth = Math.max(100, dimensions.width - margin * 2);
    const drawHeight = Math.max(100, dimensions.height - margin * 2);

    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;

    // Reverse pan & zoom centered around container center
    const baseX = (screenX - cx - pan.x) / zoom + cx;
    const baseY = (screenY - cy - pan.y) / zoom + cy;

    const normX = (baseX - margin) / drawWidth;
    const normY = (baseY - margin) / drawHeight;

    const latSpan = bounds.maxLat - bounds.minLat || 0.05;
    const lngSpan = bounds.maxLng - bounds.minLng || 0.05;

    const lng = bounds.minLng + normX * lngSpan;
    const lat = bounds.maxLat - normY * latSpan;

    return { lat, lng };
  }, [bounds, dimensions, pan, zoom]);

  // Calculate zone pixel radius based on real meters
  const metersToPixels = useCallback((radiusMeters: number) => {
    const margin = 40;
    const drawHeight = Math.max(100, dimensions.height - margin * 2);
    const latSpan = bounds.maxLat - bounds.minLat || 0.05;
    const totalMetersY = latSpan * 111320;
    const pixelsPerMeter = drawHeight / totalMetersY;
    const radius = radiusMeters * pixelsPerMeter;
    return Math.max(14, radius);
  }, [bounds, dimensions]);

  // Check if incident is inside a zone (Haversine distance calculation)
  const getZoneForIncident = useCallback((inc: Incident) => {
    for (const z of zones) {
      const dLat = (z.latitude - inc.latitude) * Math.PI / 180;
      const dLng = (z.longitude - inc.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(inc.latitude * Math.PI / 180) * Math.cos(z.latitude * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = 6371000 * c;
      if (distanceMeters <= z.radius) {
        return z;
      }
    }
    return null;
  }, [zones]);

  // Mouse & Touch Pan Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragMoved(false);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = Math.abs(clientX - dragStart.x - pan.x);
    const deltaY = Math.abs(clientY - dragStart.y - pan.y);
    if (deltaX > 3 || deltaY > 3) {
      setDragMoved(true);
    }
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Click on map to inspect coordinates
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragMoved) return; // Ignore drag release clicks

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const { lat, lng } = unproject(screenX, screenY);
    setInspectedPoint({ lat, lng, screenX, screenY });
    setActiveZone(null);
    setActiveIncident(null);
    if (onSelectZone) onSelectZone(null);
    if (onSelectIncident) onSelectIncident(null);
  };

  // Copy coordinates to clipboard
  const handleCopyCoordinates = () => {
    if (!inspectedPoint) return;
    const text = `${inspectedPoint.lat.toFixed(6)}, ${inspectedPoint.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Reset Map View
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveZone(null);
    setActiveIncident(null);
    setInspectedPoint(null);
    if (onSelectZone) onSelectZone(null);
    if (onSelectIncident) onSelectIncident(null);
  };

  // Filtered Zones based on user toggles
  const visibleZones = useMemo(() => {
    if (!showZones) return [];
    return zones.filter((z) => {
      if (riskFilter !== 'ALL' && z.risk_level !== riskFilter) return false;
      return true;
    });
  }, [zones, showZones, riskFilter]);

  // Filtered Incidents based on user toggles
  const visibleIncidents = useMemo(() => {
    if (!showIncidents) return [];
    return incidents.filter((inc) => {
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
      return true;
    });
  }, [incidents, showIncidents, severityFilter]);

  // Color schemes for zones based strictly on Risk Level
  const getZoneStyle = (risk: RiskLevel, type: string, isSelected: boolean) => {
    switch (risk) {
      case 'CRITICAL':
        return {
          stroke: '#ef4444',
          fill: isSelected ? 'rgba(239, 68, 68, 0.32)' : 'rgba(220, 38, 38, 0.18)',
          strokeWidth: isSelected ? 3.5 : 2,
          dash: undefined,
          badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-800',
        };
      case 'HIGH':
        return {
          stroke: '#f97316',
          fill: isSelected ? 'rgba(249, 115, 22, 0.28)' : 'rgba(234, 88, 12, 0.16)',
          strokeWidth: isSelected ? 3.5 : 1.8,
          dash: '5,3',
          badgeBg: 'bg-orange-950/90 text-orange-300 border-orange-800',
        };
      case 'LOW':
      default:
        return {
          stroke: '#10b981',
          fill: isSelected ? 'rgba(16, 185, 129, 0.24)' : 'rgba(5, 150, 105, 0.12)',
          strokeWidth: isSelected ? 3 : 1.5,
          dash: undefined,
          badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-800',
        };
    }
  };

  // Color schemes for incident markers based on Severity
  const getIncidentColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return { pin: '#ef4444', ring: '#fee2e2', text: '#ffffff' };
      case 'HIGH':
        return { pin: '#f97316', ring: '#ffedd5', text: '#ffffff' };
      case 'MEDIUM':
        return { pin: '#f59e0b', ring: '#fef3c7', text: '#ffffff' };
      case 'LOW':
      default:
        return { pin: '#0ea5e9', ring: '#e0f2fe', text: '#ffffff' };
    }
  };

  // Center & Grid lines values for tactical topo appearance
  const gridTicks = useMemo(() => {
    const latTicks = [];
    const lngTicks = [];
    const steps = 4;
    const latStep = (bounds.maxLat - bounds.minLat) / steps;
    const lngStep = (bounds.maxLng - bounds.minLng) / steps;

    for (let i = 1; i < steps; i++) {
      latTicks.push(bounds.minLat + latStep * i);
      lngTicks.push(bounds.minLng + lngStep * i);
    }
    return { latTicks, lngTicks };
  }, [bounds]);

  return (
    <div
      ref={containerRef}
      id="tactical-safety-map-container"
      className="relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 select-none shadow-xl flex flex-col font-sans"
      style={{ height }}
    >
      {/* Top Floating Tactical HUD & Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Layer & Filter Buttons Bar */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 text-xs text-white pointer-events-auto shadow-xl">
          {/* Zones Toggle */}
          <button
            id="map-toggle-zones-btn"
            onClick={() => setShowZones(!showZones)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              showZones 
                ? 'bg-emerald-800 text-white shadow-sm' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{t('layerZones')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {zones.length}
            </span>
          </button>

          {/* Incidents Toggle */}
          <button
            id="map-toggle-incidents-btn"
            onClick={() => setShowIncidents(!showIncidents)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              showIncidents 
                ? 'bg-rose-800 text-white shadow-sm' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('layerIncidents')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {incidents.length}
            </span>
          </button>

          {/* Filter Dropdown Toggle */}
          <button
            id="map-filter-toggle-btn"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              riskFilter !== 'ALL' || severityFilter !== 'ALL'
                ? 'bg-amber-700 text-white'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('filter')}</span>
            {(riskFilter !== 'ALL' || severityFilter !== 'ALL') && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {/* Zoom, Pan, Reset & Center Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 text-white pointer-events-auto shadow-xl">
          <button
            id="map-zoom-in-btn"
            onClick={() => setZoom((z) => Math.min(z * 1.3, 5))}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-white transition-colors cursor-pointer"
            title={t('zoomIn')}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="map-zoom-out-btn"
            onClick={() => setZoom((z) => Math.max(z / 1.3, 0.4))}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-white transition-colors cursor-pointer"
            title={t('zoomOut')}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="map-reset-view-btn"
            onClick={handleResetView}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-white transition-colors cursor-pointer"
            title={t('centerMap')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Dropdown Popover */}
      {showFilterMenu && (
        <div className="absolute top-16 left-3 z-30 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl text-xs text-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {t('filter')} Layers
            </span>
            <button
              onClick={() => setShowFilterMenu(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              {t('filterRisk')} (Zones)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['ALL', 'LOW', 'HIGH', 'CRITICAL'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    riskFilter === lvl
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl === 'ALL' ? t('allRisks') : lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              {t('filterSeverity')} (Incidents)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-rose-700 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev === 'ALL' ? t('allSeverities') : sev}
                </button>
              ))}
            </div>
          </div>

          {(riskFilter !== 'ALL' || severityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setRiskFilter('ALL');
                setSeverityFilter('ALL');
              }}
              className="w-full py-1.5 mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
            >
              Reset Layer Filters
            </button>
          )}
        </div>
      )}

      {/* Main Interactive SVG Tactical Canvas */}
      <div 
        className="w-full h-full cursor-crosshair relative touch-none"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={handlePointerUp}
      >
        <svg
          ref={svgRef}
          id="tactical-safety-svg"
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          onClick={handleMapClick}
          className="w-full h-full block"
        >
          <defs>
            {/* Topographic Tactical Matrix Pattern */}
            <pattern id="tacticalGridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#0f372d"
                strokeWidth="0.8"
                strokeOpacity="0.45"
              />
              <path
                d="M 30 0 L 30 60 M 0 30 L 60 30"
                fill="none"
                stroke="#064e3b"
                strokeWidth="0.4"
                strokeDasharray="2,4"
                strokeOpacity="0.3"
              />
              <circle cx="30" cy="30" r="1.2" fill="#10b981" fillOpacity="0.25" />
            </pattern>

            {/* Glowing filter for selected elements */}
            <filter id="tacticalGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Deep Forest-Tactical Neutral Dark Background */}
          <rect width="100%" height="100%" fill="#031610" />
          <rect width="100%" height="100%" fill="url(#tacticalGridPattern)" />

          {/* Coordinate Scale Ticks on Canvas Perimeter */}
          {gridTicks.latTicks.map((lat, idx) => {
            const { y } = project(lat, bounds.minLng);
            return (
              <g key={`lat-tick-${idx}`} className="pointer-events-none opacity-40">
                <line x1="0" y1={y} x2={dimensions.width} y2={y} stroke="#064e3b" strokeWidth="0.5" strokeDasharray="3,6" />
                <text x="8" y={y - 3} fill="#10b981" fontSize="9" fontFamily="monospace">
                  {lat.toFixed(3)}°N
                </text>
              </g>
            );
          })}

          {gridTicks.lngTicks.map((lng, idx) => {
            const { x } = project(bounds.minLat, lng);
            return (
              <g key={`lng-tick-${idx}`} className="pointer-events-none opacity-40">
                <line x1={x} y1="0" x2={x} y2={dimensions.height} stroke="#064e3b" strokeWidth="0.5" strokeDasharray="3,6" />
                <text x={x + 3} y="16" fill="#10b981" fontSize="9" fontFamily="monospace">
                  {lng.toFixed(3)}°E
                </text>
              </g>
            );
          })}

          {/* Pan & Zoom Transformed Scene Group */}
          <g
            transform={`translate(${pan.x + dimensions.width / 2}, ${pan.y + dimensions.height / 2}) scale(${zoom}) translate(${-dimensions.width / 2}, ${-dimensions.height / 2})`}
          >
            {/* 1. SAFETY ZONES LAYER */}
            {visibleZones.map((zone) => {
              const { x, y } = project(zone.latitude, zone.longitude);
              const r = metersToPixels(zone.radius);
              const isSelected = activeZone?.zone_id === zone.zone_id || selectedZoneId === zone.zone_id;
              const style = getZoneStyle(zone.risk_level, zone.zone_type, isSelected);

              return (
                <g
                  key={`zone-${zone.zone_id}`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveZone(zone);
                    setActiveIncident(null);
                    setInspectedPoint({
                      lat: zone.latitude,
                      lng: zone.longitude,
                      screenX: x,
                      screenY: y,
                    });
                    if (onSelectZone) onSelectZone(zone);
                  }}
                >
                  {/* Outer selection beacon pulse */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={r + 8}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth="2"
                      strokeOpacity="0.4"
                      strokeDasharray="4,4"
                    >
                      <animate
                        attributeName="r"
                        values={`${r + 4};${r + 14};${r + 4}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.6;0.1;0.6"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Zone Transparent Area Fill */}
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    strokeDasharray={style.dash}
                    className="transition-all duration-200 hover:stroke-white"
                  />

                  {/* Center Anchor Point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 5 : 3.5}
                    fill={style.stroke}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />

                  {/* Clean Non-Obtrusive Zone Label */}
                  <g className="pointer-events-none select-none">
                    <rect
                      x={x - 45}
                      y={y - r - 20}
                      width="90"
                      height="16"
                      rx="4"
                      fill="#022c22"
                      fillOpacity="0.85"
                      stroke={style.stroke}
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={y - r - 8}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="9"
                      fontWeight="bold"
                      className="font-sans"
                    >
                      {zone.name.length > 13 ? `${zone.name.slice(0, 12)}…` : zone.name}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* 2. REPORTED INCIDENTS LAYER */}
            {visibleIncidents.map((incident) => {
              const { x, y } = project(incident.latitude, incident.longitude);
              const isSelected = activeIncident?.incident_id === incident.incident_id || selectedIncidentId === incident.incident_id;
              const isCritical = incident.severity === 'CRITICAL';
              const isOpen = incident.status !== 'RESOLVED';
              const colors = getIncidentColor(incident.severity);

              return (
                <g
                  key={`incident-${incident.incident_id}`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIncident(incident);
                    setActiveZone(null);
                    setInspectedPoint({
                      lat: incident.latitude,
                      lng: incident.longitude,
                      screenX: x,
                      screenY: y,
                    });
                    if (onSelectIncident) onSelectIncident(incident);
                  }}
                >
                  {/* Radar pulse for active critical emergencies */}
                  {isOpen && isCritical && (
                    <circle cx={x} cy={y - 12} r={16} fill="#ef4444" opacity="0.2">
                      <animate
                        attributeName="r"
                        values="8;24;8"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0;0.6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Tactical Diamond / Pin Marker */}
                  <g transform={`translate(${x - 10}, ${y - 24})`}>
                    <path
                      d="M10 0 C4.5 0 0 4.5 0 10 C0 17 10 24 10 24 C10 24 20 17 20 10 C20 4.5 15.5 0 10 0 Z"
                      fill={colors.pin}
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={isSelected ? '2.5' : '1.2'}
                      filter={isSelected ? 'url(#tacticalGlow)' : undefined}
                    />
                    <circle cx="10" cy="9" r="4" fill="#ffffff" />
                    {isCritical ? (
                      <path
                        d="M10 6.5 v3.5 m0 1.8 h.01"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    ) : (
                      <circle cx="10" cy="9" r="2" fill={colors.pin} />
                    )}
                  </g>

                  {/* Compact Incident ID Pill */}
                  <g className="pointer-events-none select-none">
                    <rect
                      x={x - 30}
                      y={y + 4}
                      width="60"
                      height="15"
                      rx="3"
                      fill="#0f172a"
                      fillOpacity="0.9"
                      stroke={colors.pin}
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={y + 15}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      #{incident.incident_id} {incident.incident_type.slice(0, 7)}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* 3. CLICKED / INSPECTED POINT CROSSHAIR */}
            {inspectedPoint && (
              <g className="pointer-events-none">
                {(() => {
                  const { x, y } = project(inspectedPoint.lat, inspectedPoint.lng);
                  return (
                    <g>
                      {/* Crosshair Target Rings */}
                      <circle
                        cx={x}
                        cy={y}
                        r={12}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                      >
                        <animate
                          attributeName="transform"
                          type="rotate"
                          from={`0 ${x} ${y}`}
                          to={`360 ${x} ${y}`}
                          dur="10s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle cx={x} cy={y} r={3} fill="#38bdf8" />
                      {/* Crosshair reticle lines */}
                      <line x1={x - 18} y1={y} x2={x - 6} y2={y} stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1={x + 6} y1={y} x2={x + 18} y2={y} stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1={x} y1={y - 18} x2={x} y2={y - 6} stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1={x} y1={y + 6} x2={x} y2={y + 18} stroke="#38bdf8" strokeWidth="1.5" />
                    </g>
                  );
                })()}
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Floating Coordinate Inspector Bar (Click-To-Inspect Output with Copy Button) */}
      {inspectedPoint && (
        <div 
          id="map-coordinate-inspector-hud"
          className="absolute bottom-14 left-3 right-3 sm:right-auto z-20 bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-xl p-3 shadow-2xl text-xs text-white max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-150 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px] uppercase tracking-wider">
              <Crosshair className="w-4 h-4" />
              <span>{t('clickedCoords')}</span>
            </div>
            <button
              onClick={() => setInspectedPoint(null)}
              className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 font-mono text-xs space-y-0.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">{t('latitude')}:</span>
              <span className="font-bold text-sky-300">{inspectedPoint.lat.toFixed(6)}°N</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">{t('longitude')}:</span>
              <span className="font-bold text-sky-300">{inspectedPoint.lng.toFixed(6)}°E</span>
            </div>
          </div>

          <button
            id="map-copy-coords-btn"
            onClick={handleCopyCoordinates}
            className="w-full py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>{t('coordsCopied')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t('copyCoords')}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Floating Bottom Legend & Compass HUD */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Minimal Responsive Legend */}
        {showLegend && (
          <div className="flex items-center flex-wrap gap-2.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 pointer-events-auto shadow-md">
            <span className="text-slate-500 font-bold uppercase text-[10px]">
              {t('mapLegend')}:
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>LOW</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>MED</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>HIGH</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>CRIT</span>
            </div>
            <div className="flex items-center gap-1 pl-1.5 border-l border-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 rotate-45" />
              <span>Incident</span>
            </div>
          </div>
        )}

        {/* Center Coordinates Readout & Mobile Hint */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] font-mono text-emerald-400 pointer-events-auto shadow-md">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>{bounds.centerLat.toFixed(4)}°N, {bounds.centerLng.toFixed(4)}°E</span>
        </div>
      </div>

      {/* Selected Safety Zone Information Card / Bottom-Sheet (Responsive on Mobile) */}
      {activeZone && (
        <div 
          id="map-selected-zone-card"
          className="absolute top-16 right-3 bottom-auto max-md:top-auto max-md:bottom-3 max-md:left-3 max-md:right-3 z-30 w-80 max-w-full bg-slate-900/95 backdrop-blur-md border border-emerald-600/60 rounded-2xl p-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {t('selectedZone')}
                </span>
                <h4 className="font-bold text-sm text-white">{activeZone.name}</h4>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveZone(null);
                if (onSelectZone) onSelectZone(null);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <StatusBadge type="zone_type" value={activeZone.zone_type} size="sm" />
              <StatusBadge type="risk_level" value={activeZone.risk_level} size="sm" />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeZone.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {activeZone.status}
              </span>
            </div>

            <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs leading-relaxed">
              {activeZone.description || 'No description configured for this safety geofence.'}
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">{t('zoneRadius')}</span>
                <span className="font-bold text-emerald-400">{activeZone.radius} m</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Zone ID</span>
                <span className="font-bold text-slate-200">#{activeZone.zone_id}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">{t('coordinates')}</span>
                <span className="font-bold text-sky-300">
                  {activeZone.latitude.toFixed(6)}, {activeZone.longitude.toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Incident Information Card / Bottom-Sheet (Responsive on Mobile) */}
      {activeIncident && (
        <div 
          id="map-selected-incident-card"
          className="absolute top-16 right-3 bottom-auto max-md:top-auto max-md:bottom-3 max-md:left-3 max-md:right-3 z-30 w-80 max-w-full bg-slate-900/95 backdrop-blur-md border border-rose-600/60 rounded-2xl p-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {t('selectedIncident')}
                </span>
                <h4 className="font-bold text-sm text-white">
                  #{activeIncident.incident_id} {activeIncident.incident_type}
                </h4>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveIncident(null);
                if (onSelectIncident) onSelectIncident(null);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <StatusBadge type="incident_status" value={activeIncident.status} size="sm" />
              <StatusBadge type="incident_severity" value={activeIncident.severity} size="sm" />
            </div>

            <p className="text-slate-200 bg-rose-950/30 p-2.5 rounded-xl border border-rose-900/50 text-xs leading-relaxed">
              {activeIncident.description}
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Trip Ref</span>
                <span className="font-bold text-slate-200">Trip #{activeIncident.trip_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Time</span>
                <span className="font-bold text-slate-200">
                  {new Date(activeIncident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">{t('coordinates')}</span>
                <span className="font-bold text-sky-300">
                  {activeIncident.latitude.toFixed(6)}, {activeIncident.longitude.toFixed(6)}
                </span>
              </div>
              {(() => {
                const insideZone = getZoneForIncident(activeIncident);
                if (insideZone) {
                  return (
                    <div className="col-span-2 pt-1 border-t border-slate-800 text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Inside Geofence: <strong>{insideZone.name}</strong></span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
