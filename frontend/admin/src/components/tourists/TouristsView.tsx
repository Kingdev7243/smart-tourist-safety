import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  X,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { User, Trip, Incident } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TouristsViewProps {
  users: User[];
  trips: Trip[];
  incidents: Incident[];
  isLoading: boolean;
  onCreateUser: (data: { name: string; email: string; phone: string }) => Promise<void>;
}

export const TouristsView: React.FC<TouristsViewProps> = ({
  users,
  trips,
  incidents,
  isLoading,
  onCreateUser,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.user_id.toString().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.name || !formData.email || !formData.phone) {
      setErrorMsg('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateUser(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register tourist.');
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
            <Users className="w-6 h-6 text-emerald-800" />
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {t('touristsTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('touristsSubtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Register Tourist</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Tourists Grid / Table */}
      {isLoading ? (
        <LoadingSpinner label="Loading tourists..." />
      ) : filteredUsers.length === 0 ? (
        <EmptyState message={t('noTouristsFound')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const userTrips = trips.filter((t) => t.user_id === user.user_id);
            const activeTrip = userTrips.find((t) => t.status === 'ACTIVE');

            return (
              <div
                key={user.user_id}
                onClick={() => setSelectedUser(user)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[11px] font-mono text-slate-400 font-bold">
                          ID #{user.user_id}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">{user.name}</h3>
                      </div>
                    </div>
                    <StatusBadge type="user_status" value={user.status} size="sm" />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{user.phone}</span>
                    </div>
                  </div>

                  {activeTrip && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 mb-0.5">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Active Journey</span>
                      </div>
                      <div className="font-semibold text-emerald-950">
                        {activeTrip.destination}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Registered: {new Date(user.created_at).toLocaleDateString()}</span>
                  <span className="text-emerald-800 font-semibold">{userTrips.length} Trips</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Details Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedUser.name}</h3>
                  <div className="text-xs text-slate-400 font-mono">User ID #{selectedUser.user_id}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">{t('email')}</span>
                  <span className="font-semibold text-slate-800">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">{t('phone')}</span>
                  <span className="font-semibold font-mono text-slate-800">{selectedUser.phone}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">{t('tripsTitle')}</h4>
                {trips.filter((t) => t.user_id === selectedUser.user_id).length === 0 ? (
                  <p className="text-slate-400 italic">No trips recorded for this tourist.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {trips
                      .filter((t) => t.user_id === selectedUser.user_id)
                      .map((trip) => (
                        <div
                          key={trip.trip_id}
                          className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{trip.destination}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {new Date(trip.start_time).toLocaleDateString()} - {new Date(trip.end_time).toLocaleDateString()}
                            </div>
                          </div>
                          <StatusBadge type="trip_status" value={trip.status} size="sm" />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold text-xs"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Tourist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Register Tourist</h3>
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
                <label className="block font-semibold text-slate-700 mb-1">{t('name')} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Arun Kumar"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('email')} *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="arun@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('phone')} *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                />
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
