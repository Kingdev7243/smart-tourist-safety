import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  Plus, 
  Search, 
  MapPin, 
  Edit, 
  X,
  Power,
  Layers,
  Compass
} from 'lucide-react';
import { Zone, ZoneType, RiskLevel } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ZonesViewProps {
  zones: Zone[];
  isLoading: boolean;
  onCreateZone: (data: {
    name: string;
    description: string;
    zone_type: ZoneType;
    latitude: number;
    longitude: number;
    radius: number;
    risk_level: RiskLevel;
  }) => Promise<void>;
  onToggleZoneStatus: (zoneId: number, status: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  onSelectOnMap?: (zone: Zone) => void;
}

export const ZonesView: React.FC<ZonesViewProps> = ({
  zones,
  isLoading,
  onCreateZone,
  onToggleZoneStatus,
  onSelectOnMap,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    zone_type: 'RESTRICTED' as ZoneType,
    latitude: '11.4100',
    longitude: '76.7000',
    radius: '500',
    risk_level: 'HIGH' as RiskLevel,
  });

  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || zone.zone_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const rad = parseFloat(formData.radius);

    if (!formData.name.trim()) {
      setErrorMessage('Zone name is required.');
      return;
    }

    if (isNaN(lat) || isNaN(lng) || isNaN(rad) || rad <= 0) {
      setErrorMessage('Valid numeric coordinates and positive radius are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateZone({
        name: formData.name.trim(),
        description: formData.description.trim(),
        zone_type: formData.zone_type,
        latitude: lat,
        longitude: lng,
        radius: rad,
        risk_level: formData.risk_level,
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        zone_type: 'RESTRICTED',
        latitude: '11.4100',
        longitude: '76.7000',
        radius: '500',
        risk_level: 'HIGH',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create safety zone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-800" />
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {t('zonesTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('zonesSubtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t('createZone')}</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">{t('zoneType')}:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">{t('all')}</option>
            <option value="SAFE">{t('zoneSafe')}</option>
            <option value="RESTRICTED">{t('zoneRestricted')}</option>
            <option value="DANGER">{t('zoneDanger')}</option>
          </select>
        </div>
      </div>

      {/* Zones Grid */}
      {isLoading ? (
        <LoadingSpinner label="Fetching safety zones..." />
      ) : filteredZones.length === 0 ? (
        <EmptyState message={t('noZonesFound')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredZones.map((zone) => {
            const isActive = zone.status === 'ACTIVE';

            return (
              <div
                key={zone.zone_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                        Zone #{zone.zone_id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {zone.name}
                      </h3>
                    </div>
                    <StatusBadge type="zone_type" value={zone.zone_type} size="sm" />
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {zone.description || 'No description provided.'}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500">
                    <div>
                      <span className="text-slate-400 block">Radius:</span>
                      <span className="font-semibold text-slate-800">{zone.radius} m</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Risk Level:</span>
                      <span className="font-semibold text-slate-800">{zone.risk_level}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">GPS Center:</span>
                      <span className="font-semibold text-slate-800">
                        {zone.latitude.toFixed(4)}°N, {zone.longitude.toFixed(4)}°E
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                    {isActive ? 'Active' : 'Inactive'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {onSelectOnMap && (
                      <button
                        onClick={() => onSelectOnMap(zone)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title={t('viewOnMap')}
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleZoneStatus(zone.zone_id, isActive ? 'INACTIVE' : 'ACTIVE')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                        isActive
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {isActive ? t('deactivateZone') : t('activateZone')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Safety Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-base text-slate-900">
                  {t('createZone')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('zoneName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pykara Falls Danger Ridge"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('description')}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Safety perimeter restrictions, wildlife activity, slope hazards..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('zoneType')}
                  </label>
                  <select
                    value={formData.zone_type}
                    onChange={(e) => setFormData({ ...formData, zone_type: e.target.value as ZoneType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="SAFE">{t('zoneSafe')}</option>
                    <option value="RESTRICTED">{t('zoneRestricted')}</option>
                    <option value="DANGER">{t('zoneDanger')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('riskLevel')}
                  </label>
                  <select
                    value={formData.risk_level}
                    onChange={(e) => setFormData({ ...formData, risk_level: e.target.value as RiskLevel })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="LOW">{t('riskLow')}</option>
                    <option value="HIGH">{t('riskHigh')}</option>
                    <option value="CRITICAL">{t('riskCritical')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('latitude')} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('longitude')} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('radius')} *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    required
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-white bg-emerald-800 hover:bg-emerald-900 font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
