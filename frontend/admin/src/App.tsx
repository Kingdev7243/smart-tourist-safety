import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { Navbar } from './components/common/Navbar';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { IncidentsView } from './components/incidents/IncidentsView';
import { AlertsView } from './components/alerts/AlertsView';
import { ZonesView } from './components/zones/ZonesView';
import { TouristsView } from './components/tourists/TouristsView';
import { SafetyMap } from './components/map/SafetyMap';
import { ErrorBanner } from './components/common/ErrorBanner';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { User, Trip, Zone, Incident, Alert, IncidentStatus, AlertStatus, ZoneType, RiskLevel } from './types';
import { getUsers, createUser } from './api/users';
import { getTrips } from './api/trips';
import { getZones, createZone, updateZone } from './api/zones';
import { getIncidents, updateIncident, createIncident } from './api/incidents';
import { getAlerts, updateAlert } from './api/alerts';

const AdminApp: React.FC = () => {
  const { isAuthenticated, admin } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Real backend data state
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected item on map
  const [selectedIncidentForMap, setSelectedIncidentForMap] = useState<Incident | null>(null);
  const [selectedZoneForMap, setSelectedZoneForMap] = useState<Zone | null>(null);

  // Fetch all backend data
  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const [usersData, tripsData, zonesData, incidentsData, alertsData] = await Promise.all([
        getUsers(),
        getTrips(),
        getZones(),
        getIncidents(),
        getAlerts(),
      ]);

      setUsers(usersData);
      setTrips(tripsData);
      setZones(zonesData);
      setIncidents(incidentsData);
      setAlerts(alertsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setErrorMessage(err.message || t('errorLoadingData'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  // Handlers for real API updates
  const handleUpdateIncidentStatus = async (incidentId: number, nextStatus: IncidentStatus) => {
    try {
      await updateIncident(incidentId, {
        status: nextStatus,
        resolved_at: nextStatus === 'RESOLVED' ? new Date().toISOString() : null,
        resolved_by: nextStatus === 'RESOLVED' && admin ? admin.admin_id : null,
      });
      await loadAllData(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update incident.');
    }
  };

  const handleUpdateAlertStatus = async (alertId: number, nextStatus: AlertStatus) => {
    try {
      await updateAlert(alertId, {
        status: nextStatus,
        acknowledged_at: nextStatus === 'ACKNOWLEDGED' ? new Date().toISOString() : undefined,
        acknowledged_by: nextStatus === 'ACKNOWLEDGED' && admin ? admin.admin_id : undefined,
        closed_at: nextStatus === 'CLOSED' ? new Date().toISOString() : undefined,
      });
      await loadAllData(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update alert.');
    }
  };

  const handleCreateZone = async (data: {
    name: string;
    description: string;
    zone_type: ZoneType;
    latitude: number;
    longitude: number;
    radius: number;
    risk_level: RiskLevel;
  }) => {
    await createZone(data);
    await loadAllData(true);
  };

  const handleToggleZoneStatus = async (zoneId: number, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      await updateZone(zoneId, { status: nextStatus });
      await loadAllData(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle zone status.');
    }
  };

  const handleCreateUser = async (data: { name: string; email: string; phone: string }) => {
    await createUser(data);
    await loadAllData(true);
  };

  const handleNavigateToMapWithIncident = (incident: Incident) => {
    setSelectedIncidentForMap(incident);
    setSelectedZoneForMap(null);
    setActiveTab('map');
  };

  const handleNavigateToMapWithZone = (zone: Zone) => {
    setSelectedZoneForMap(zone);
    setSelectedIncidentForMap(null);
    setActiveTab('map');
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const openIncidentsCount = incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
  const newAlertsCount = alerts.filter((a) => a.status === 'NEW').length;
  const activeTripsCount = trips.filter((t) => t.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onRefreshAll={() => loadAllData(true)}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          openIncidentsCount={openIncidentsCount}
          newAlertsCount={newAlertsCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Global Error Banner if any */}
            {errorMessage && (
              <ErrorBanner
                message={errorMessage}
                onRetry={() => loadAllData()}
                onDismiss={() => setErrorMessage(null)}
              />
            )}

            {isLoading ? (
              <LoadingSpinner label="Connecting to Tourist Safety Command Server..." size="lg" />
            ) : (
              <>
                {/* 1. Dashboard View */}
                {activeTab === 'dashboard' && (
                  <DashboardView
                    users={users}
                    trips={trips}
                    zones={zones}
                    incidents={incidents}
                    alerts={alerts}
                    onNavigate={(tab) => setActiveTab(tab)}
                    onAcknowledgeAlert={(id) => handleUpdateAlertStatus(id, 'ACKNOWLEDGED')}
                    onResolveIncident={(id) => handleUpdateIncidentStatus(id, 'RESOLVED')}
                  />
                )}

                {/* 2. Incidents Triage View */}
                {activeTab === 'incidents' && (
                  <IncidentsView
                    incidents={incidents}
                    isLoading={isLoading}
                    onUpdateStatus={handleUpdateIncidentStatus}
                    onSelectOnMap={handleNavigateToMapWithIncident}
                  />
                )}

                {/* 3. Emergency Alerts Stream */}
                {activeTab === 'alerts' && (
                  <AlertsView
                    alerts={alerts}
                    isLoading={isLoading}
                    onUpdateAlertStatus={handleUpdateAlertStatus}
                  />
                )}

                {/* 4. Safety Zones View */}
                {activeTab === 'zones' && (
                  <ZonesView
                    zones={zones}
                    isLoading={isLoading}
                    onCreateZone={handleCreateZone}
                    onToggleZoneStatus={handleToggleZoneStatus}
                    onSelectOnMap={handleNavigateToMapWithZone}
                  />
                )}

                {/* 5. Dedicated Tactical Map */}
                {activeTab === 'map' && (
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 font-display">
                          {t('mapTitle')}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          {t('mapSubtitle')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {zones.length} Zones
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                          {incidents.length} Incidents
                        </span>
                      </div>
                    </div>

                    <SafetyMap
                      zones={zones}
                      incidents={incidents}
                      selectedIncidentId={selectedIncidentForMap?.incident_id}
                      selectedZoneId={selectedZoneForMap?.zone_id}
                      height="650px"
                    />
                  </div>
                )}

                {/* 6. Registered Tourists */}
                {activeTab === 'tourists' && (
                  <TouristsView
                    users={users}
                    trips={trips}
                    incidents={incidents}
                    isLoading={isLoading}
                    onCreateUser={handleCreateUser}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <AdminApp />
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
