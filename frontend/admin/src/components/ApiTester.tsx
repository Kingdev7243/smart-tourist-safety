import React, { useState } from 'react';
import { Play, CheckCircle2, AlertCircle, Copy, Terminal } from 'lucide-react';

export const ApiTester: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /');
  const [method, setMethod] = useState<string>('GET');
  const [url, setUrl] = useState<string>('/');
  const [requestBody, setRequestBody] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [responseHeaders, setResponseHeaders] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const endpointPresets = [
    { name: 'Root Status', method: 'GET', url: '/', body: '' },
    { name: 'Database Health Check', method: 'GET', url: '/health/database', body: '' },
    {
      name: 'Admin Login (SUPER_ADMIN)',
      method: 'POST',
      url: '/api/auth/login',
      body: JSON.stringify({ email: 'admin@safety.com', password: 'admin123' }, null, 2),
    },
    {
      name: 'Admin Login (OPERATOR)',
      method: 'POST',
      url: '/api/auth/login',
      body: JSON.stringify({ email: 'ravi@safety.com', password: 'operator123' }, null, 2),
    },
    { name: 'List All Users (Tourists)', method: 'GET', url: '/api/users', body: '' },
    {
      name: 'Create New User',
      method: 'POST',
      url: '/api/users',
      body: JSON.stringify({ name: 'Sneha Patel', email: 'sneha@gmail.com', phone: '9876543219' }, null, 2),
    },
    { name: 'List All Trips', method: 'GET', url: '/api/trips', body: '' },
    {
      name: 'Create New Trip',
      method: 'POST',
      url: '/api/trips',
      body: JSON.stringify({
        user_id: 1,
        destination: 'Manali',
        start_time: '2026-08-25T09:00:00Z',
        end_time: '2026-08-28T18:00:00Z',
      }, null, 2),
    },
    { name: 'List All Safety Zones', method: 'GET', url: '/api/zones', body: '' },
    { name: 'List All Incidents', method: 'GET', url: '/api/incidents', body: '' },
    {
      name: 'Trigger SOS Incident',
      method: 'POST',
      url: '/api/incidents',
      body: JSON.stringify({
        trip_id: 4,
        zone_id: 1,
        incident_type: 'SOS',
        description: 'Tourist triggered SOS button via REST API',
        latitude: 11.4062,
        longitude: 76.6938,
        severity: 'CRITICAL',
      }, null, 2),
    },
    { name: 'List All Alerts', method: 'GET', url: '/api/alerts', body: '' },
    {
      name: 'Geofence Check (Breach Test)',
      method: 'POST',
      url: '/api/geofence/check',
      body: JSON.stringify({
        trip_id: 4,
        latitude: 11.4205,
        longitude: 76.7002,
      }, null, 2),
    },
  ];

  const handleSelectPreset = (preset: typeof endpointPresets[0]) => {
    setSelectedEndpoint(`${preset.method} ${preset.url}`);
    setMethod(preset.method);
    setUrl(preset.url);
    setRequestBody(preset.body);
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    try {
      const headers: Record<string, string> = {};
      if (method !== 'GET' && requestBody) {
        headers['Content-Type'] = 'application/json';
      }
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const options: RequestInit = {
        method,
        headers,
      };
      if (method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      setResponseStatus(res.status);

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        setResponseData(json);
        // If login response contains access_token, auto-fill it
        if (json.access_token) {
          setAuthToken(json.access_token);
        }
      } else {
        const text = await res.text();
        setResponseData(text);
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (responseData) {
      navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">API Endpoint & Swagger Simulator</h2>
              <p className="text-xs text-slate-400">
                Execute and verify live REST endpoints migrated from the FastAPI backend.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              ● API Online (Port 3000)
            </span>
          </div>
        </div>

        {/* Quick Presets Carousel */}
        <div className="mt-5 border-t border-slate-800 pt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quick Route Presets
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {endpointPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  selectedEndpoint === `${preset.method} ${preset.url}`
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75 mr-1">{preset.method}</span>
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Execution Form & Response Viewer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Request Configurator */}
        <div className="space-y-4 lg:col-span-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-4">
            <div className="flex gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-sky-400 focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
              />
              <button
                onClick={handleExecute}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {/* Optional Bearer Token */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400">
                Bearer Token (Optional - auto-filled on login):
              </label>
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Paste access_token..."
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
              />
            </div>

            {/* Request Body (if POST/PATCH) */}
            {method !== 'GET' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-400">JSON Request Body:</label>
                <textarea
                  rows={8}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-emerald-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Response Viewer */}
        <div className="space-y-4 lg:col-span-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 min-h-[350px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Response
                </span>
                {responseStatus !== null && (
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
              </div>

              {responseData && (
                <button
                  onClick={copyResponse}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              )}
            </div>

            <div className="mt-3 flex-1 overflow-auto rounded-lg bg-slate-950 p-3.5 font-mono text-xs">
              {responseData ? (
                <pre className="text-emerald-400 whitespace-pre-wrap">
                  {typeof responseData === 'object'
                    ? JSON.stringify(responseData, null, 2)
                    : responseData}
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-600">
                  Select a preset and click "Send" to inspect the JSON output.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
