import { useState, useRef, useEffect } from 'react';

export interface Region {
    name: string;
    emoji: string;
    bbox: { lamin: number; lomin: number; lamax: number; lomax: number };
    center: [number, number]; // [lat, lng]
    zoom: number;
}

export const REGIONS: Region[] = [
    // ── Continents / Global ──
    { name: 'United States', emoji: '🇺🇸', bbox: { lamin: 24, lomin: -125, lamax: 50, lomax: -66 }, center: [39, -98], zoom: 4 },
    { name: 'Europe', emoji: '🇪🇺', bbox: { lamin: 35, lomin: -11, lamax: 72, lomax: 40 }, center: [50, 15], zoom: 4 },
    { name: 'Asia', emoji: '🌏', bbox: { lamin: 5, lomin: 60, lamax: 55, lomax: 150 }, center: [35, 100], zoom: 3 },
    { name: 'Middle East', emoji: '🕌', bbox: { lamin: 12, lomin: 25, lamax: 42, lomax: 65 }, center: [28, 45], zoom: 4 },
    { name: 'Africa', emoji: '🌍', bbox: { lamin: -35, lomin: -20, lamax: 37, lomax: 52 }, center: [5, 20], zoom: 3 },
    { name: 'South America', emoji: '🌎', bbox: { lamin: -55, lomin: -82, lamax: 13, lomax: -34 }, center: [-15, -60], zoom: 3 },
    { name: 'Oceania', emoji: '🌊', bbox: { lamin: -47, lomin: 110, lamax: -10, lomax: 180 }, center: [-25, 140], zoom: 4 },

    // ── Countries ──
    { name: 'India', emoji: '🇮🇳', bbox: { lamin: 6, lomin: 68, lamax: 36, lomax: 98 }, center: [22, 82], zoom: 5 },
    { name: 'United Kingdom', emoji: '🇬🇧', bbox: { lamin: 49, lomin: -8, lamax: 61, lomax: 2 }, center: [54, -2], zoom: 6 },
    { name: 'Germany', emoji: '🇩🇪', bbox: { lamin: 47, lomin: 5, lamax: 55, lomax: 16 }, center: [51, 10], zoom: 6 },
    { name: 'France', emoji: '🇫🇷', bbox: { lamin: 41, lomin: -5, lamax: 51, lomax: 10 }, center: [46, 2], zoom: 6 },
    { name: 'Japan', emoji: '🇯🇵', bbox: { lamin: 24, lomin: 123, lamax: 46, lomax: 146 }, center: [36, 138], zoom: 5 },
    { name: 'China', emoji: '🇨🇳', bbox: { lamin: 18, lomin: 73, lamax: 54, lomax: 135 }, center: [35, 105], zoom: 4 },
    { name: 'Australia', emoji: '🇦🇺', bbox: { lamin: -44, lomin: 112, lamax: -10, lomax: 154 }, center: [-25, 134], zoom: 4 },
    { name: 'Canada', emoji: '🇨🇦', bbox: { lamin: 41, lomin: -141, lamax: 84, lomax: -52 }, center: [56, -96], zoom: 3 },
    { name: 'Brazil', emoji: '🇧🇷', bbox: { lamin: -34, lomin: -74, lamax: 6, lomax: -34 }, center: [-14, -51], zoom: 4 },
    { name: 'UAE', emoji: '🇦🇪', bbox: { lamin: 22, lomin: 51, lamax: 26.5, lomax: 56.5 }, center: [24, 54], zoom: 7 },
    { name: 'South Korea', emoji: '🇰🇷', bbox: { lamin: 33, lomin: 124, lamax: 39, lomax: 132 }, center: [36, 128], zoom: 7 },
    { name: 'Singapore', emoji: '🇸🇬', bbox: { lamin: 1, lomin: 103, lamax: 1.5, lomax: 104.1 }, center: [1.35, 103.8], zoom: 11 },
    { name: 'Turkey', emoji: '🇹🇷', bbox: { lamin: 36, lomin: 26, lamax: 42, lomax: 45 }, center: [39, 35], zoom: 6 },
    { name: 'Italy', emoji: '🇮🇹', bbox: { lamin: 36, lomin: 6, lamax: 47, lomax: 19 }, center: [42, 12], zoom: 6 },
    { name: 'Spain', emoji: '🇪🇸', bbox: { lamin: 36, lomin: -10, lamax: 44, lomax: 5 }, center: [40, -3], zoom: 6 },
    { name: 'Mexico', emoji: '🇲🇽', bbox: { lamin: 14, lomin: -118, lamax: 33, lomax: -86 }, center: [23, -102], zoom: 5 },
    { name: 'Russia', emoji: '🇷🇺', bbox: { lamin: 41, lomin: 19, lamax: 82, lomax: -169 }, center: [61, 100], zoom: 3 },
    { name: 'Thailand', emoji: '🇹🇭', bbox: { lamin: 5, lomin: 97, lamax: 21, lomax: 106 }, center: [15, 101], zoom: 6 },
    { name: 'Indonesia', emoji: '🇮🇩', bbox: { lamin: -11, lomin: 95, lamax: 6, lomax: 141 }, center: [-2, 118], zoom: 4 },

    // ── Major Cities / Hubs ──
    { name: 'New York', emoji: '🗽', bbox: { lamin: 40.4, lomin: -74.3, lamax: 41.0, lomax: -73.6 }, center: [40.7, -74], zoom: 10 },
    { name: 'Los Angeles', emoji: '🌴', bbox: { lamin: 33.5, lomin: -118.8, lamax: 34.4, lomax: -117.6 }, center: [34, -118.2], zoom: 10 },
    { name: 'London', emoji: '🏛️', bbox: { lamin: 51.2, lomin: -0.5, lamax: 51.7, lomax: 0.3 }, center: [51.5, -0.1], zoom: 10 },
    { name: 'Dubai', emoji: '🏙️', bbox: { lamin: 24.8, lomin: 54.9, lamax: 25.4, lomax: 55.6 }, center: [25.2, 55.3], zoom: 10 },
    { name: 'Tokyo', emoji: '🗼', bbox: { lamin: 35.4, lomin: 139.4, lamax: 35.9, lomax: 140.0 }, center: [35.7, 139.7], zoom: 10 },
    { name: 'Mumbai', emoji: '🏗️', bbox: { lamin: 18.8, lomin: 72.7, lamax: 19.3, lomax: 73.1 }, center: [19.1, 72.9], zoom: 11 },
    { name: 'Delhi', emoji: '🕌', bbox: { lamin: 28.3, lomin: 76.8, lamax: 28.9, lomax: 77.5 }, center: [28.6, 77.2], zoom: 10 },
    { name: 'Paris', emoji: '🗼', bbox: { lamin: 48.7, lomin: 2.1, lamax: 49.0, lomax: 2.6 }, center: [48.85, 2.35], zoom: 11 },
    { name: 'Frankfurt', emoji: '✈️', bbox: { lamin: 49.8, lomin: 8.3, lamax: 50.3, lomax: 9.0 }, center: [50.1, 8.7], zoom: 10 },
    { name: 'Chicago', emoji: '🌆', bbox: { lamin: 41.5, lomin: -88.0, lamax: 42.1, lomax: -87.3 }, center: [41.9, -87.6], zoom: 10 },
    { name: 'Atlanta', emoji: '🍑', bbox: { lamin: 33.5, lomin: -84.6, lamax: 33.9, lomax: -84.1 }, center: [33.7, -84.4], zoom: 10 },
    { name: 'Dallas', emoji: '🤠', bbox: { lamin: 32.5, lomin: -97.2, lamax: 33.1, lomax: -96.4 }, center: [32.8, -96.8], zoom: 10 },
    { name: 'Sydney', emoji: '🦘', bbox: { lamin: -34.1, lomin: 150.6, lamax: -33.6, lomax: 151.4 }, center: [-33.87, 151.2], zoom: 10 },
    { name: 'Istanbul', emoji: '🕌', bbox: { lamin: 40.8, lomin: 28.6, lamax: 41.3, lomax: 29.5 }, center: [41.0, 29.0], zoom: 10 },
    { name: 'Hong Kong', emoji: '🇭🇰', bbox: { lamin: 22.1, lomin: 113.8, lamax: 22.6, lomax: 114.4 }, center: [22.3, 114.2], zoom: 11 },
];

interface RegionSelectorProps {
    currentRegion: Region;
    onRegionChange: (region: Region) => void;
}

export default function RegionSelector({ currentRegion, onRegionChange }: RegionSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = REGIONS.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (region: Region) => {
        onRegionChange(region);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="region-selector" ref={dropdownRef}>
            <button
                className="region-trigger glass"
                onClick={() => {
                    setIsOpen(!isOpen);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
            >
                <span className="region-emoji">{currentRegion.emoji}</span>
                <span className="region-name">{currentRegion.name}</span>
                <span className="region-arrow">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="region-dropdown glass">
                    <div className="region-search-wrap">
                        <input
                            ref={inputRef}
                            type="text"
                            className="region-search"
                            placeholder="Search country or city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="region-list">
                        {filtered.map((region) => (
                            <button
                                key={region.name}
                                className={`region-option ${region.name === currentRegion.name ? 'active' : ''}`}
                                onClick={() => handleSelect(region)}
                            >
                                <span className="region-opt-emoji">{region.emoji}</span>
                                <span className="region-opt-name">{region.name}</span>
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div className="region-empty">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
