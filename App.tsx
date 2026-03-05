import { useMemo, useState, useCallback } from 'react';
import LiveMap from './components/LiveMap';
import RegionSelector, { REGIONS, Region } from './components/RegionSelector';
import { useWebSocket } from './hooks/useWebSocket';

const WS_URL = `ws://${window.location.hostname}:8000/ws/live`;
const API_BASE = `http://${window.location.hostname}:8000`;

const CAMERAS = [
    'I-405 LAX',
    'I-5 Downtown',
    'I-10 Santa Monica',
    'US-101 Hollywood',
    'I-110 Harbor',
    'I-210 Pasadena',
];

export default function App() {
    const { data, isConnected, lastUpdate } = useWebSocket(WS_URL);
    const [activeRegion, setActiveRegion] = useState<Region>(REGIONS[0]); // Defaults to US
    const [isLoading, setIsLoading] = useState(false);
    const [mapRef, setMapRef] = useState<L.Map | null>(null);

    const handleRegionChange = useCallback(async (region: Region) => {
        setActiveRegion(region);
        setIsLoading(true);

        // Pan + zoom the map
        if (mapRef) {
            mapRef.flyTo(region.center, region.zoom, { duration: 1.5 });
        }

        // Tell the backend to change the bounding box
        try {
            await fetch(`${API_BASE}/api/region`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...region.bbox, name: region.name }),
            });
        } catch (err) {
            console.error('[Region] API error:', err);
        }

        // Brief loading state
        setTimeout(() => setIsLoading(false), 2000);
    }, [mapRef]);

    const stats = useMemo(() => {
        const features = data.features || [];
        const aircraft = features.filter((f: any) => f.properties?.category === 'aircraft');
        const airborne = aircraft.filter((f: any) => !f.properties?.on_ground);
        const vehicles = features.filter((f: any) =>
            f.properties?.category === 'vehicles' || f.properties?.category === 'vehicle'
        );
        const countries = new Set(
            aircraft.map((f: any) => f.properties?.origin_country).filter(Boolean)
        );

        return {
            total: aircraft.length,
            airborne: airborne.length,
            ground: aircraft.length - airborne.length,
            vehicles: vehicles.length,
            countries: countries.size,
            features: features.length,
        };
    }, [data]);

    const time = lastUpdate
        ? lastUpdate.toLocaleTimeString('en-US', { hour12: false })
        : '——:——:——';

    return (
        <div className="app-container">
            <div className="scan-line" />

            {/* Full-screen map */}
            <LiveMap geojsonData={data} onMapRef={setMapRef} />

            {/* Region loading indicator */}
            {isLoading && (
                <div className="region-loading">
                    <div className="region-loading-bar" />
                </div>
            )}

            {/* HUD Overlay */}
            <div className="hud-overlay">

                {/* ─── Top Bar ─── */}
                <div className="top-bar">
                    <div className="top-bar-left">
                        <div className="glass brand">
                            <div className="brand-icon">🌍</div>
                            <div className="brand-text">
                                <h1>World Monitor</h1>
                                <div className="tagline">Real-Time Geospatial Tracking</div>
                            </div>
                        </div>

                        {/* Region Selector */}
                        <RegionSelector
                            currentRegion={activeRegion}
                            onRegionChange={handleRegionChange}
                        />
                    </div>

                    <div className="glass live-badge">
                        <div className={`live-dot ${isConnected ? 'on' : 'off'}`} />
                        <span className={`live-label ${isConnected ? 'on' : 'off'}`}>
                            {isConnected ? 'LIVE' : 'OFFLINE'}
                        </span>
                        <span className="live-time">{time}</span>
                    </div>
                </div>

                {/* ─── Left Stats ─── */}
                <div className="stats-left">
                    <div className="glass stat-card">
                        <div className="stat-label">✈ Aircraft Tracked</div>
                        <div className="stat-value green">{stats.total.toLocaleString()}</div>
                        <div className="stat-sub">{stats.airborne.toLocaleString()} airborne · {stats.ground.toLocaleString()} ground</div>
                    </div>

                    <div className="glass stat-card">
                        <div className="stat-label">🌐 Countries</div>
                        <div className="stat-value cyan">{stats.countries}</div>
                    </div>

                    <div className="glass stat-card">
                        <div className="stat-label">🚗 Vehicle Detections</div>
                        <div className="stat-value orange">{stats.vehicles}</div>
                        <div className="stat-sub">via Gemini Vision</div>
                    </div>
                </div>

                {/* ─── Right Info ─── */}
                <div className="glass info-right">
                    <div className="info-title">System Info</div>
                    <div className="info-row">
                        <span className="info-key">Source</span>
                        <span className="info-val" style={{ color: 'var(--color-primary)' }}>OpenSky</span>
                    </div>
                    <div className="info-row">
                        <span className="info-key">Vision</span>
                        <span className="info-val" style={{ color: 'var(--color-secondary)' }}>Gemini</span>
                    </div>
                    <div className="info-row">
                        <span className="info-key">Refresh</span>
                        <span className="info-val">10s</span>
                    </div>
                    <div className="info-row">
                        <span className="info-key">Region</span>
                        <span className="info-val">{activeRegion.emoji} {activeRegion.name}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-key">Features</span>
                        <span className="info-val">{stats.features.toLocaleString()}</span>
                    </div>
                </div>

                {/* ─── Legend ─── */}
                <div className="glass legend">
                    <div className="legend-title">Altitude</div>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#00ff88' }} />
                        <span className="legend-label">&lt; 3,000m</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#00d4ff' }} />
                        <span className="legend-label">3–8,000m</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#ffaa00' }} />
                        <span className="legend-label">8–12,000m</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#ff0044' }} />
                        <span className="legend-label">&gt; 12,000m</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#888888' }} />
                        <span className="legend-label">On Ground</span>
                    </div>
                </div>

                {/* ─── Bottom Camera Bar ─── */}
                <div className="glass camera-bar">
                    <span className="camera-bar-label">📹 Cameras</span>
                    <div className="camera-chips">
                        {CAMERAS.map((cam) => (
                            <div key={cam} className="cam-chip">
                                <div className="cam-chip-dot" />
                                {cam}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
