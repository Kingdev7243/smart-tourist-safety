import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  Calendar, 
  User as UserIcon, 
  MapPin, 
  Clock, 
  Plus, 
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Trip, TripStatus, User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TripsViewProps {
  trips: Trip[];
  users: User[];
  isLoading: boolean;
  onUpdateTripStatus: (tripId: number, status: TripStatus) => Promise<void>;
  onCreateTrip: (data: {
    user_id: number;
    destination: string;
    start_time: string;
    end_time: string;
  }) => Promise<void>;
}

export const TripsView: React.FC<TripsViewProps> = ({
  trips,
  users,
  isLoading,
  onUpdateTripStatus,
  onCreateTrip,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    user_id: users[0]?.user_id || 1,
    destination: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
  });

  const getUserName = (userId: number) => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.name : `User #${userId}`;
  };

  const filteredTrips = trips.filter((trip) => {
    const userName = getUserName(trip.user_id).toLowerCase();
    const dest = trip.destination.toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      dest.includes(q) ||
      userName.includes(q) ||
      trip.trip_id.toString().includes(q);

    const matchesStatus = statusFilter === 'ALL' || trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.destination.trim()) {
      setErrorMsg('Destination is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateTrip({
        user_id: Number(formData.user_id),
        destination: formData.destination.trim(),
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      });
      setIsModalOpen(false);
      setFormData({
        user_id: users[0]?.user_id || 1,
        destination: '',
        start_time: new Date().toISOString().slice(0, 16),
        end_time: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule trip.');
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
            <Compass className="w-6 h-6 text-teal-700" />
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {t('tripsTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('tripsSubtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Plan Trip</span>
        </button>
      </div>

      {/* Filter Bar */}
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
          <span className="text-xs text-slate-400 font-semibold uppercase">{t('tripStatus')}:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">{t('all')}</option>
            <option value="ACTIVE">{t('tripActive')}</option>
            <option value="PLANNED">{t('tripPlanned')}</option>
            <option value="COMPLETED">{t('tripCompleted')}</option>
            <option value="CANCELLED">{t('tripCancelled')}</option>
          </select>
        </div>
      </div>

      {/* Trips Grid */}
      {isLoading ? (
        <LoadingSpinner label="Loading trips..." />
      ) : filteredTrips.length === 0 ? (
        <EmptyState message={t('noTripsFound')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map((trip) => {
            const userName = getUserName(trip.user_id);

            return (
              <div
                key={trip.trip_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        Trip #{trip.trip_id}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {trip.destination}
                      </h3>
                    </div>
                    <StatusBadge type="trip_status" value={trip.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{userName}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px] font-mono text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Start:</span>
                      <span className="text-slate-700">{new Date(trip.start_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">End:</span>
                      <span className="text-slate-700">{new Date(trip.end_time).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">User ID #{trip.user_id}</span>
                  <div className="flex items-center gap-1.5">
                    {trip.status !== 'COMPLETED' && (
                      <button
                        onClick={() => onUpdateTripStatus(trip.trip_id, 'COMPLETED')}
                        className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Plan Tourist Journey</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tourist User *</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                >
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('destination')} *</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Ooty Botanical Gardens & Doddabetta"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('startTime')} *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('endTime')} *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
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
                  className="px-4 py-2 rounded-xl text-white bg-teal-800 hover:bg-teal-900 font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Save Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
