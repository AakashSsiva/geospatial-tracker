import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LiveMapProps {
    geojsonData: any;
    onMapReady?: () => void;
    onMapRef?: (map: L.Map) => void;
}

// Dark tile layers (free, no token required)
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_TILES_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

function getAircraftColor(altitude: number | null, onGround: boolean): string {
    if (onGround) return '#888888';
    if (altitude === null || altitude === undefined) return '#00ff88';
    if (altitude < 3000) return '#00ff88';
    if (altitude < 8000) return '#00d4ff';
    if (altitude < 12000) return '#ffaa00';
    return '#ff0044';
}

function getGlowSize(altitude: number | null): number {
    if (altitude === null || altitude === undefined) return 4;
    if (altitude < 3000) return 4;
    if (altitude < 8000) return 5;
    return 6;
}

export default function LiveMap({ geojsonData, onMapReady, onMapRef }: LiveMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const markersLayer = useRef<L.LayerGroup | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        // Initialize Leaflet map with dark tiles
        const m = L.map(mapContainer.current, {
            center: [39.8, -98.5], // Center of US
            zoom: 4,
            zoomControl: false,
            attributionControl: false,
        });

        L.tileLayer(DARK_TILES, {
            attribution: DARK_TILES_ATTRIBUTION,
            maxZoom: 18,
            subdomains: 'abcd',
        }).addTo(m);

        // Add zoom control to bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(m);

        // Create layer group for markers
        markersLayer.current = L.layerGroup().addTo(m);

        map.current = m;
        setIsLoaded(true);
        onMapReady?.();
        onMapRef?.(m);

        return () => {
            m.remove();
            map.current = null;
        };
    }, []);

    // Update markers when GeoJSON data changes
    useEffect(() => {
        if (!map.current || !markersLayer.current || !isLoaded) return;
        if (!geojsonData?.features?.length) return;

        const layer = markersLayer.current;
        layer.clearLayers();

        const features = geojsonData.features;

        for (const feature of features) {
            const props = feature.properties || {};
            const coords = feature.geometry?.coordinates;
            if (!coords || coords[0] == null || coords[1] == null) continue;

            const lat = coords[1];
            const lng = coords[0];

            if (props.category === 'aircraft') {
                const color = getAircraftColor(props.altitude, props.on_ground);
                const radius = getGlowSize(props.altitude);

                // Glow circle (behind)
                if (!props.on_ground) {
                    L.circleMarker([lat, lng], {
                        radius: radius + 6,
                        fillColor: color,
                        fillOpacity: 0.12,
                        stroke: false,
                    }).addTo(layer);
                }

                // Main circle
                const marker = L.circleMarker([lat, lng], {
                    radius: radius,
                    fillColor: color,
                    fillOpacity: 0.9,
                    color: 'rgba(255,255,255,0.6)',
                    weight: 1,
                });

                marker.bindPopup(`
          <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#e0e6f0;min-width:180px">
            <div style="font-weight:600;color:#00ff88;margin-bottom:6px;font-size:13px">✈ ${props.callsign || 'Unknown'}</div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;color:rgba(224,230,240,0.5)">
              <span>Country</span><span style="color:#e0e6f0;font-weight:500">${props.origin_country || '—'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;color:rgba(224,230,240,0.5)">
              <span>Altitude</span><span style="color:#e0e6f0;font-weight:500">${props.altitude ? Math.round(props.altitude) + 'm' : '—'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;color:rgba(224,230,240,0.5)">
              <span>Speed</span><span style="color:#e0e6f0;font-weight:500">${props.velocity ? Math.round(props.velocity) + ' m/s' : '—'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;color:rgba(224,230,240,0.5)">
              <span>Heading</span><span style="color:#e0e6f0;font-weight:500">${props.heading ? Math.round(props.heading) + '°' : '—'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;color:rgba(224,230,240,0.5)">
              <span>Source</span><span style="color:#e0e6f0;font-weight:500">OpenSky</span>
            </div>
          </div>
        `, {
                    className: 'dark-popup',
                    closeButton: false,
                });

                marker.addTo(layer);

            } else if (props.category === 'vehicles' || props.category === 'vehicle') {
                const marker = L.circleMarker([lat, lng], {
                    radius: 5,
                    fillColor: '#00d4ff',
                    fillOpacity: 0.85,
                    color: 'rgba(0,212,255,0.5)',
                    weight: 1,
                });

                marker.bindPopup(`
          <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#e0e6f0">
            <div style="font-weight:600;color:#00d4ff;margin-bottom:4px">🚗 ${props.category}</div>
            <div>Confidence: ${props.confidence ? (props.confidence * 100).toFixed(0) + '%' : '—'}</div>
            <div>Source: ${props.source || '—'}</div>
          </div>
        `, {
                    className: 'dark-popup',
                    closeButton: false,
                });

                marker.addTo(layer);

            } else if (props.category === 'pedestrian') {
                L.circleMarker([lat, lng], {
                    radius: 4,
                    fillColor: '#ffaa00',
                    fillOpacity: 0.7,
                    stroke: false,
                }).addTo(layer);
            }
        }
    }, [geojsonData, isLoaded]);

    return (
        <>
            <div ref={mapContainer} className="map-container" />
            {!isLoaded && (
                <div className="loading-overlay">
                    <div className="loading-spinner" />
                    <div className="loading-text">INITIALIZING MAP...</div>
                </div>
            )}
        </>
    );
}
