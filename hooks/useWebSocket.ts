import { useEffect, useRef, useState, useCallback } from 'react';

export interface GeoJSONData {
    type: string;
    features: any[];
    metadata?: {
        aircraft_count: number;
        camera_detection_count: number;
        cameras_active: number;
    };
}

interface UseWebSocketReturn {
    data: GeoJSONData;
    isConnected: boolean;
    lastUpdate: Date | null;
    reconnect: () => void;
}

const EMPTY_GEOJSON: GeoJSONData = {
    type: 'FeatureCollection',
    features: [],
    metadata: { aircraft_count: 0, camera_detection_count: 0, cameras_active: 0 },
};

export function useWebSocket(url: string): UseWebSocketReturn {
    const [data, setData] = useState<GeoJSONData>(EMPTY_GEOJSON);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const reconnectAttempts = useRef(0);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('[WS] Connected');
                setIsConnected(true);
                reconnectAttempts.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const geojson = JSON.parse(event.data);
                    setData(geojson);
                    setLastUpdate(new Date());
                } catch (e) {
                    console.error('[WS] Parse error:', e);
                }
            };

            ws.onclose = () => {
                console.log('[WS] Disconnected');
                setIsConnected(false);

                // Exponential backoff reconnect
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                reconnectAttempts.current++;
                console.log(`[WS] Reconnecting in ${delay}ms...`);
                reconnectTimeoutRef.current = setTimeout(connect, delay);
            };

            ws.onerror = (err) => {
                console.error('[WS] Error:', err);
            };

            wsRef.current = ws;
        } catch (e) {
            console.error('[WS] Connection failed:', e);
        }
    }, [url]);

    const reconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        reconnectAttempts.current = 0;
        connect();
    }, [connect]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                // Prevent onclose from firing and triggering a reconnect on unmount
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { data, isConnected, lastUpdate, reconnect };
}
