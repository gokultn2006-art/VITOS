import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import {
  Crosshair,
  ArrowRightLeft,
  Footprints,
  Car,
  Search,
  X,
  Compass,
  AlertTriangle,
  RotateCcw,
  Navigation,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { directoryService, navigationService } from '../services/api';
import type { DirectoryEntry, NavigationPoint, NavigationState, NavigationRouteResult } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

// VIT Vellore Campus Reference Center Coordinates
const VIT_VELLORE_CENTER: [number, number] = [12.9692, 79.1560];

// Maximum visible geographic working area (~campus extent)
const VIT_WORKING_BOUNDS: L.LatLngBoundsLiteral = [
  [12.956, 79.140], // South-West coordinate
  [12.982, 79.172], // North-East coordinate
];

const INITIAL_ZOOM = 16;
const MIN_ZOOM = 15;
const MAX_ZOOM = 20;

export const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Live Location State & Refs
  const watchIdRef = useRef<number | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Markers and Polylines
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowPolylineRef = useRef<L.Polyline | null>(null);

  // Navigation State
  const [allLocations, setAllLocations] = useState<DirectoryEntry[]>([]);
  const [navState, setNavState] = useState<NavigationState>({
    origin: null,
    destination: null,
    mode: 'walking',
  });

  // Pin placement mode: 'origin' (Starting Location) | 'destination' (Target Location) | null
  const [pinDropMode, setPinDropMode] = useState<'origin' | 'destination' | null>(null);
  const [currentRoute, setCurrentRoute] = useState<NavigationRouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [isStepsExpanded, setIsStepsExpanded] = useState<boolean>(false);

  // Search dropdown states
  const [originSearchQuery, setOriginSearchQuery] = useState('');
  const [isOriginSearchOpen, setIsOriginSearchOpen] = useState(false);
  const [destSearchQuery, setDestSearchQuery] = useState('');
  const [isDestSearchOpen, setIsDestSearchOpen] = useState(false);

  // Helper to test if coordinates are within VITOS working bounds
  const isWithinBounds = (lat: number, lng: number): boolean => {
    return lat >= 12.956 && lat <= 12.982 && lng >= 79.140 && lng <= 79.172;
  };

  // 1. Fetch physical directory locations for predefined search
  useEffect(() => {
    let isMounted = true;
    directoryService.getEntries().then((entries) => {
      if (isMounted) {
        const physical = entries.filter((e) => e.latitude != null && e.longitude != null);
        setAllLocations(physical);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Route calculation & Leaflet Polyline rendering
  const calculateAndRenderRoute = useCallback(async (
    origin: NavigationPoint | null,
    dest: NavigationPoint | null,
    mode: 'walking' | 'driving'
  ) => {
    if (!origin || !dest) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      if (routeGlowPolylineRef.current) {
        routeGlowPolylineRef.current.remove();
        routeGlowPolylineRef.current = null;
      }
      setCurrentRoute(null);
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    setIsCalculatingRoute(true);
    setLocationError(null);

    try {
      const res = await navigationService.calculateRoute({
        source: origin.name,
        destination: dest.name,
        fromLat: origin.latitude,
        fromLng: origin.longitude,
        toLat: dest.latitude,
        toLng: dest.longitude,
        mode,
      });

      if (!res || !res.coordinates || res.coordinates.length < 2) {
        setLocationError('Could not find a valid path between these points.');
        setIsCalculatingRoute(false);
        return;
      }

      setCurrentRoute(res);

      // Clean up previous polyline layers
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      if (routeGlowPolylineRef.current) {
        routeGlowPolylineRef.current.remove();
        routeGlowPolylineRef.current = null;
      }

      // 1. Glowing outer casing polyline
      const glow = L.polyline(res.coordinates, {
        color: '#FAA307',
        weight: 9,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // 2. Main active route line
      const mainLine = L.polyline(res.coordinates, {
        color: '#DC2F02',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: mode === 'walking' ? undefined : '8, 8',
      }).addTo(map);

      mainLine.bindPopup(
        `<div style="font-size: 12px; font-weight: bold; color: #9D0208; text-align: center; padding: 4px;">
          🛣️ <strong>${mode === 'driving' ? 'Driving' : 'Walking'} Route</strong>
          <div style="font-size: 13px; font-weight: 800; color: #03071E; margin: 4px 0;">${res.distanceMeters} meters</div>
          <div style="font-size: 11px; color: #64748B;">Est. ${res.estimatedMinutes} min (${res.engine === 'osrm-osm' ? 'OpenStreetMap Footways' : 'Campus Network'})</div>
        </div>`
      );

      routeGlowPolylineRef.current = glow;
      routePolylineRef.current = mainLine;

      // Fit map viewport smoothly to the entire route
      map.fitBounds(mainLine.getBounds(), {
        padding: [60, 60],
        maxZoom: 18,
        animate: true,
      });
    } catch {
      setLocationError('Failed to calculate route. Please check network connection and try again.');
    } finally {
      setIsCalculatingRoute(false);
    }
  }, []);

  // 3. Sync Markers when origin / destination change
  const syncOriginMarker = useCallback((pt: NavigationPoint | null) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    if (!pt) return;

    const html = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));">
        <div style="background: #059669; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; white-space: nowrap; border: 2px solid white; display: flex; align-items: center; gap: 4px;">
          <span>📍</span>
          <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis;">${pt.name}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #059669;"></div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'starting-location-marker',
      html,
      iconSize: [160, 38],
      iconAnchor: [80, 38],
    });

    const marker = L.marker([pt.latitude, pt.longitude], { icon, draggable: true })
      .bindPopup(
        `<div style="font-size: 12px; font-weight: bold; color: #059669; text-align: center;">
          📍 Starting Location
          <div style="font-size: 13px; font-weight: 800; color: #1E293B; margin-top: 2px;">${pt.name}</div>
          <div style="font-size: 10px; color: #64748B; margin-top: 3px;">(Drag to move)</div>
        </div>`
      )
      .addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const updated: NavigationPoint = {
        type: 'pin',
        name: `Starting Location (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`,
        latitude: pos.lat,
        longitude: pos.lng,
      };
      setNavState((prev) => ({ ...prev, origin: updated }));
    });

    originMarkerRef.current = marker;
  }, []);

  const syncDestinationMarker = useCallback((pt: NavigationPoint | null) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (!pt) return;

    const html = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));">
        <div style="background: #9D0208; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; white-space: nowrap; border: 2px solid white; display: flex; align-items: center; gap: 4px;">
          <span>🎯</span>
          <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis;">${pt.name}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #9D0208;"></div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'target-location-marker',
      html,
      iconSize: [160, 38],
      iconAnchor: [80, 38],
    });

    const marker = L.marker([pt.latitude, pt.longitude], { icon, draggable: true })
      .bindPopup(
        `<div style="font-size: 12px; font-weight: bold; color: #9D0208; text-align: center;">
          🎯 Target Location
          <div style="font-size: 13px; font-weight: 800; color: #03071E; margin-top: 2px;">${pt.name}</div>
          <div style="font-size: 10px; color: #64748B; margin-top: 3px;">(Drag to move)</div>
        </div>`
      )
      .addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const updated: NavigationPoint = {
        type: 'pin',
        name: `Target Location (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`,
        latitude: pos.lat,
        longitude: pos.lng,
      };
      setNavState((prev) => ({ ...prev, destination: updated }));
    });

    destinationMarkerRef.current = marker;
  }, []);

  // Trigger recalculation whenever origin, destination, or mode changes
  useEffect(() => {
    syncOriginMarker(navState.origin);
    syncDestinationMarker(navState.destination);
    calculateAndRenderRoute(navState.origin, navState.destination, navState.mode);
  }, [navState.origin, navState.destination, navState.mode, syncOriginMarker, syncDestinationMarker, calculateAndRenderRoute]);

  // 4. Initialize Leaflet Map (clean OSM base layer + click-to-route handling)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: VIT_VELLORE_CENTER,
        zoom: INITIAL_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxBounds: VIT_WORKING_BOUNDS,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: MAX_ZOOM,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);

    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Map Click Listener for interactive Starting Location / Target Location setting
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const onMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Case 1: Specific pin drop mode is active
      if (pinDropMode === 'origin') {
        const pt: NavigationPoint = {
          type: 'custom',
          name: `Map Point A (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          latitude: lat,
          longitude: lng,
        };
        setNavState((p) => ({ ...p, origin: pt }));
        setPinDropMode(null);
        return;
      }

      if (pinDropMode === 'destination') {
        const pt: NavigationPoint = {
          type: 'custom',
          name: `Map Point B (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          latitude: lat,
          longitude: lng,
        };
        setNavState((p) => ({ ...p, destination: pt }));
        setPinDropMode(null);
        return;
      }

      // Case 2: Interactive map popup with two action buttons
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1.5 space-y-2 text-center';
      popupContent.style.minWidth = '180px';
      popupContent.innerHTML = `
        <div style="font-size: 11px; font-weight: 800; color: #9D0208; text-transform: uppercase; letter-spacing: 0.5px;">Campus Location</div>
        <div style="font-size: 11px; font-family: monospace; color: #64748B;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        <div style="display: flex; flex-direction: column; gap: 6px; padding-top: 4px;">
          <button id="set-origin-action-btn" style="background: #6A040F; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            📍 Set as Starting Location
          </button>
          <button id="set-dest-action-btn" style="background: #9D0208; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            🎯 Set as Target Location
          </button>
        </div>
      `;

      L.popup()
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map);

      setTimeout(() => {
        const btnOrigin = popupContent.querySelector('#set-origin-action-btn');
        const btnDest = popupContent.querySelector('#set-dest-action-btn');

        if (btnOrigin) {
          btnOrigin.addEventListener('click', () => {
            const pt: NavigationPoint = {
              type: 'custom',
              name: `Starting Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              latitude: lat,
              longitude: lng,
            };
            setNavState((p) => ({ ...p, origin: pt }));
            map.closePopup();
          });
        }

        if (btnDest) {
          btnDest.addEventListener('click', () => {
            const pt: NavigationPoint = {
              type: 'custom',
              name: `Target Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              latitude: lat,
              longitude: lng,
            };
            setNavState((p) => ({ ...p, destination: pt }));
            map.closePopup();
          });
        }
      }, 50);
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [pinDropMode]);

  // 5. User Live Geolocation Watcher
  const updateUserPositionOnMap = (lat: number, lng: number, accuracy: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setLatLng([lat, lng]);
      userAccuracyCircleRef.current.setRadius(accuracy);
    } else {
      userAccuracyCircleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: '#DC2F02',
        weight: 1.5,
        fillColor: '#DC2F02',
        fillOpacity: 0.12,
      }).addTo(map);
    }

    const userMarkerHtml = `
      <div style="position: relative; width: 28px; height: 28px;">
        <div style="position: absolute; inset: 0; background: #DC2F02; opacity: 0.35; border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 18px; height: 18px; margin: 5px; background: #DC2F02; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 10px rgba(220,47,2,0.65);"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'live-gps-user-marker',
      html: userMarkerHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
        .bindPopup(
          `<div style="font-size: 12px; font-weight: bold; color: #9D0208; text-align: center;">
            📍 Your Live Location
            <div style="font-size: 10px; font-weight: normal; color: #64748B;">GPS accuracy ~${Math.round(accuracy)}m</div>
          </div>`
        )
        .addTo(map);
    }
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude, accuracy });
          updateUserPositionOnMap(latitude, longitude, accuracy);
        },
        () => { },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
      );
      watchIdRef.current = watchId;
    }

    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // 6. "Locate Me" Button Handler
  const handleLocateMe = () => {
    setLocationError(null);
    setLocationStatus(null);
    setIsLocating(true);

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
        updateUserPositionOnMap(latitude, longitude, accuracy);

        const inside = isWithinBounds(latitude, longitude);
        if (!inside) {
          setLocationStatus('Your current location is outside the VIT Vellore map area.');
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], Math.max(mapInstanceRef.current.getZoom(), 17));
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. Please allow location access in your browser.');
        } else {
          setLocationError('Unable to determine current location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );
  };

  // Set Origin to Current Location
  const handleSelectCurrentLocationAsOrigin = () => {
    if (userLocation) {
      setNavState((prev) => ({
        ...prev,
        origin: {
          type: 'current',
          name: 'My Current Location',
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        },
      }));
    } else {
      handleLocateMe();
    }
  };

  // Swap Origin and Destination
  const handleSwap = () => {
    if (!navState.origin || !navState.destination) return;
    setNavState((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  // Clear Entire Navigation
  const handleClearNavigation = () => {
    setNavState({ origin: null, destination: null, mode: 'walking' });
    setCurrentRoute(null);
    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    if (routeGlowPolylineRef.current) {
      routeGlowPolylineRef.current.remove();
      routeGlowPolylineRef.current = null;
    }
  };

  // 7. Canonical Location Resolver for URL queries
  const resolveLocation = (
    rawQuery: string,
    locations: DirectoryEntry[]
  ): { entry: DirectoryEntry; roomLabel?: string } | null => {
    if (!rawQuery || locations.length === 0) return null;
    const q = rawQuery.trim();
    const qLower = q.toLowerCase();

    const byId = locations.find((l) => String(l.id) === q);
    if (byId) return { entry: byId };

    const roomMatch = q.match(/^([a-z]+)[-\s]?(\d+[a-z]?)$/i);
    if (roomMatch) {
      const bldCode = roomMatch[1].toUpperCase();
      const roomNum = `${bldCode}-${roomMatch[2].toUpperCase()}`;
      const bld = locations.find((l) => {
        const shortMatch = l.short_name && l.short_name.toUpperCase() === bldCode;
        const codeMatch = l.building_code && l.building_code.toUpperCase() === bldCode;
        const aliasMatch = l.aliases && l.aliases.some((a) => a.toUpperCase() === bldCode);
        const namePrefix = l.name.toUpperCase().startsWith(bldCode);
        return shortMatch || codeMatch || aliasMatch || namePrefix;
      });
      if (bld) return { entry: bld, roomLabel: roomNum };
    }

    const exactAlias = locations.find((l) => l.aliases && l.aliases.some((a) => a.toLowerCase() === qLower));
    if (exactAlias) return { entry: exactAlias };

    const exactShort = locations.find((l) => l.short_name && l.short_name.toLowerCase() === qLower);
    if (exactShort) return { entry: exactShort };

    const exactName = locations.find((l) => l.name.toLowerCase() === qLower);
    if (exactName) return { entry: exactName };

    const partial = locations.find((l) => {
      const matchName = l.name.toLowerCase().includes(qLower);
      const matchShort = l.short_name && l.short_name.toLowerCase().includes(qLower);
      const matchAlias = l.aliases && l.aliases.some((a) => a.toLowerCase() === qLower);
      const matchKeyword = l.search_keywords && l.search_keywords.some((k) => k.toLowerCase() === qLower);
      return matchName || matchShort || matchAlias || matchKeyword;
    });

    return partial ? { entry: partial } : null;
  };

  // Handle URL query parameters (e.g. from Directory "Open in Map" or Dashboard)
  useEffect(() => {
    const destParam = searchParams.get('destName') || searchParams.get('dest') || searchParams.get('destination') || searchParams.get('select');
    const destLatStr = searchParams.get('lat');
    const destLngStr = searchParams.get('lng');
    const destId = searchParams.get('destId');
    const roomParam = searchParams.get('loc') || searchParams.get('room');

    if (!destParam && !destLatStr) return;

    if (destLatStr && destLngStr) {
      const lat = parseFloat(destLatStr);
      const lng = parseFloat(destLngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        const destPoint: NavigationPoint = {
          type: 'directory',
          id: destId || undefined,
          name: destParam || 'Selected Destination',
          latitude: lat,
          longitude: lng,
          locationName: roomParam || undefined,
        };
        setNavState((prev) => ({
          ...prev,
          destination: destPoint,
          origin: prev.origin || (userLocation ? {
            type: 'current',
            name: 'My Current Location',
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          } : null),
        }));
        return;
      }
    }

    if (destParam && allLocations.length > 0) {
      const resolved = resolveLocation(destParam, allLocations);
      if (resolved && resolved.entry.latitude != null && resolved.entry.longitude != null) {
        const destPoint: NavigationPoint = {
          type: 'directory',
          id: resolved.entry.id,
          name: resolved.entry.name,
          latitude: resolved.entry.latitude,
          longitude: resolved.entry.longitude,
          locationName: resolved.roomLabel ? `Room ${resolved.roomLabel}` : (resolved.entry.location_name || resolved.entry.building || undefined),
        };
        setNavState((prev) => ({
          ...prev,
          destination: destPoint,
          origin: prev.origin || (userLocation ? {
            type: 'current',
            name: 'My Current Location',
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          } : null),
        }));
      }
    }
  }, [searchParams, allLocations, userLocation]);

  // Search filtering
  const searchFilter = useCallback((query: string) => {
    if (!query.trim()) return allLocations.slice(0, 8);
    const q = query.toLowerCase().trim();

    return allLocations.filter((l) => {
      const matchName = l.name.toLowerCase().includes(q);
      const matchShort = l.short_name && l.short_name.toLowerCase().includes(q);
      const matchAliases = l.aliases && l.aliases.some((a) => a.toLowerCase().includes(q));
      const matchKeywords = l.search_keywords && l.search_keywords.some((k) => k.toLowerCase().includes(q));
      const matchBuilding = (l.building || l.building_code || '').toLowerCase().includes(q);
      return matchName || matchShort || matchAliases || matchKeywords || matchBuilding;
    }).slice(0, 10);
  }, [allLocations]);

  const filteredOriginLocations = useMemo(() => searchFilter(originSearchQuery), [searchFilter, originSearchQuery]);
  const filteredDestLocations = useMemo(() => searchFilter(destSearchQuery), [searchFilter, destSearchQuery]);

  const handleSelectOrigin = (loc: DirectoryEntry) => {
    if (!loc.latitude || !loc.longitude) return;
    setNavState((prev) => ({
      ...prev,
      origin: {
        type: 'directory',
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude!,
        longitude: loc.longitude!,
        locationName: loc.location_name || loc.building || undefined,
      },
    }));
    setIsOriginSearchOpen(false);
    setOriginSearchQuery('');
  };

  const handleSelectDestination = (loc: DirectoryEntry) => {
    if (!loc.latitude || !loc.longitude) return;
    setNavState((prev) => ({
      ...prev,
      destination: {
        type: 'directory',
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude!,
        longitude: loc.longitude!,
        locationName: loc.location_name || loc.building || undefined,
      },
    }));
    setIsDestSearchOpen(false);
    setDestSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Toast Messages for Location Status / Errors */}
      {locationError && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </span>
          <button onClick={() => setLocationError(null)} className="font-bold underline text-[11px] ml-2">
            Dismiss
          </button>
        </div>
      )}

      {locationStatus && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{locationStatus}</span>
          </span>
          <button onClick={() => setLocationStatus(null)} className="font-bold underline text-[11px] ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Setup Panel */}
      <Card className="p-4 md:p-5 border border-slate-200/90 shadow-sm bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#9D0208] uppercase tracking-wider">
            <Compass className="w-4.5 h-4.5 text-[#9D0208]" />
            <span>Campus Navigation & Routing Engine</span>
            {currentRoute && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {currentRoute.engine === 'osrm-osm' ? 'OSM Walking Network' : 'Campus Dijkstra'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Locate Me Button */}
            <Button
              variant="ghost"
              size="sm"
              icon={<Crosshair className={`w-4 h-4 text-[#9D0208] ${isLocating ? 'animate-spin' : ''}`} />}
              onClick={handleLocateMe}
            >
              {isLocating ? 'Locating...' : 'Locate Me (GPS)'}
            </Button>

            {(navState.origin || navState.destination) && (
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5 text-stone-500" />}
                onClick={handleClearNavigation}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Route Selectors Bar: Origin ⇄ Destination */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Starting Location Picker */}
          <div className="md:col-span-5 relative">
            <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Starting Location</span>
                {navState.origin?.type === 'current' && (
                  <span className="text-[10px] text-[#9D0208] bg-amber-100 px-1.5 py-0.2 rounded font-mono">Live GPS</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setPinDropMode(pinDropMode === 'origin' ? null : 'origin')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${pinDropMode === 'origin'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
              >
                {pinDropMode === 'origin' ? 'Click Map to Place...' : '📍 Drop Pin on Map'}
              </button>
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsOriginSearchOpen(!isOriginSearchOpen)}
                className="w-full text-left p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-[#03071E] hover:border-[#9D0208] focus:outline-none flex items-center justify-between"
              >
                <span className="truncate">
                  {navState.origin ? `📍 ${navState.origin.name}` : 'Choose Starting Location or Click Map...'}
                </span>
                <Search className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
              </button>

              <button
                type="button"
                title="Use My Current Location"
                onClick={handleSelectCurrentLocationAsOrigin}
                className="p-2.5 bg-amber-50 text-[#9D0208] hover:bg-amber-100 border border-amber-200 rounded-xl shrink-0 transition-colors"
              >
                <Crosshair className="w-4 h-4" />
              </button>

              {navState.origin && (
                <button
                  type="button"
                  title="Clear Origin"
                  onClick={() => setNavState((p) => ({ ...p, origin: null }))}
                  className="p-2.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-600 border border-stone-200 rounded-xl shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Origin Dropdown Search */}
            {isOriginSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-xl shadow-xl z-50 p-2 space-y-1.5 max-h-64 overflow-y-auto">
                <div className="flex items-center gap-2 p-1.5 bg-stone-50 rounded-lg">
                  <Search className="w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={originSearchQuery}
                    onChange={(e) => setOriginSearchQuery(e.target.value)}
                    placeholder="Search campus starting point..."
                    className="w-full bg-transparent text-xs outline-none"
                    autoFocus
                  />
                  {originSearchQuery && (
                    <button onClick={() => setOriginSearchQuery('')}>
                      <X className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectCurrentLocationAsOrigin();
                    setIsOriginSearchOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-bold text-[#9D0208] hover:bg-amber-50 flex items-center gap-2"
                >
                  <Crosshair className="w-3.5 h-3.5 text-[#DC2F02]" />
                  <span>Use My Live Location</span>
                </button>

                <div className="text-[10px] font-bold text-stone-400 uppercase px-2 pt-1">Verified Campus Places</div>
                {filteredOriginLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectOrigin(loc)}
                    className="w-full text-left p-2 rounded-lg text-xs hover:bg-stone-100 transition-colors flex flex-col"
                  >
                    <span className="font-semibold text-[#03071E]">{loc.name}</span>
                    <span className="text-[10px] text-stone-500">{loc.location_name || loc.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button (1 col) */}
          <div className="md:col-span-1 flex justify-center pt-5">
            <button
              type="button"
              title="Swap Origin & Destination"
              disabled={!navState.origin || !navState.destination}
              onClick={handleSwap}
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-[#9D0208] hover:text-white text-stone-600 disabled:opacity-40 disabled:hover:bg-stone-100 disabled:hover:text-stone-600 transition-all flex items-center justify-center border border-stone-200 shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Target Location Picker */}
          <div className="md:col-span-6 relative">
            <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#9D0208] inline-block" />
                <span>Target Location</span>
              </span>
              <button
                type="button"
                onClick={() => setPinDropMode(pinDropMode === 'destination' ? null : 'destination')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${pinDropMode === 'destination'
                    ? 'bg-[#9D0208] text-white border-[#9D0208]'
                    : 'bg-amber-50 text-[#9D0208] border-amber-300 hover:bg-amber-100'
                  }`}
              >
                {pinDropMode === 'destination' ? 'Click Map to Place...' : '🎯 Drop Pin on Map'}
              </button>
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsDestSearchOpen(!isDestSearchOpen)}
                className="w-full text-left p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-[#03071E] hover:border-[#9D0208] focus:outline-none flex items-center justify-between"
              >
                <span className="truncate">
                  {navState.destination ? `🎯 ${navState.destination.name}` : 'Search Destination or Click Map...'}
                </span>
                <Search className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
              </button>

              {navState.destination && (
                <button
                  type="button"
                  title="Clear Destination"
                  onClick={() => setNavState((p) => ({ ...p, destination: null }))}
                  className="p-2.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-600 border border-stone-200 rounded-xl shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Destination Dropdown Search */}
            {isDestSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-xl shadow-xl z-50 p-2 space-y-1.5 max-h-64 overflow-y-auto">
                <div className="flex items-center gap-2 p-1.5 bg-stone-50 rounded-lg">
                  <Search className="w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={destSearchQuery}
                    onChange={(e) => setDestSearchQuery(e.target.value)}
                    placeholder="Search campus destination..."
                    className="w-full bg-transparent text-xs outline-none"
                    autoFocus
                  />
                  {destSearchQuery && (
                    <button onClick={() => setDestSearchQuery('')}>
                      <X className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  )}
                </div>

                <div className="text-[10px] font-bold text-stone-400 uppercase px-2 pt-1">Verified Campus Places</div>
                {filteredDestLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectDestination(loc)}
                    className="w-full text-left p-2 rounded-lg text-xs hover:bg-stone-100 transition-colors flex flex-col"
                  >
                    <span className="font-semibold text-[#03071E]">{loc.name}</span>
                    <span className="text-[10px] text-stone-500">{loc.location_name || loc.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600">Travel Mode:</span>
            <div className="inline-flex p-1 bg-stone-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setNavState((p) => ({ ...p, mode: 'walking' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${navState.mode === 'walking'
                    ? 'bg-gradient-to-r from-[#6A040F] to-[#9D0208] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                  }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Walking</span>
              </button>
              <button
                type="button"
                onClick={() => setNavState((p) => ({ ...p, mode: 'driving' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${navState.mode === 'driving'
                    ? 'bg-gradient-to-r from-[#6A040F] to-[#9D0208] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                  }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Driving</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pinDropMode && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg animate-pulse">
                Click anywhere on the map to set {pinDropMode === 'origin' ? 'Starting Point (A)' : 'Target (B)'}
              </span>
            )}

            <Button
              variant="primary"
              size="md"
              icon={<Navigation className={`w-4 h-4 ${isCalculatingRoute ? 'animate-spin' : ''}`} />}
              disabled={!navState.origin || !navState.destination || isCalculatingRoute}
              onClick={() => calculateAndRenderRoute(navState.origin, navState.destination, navState.mode)}
            >
              {isCalculatingRoute ? 'Routing...' : 'Update Route'}
            </Button>
          </div>
        </div>

        {/* Active Route Summary & Turn-by-Turn Guidance */}
        {currentRoute && (
          <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9D0208] to-[#DC2F02] text-white flex items-center justify-center font-black text-sm shadow-xs">
                  {currentRoute.estimatedMinutes}m
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-800 flex items-center gap-2">
                    <span>{currentRoute.source}</span>
                    <span className="text-stone-400">→</span>
                    <span className="text-[#9D0208]">{currentRoute.destination}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium flex items-center gap-2 mt-0.5">
                    <span>{currentRoute.distanceMeters} meters</span>
                    <span>•</span>
                    <span>~{currentRoute.estimatedMinutes} min ({currentRoute.mode})</span>
                    <span>•</span>
                    <span className="text-[#DC2F02] font-semibold">{currentRoute.engine === 'osrm-osm' ? 'OSM Footways' : 'Campus Shortest Path'}</span>
                  </div>
                </div>
              </div>

              {currentRoute.steps && currentRoute.steps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsStepsExpanded(!isStepsExpanded)}
                  className="text-xs font-bold text-[#9D0208] hover:text-[#6A040F] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-amber-200 shadow-2xs"
                >
                  <span>{isStepsExpanded ? 'Hide Steps' : `View ${currentRoute.steps.length} Steps`}</span>
                  {isStepsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Turn-by-turn guidance accordion */}
            {isStepsExpanded && currentRoute.steps && currentRoute.steps.length > 0 && (
              <div className="pt-2 border-t border-amber-200/60 space-y-2 max-h-56 overflow-y-auto pr-1">
                {currentRoute.steps.map((st, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 p-1.5 rounded-lg hover:bg-white/70 transition-colors">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-[#9D0208] flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{st.instruction}</div>
                      {st.distanceMeters > 0 && (
                        <div className="text-[10px] text-slate-500 font-medium">Continue for {st.distanceMeters} meters</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Leaflet OpenStreetMap Container */}
      <Card className="p-0 overflow-hidden border border-slate-200 relative shadow-sm h-[calc(100vh-18rem)] min-h-[500px]">
        {/* Floating Quick Hint */}
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md text-[11px] font-semibold text-slate-700 flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[#DC2F02] animate-pulse" />
          <span>Click anywhere on the map to set <strong>Starting Location</strong> or <strong>Target Location</strong></span>
        </div>

        <div ref={mapContainerRef} className="w-full h-full relative z-0" />
      </Card>
    </div>
  );
};
