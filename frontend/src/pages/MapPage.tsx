import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import {
  Navigation2,
  Crosshair,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Compass,
  Search
} from 'lucide-react';
import { campusLocations } from '../data/mockData';
import type { CampusLocation } from '../types';
import { navigationService } from '../services/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';

// Fix Leaflet marker icons default assets in Vite bundle
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%; margin: 7px auto;"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const userLocationMarkerIcon = L.divIcon({
  className: 'custom-user-location-marker',
  html: `<div style="position: relative; width: 32px; height: 32px;"><div style="position: absolute; inset: 0; background: #0A9396; opacity: 0.4; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div><div style="position: relative; width: 24px; height: 24px; margin: 4px; background-color: #0A9396; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(10,147,150,0.6); display: flex; justify-content: center; align-items: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%; margin: 5px auto;"></div></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const defaultMarkerIcon = createCustomMarkerIcon('#005F73');
const activeMarkerIcon = createCustomMarkerIcon('#EE9B00');

export const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const destQuery = searchParams.get('destination') || searchParams.get('dest');
  const selectQuery = searchParams.get('select');
  const myLocQuery = searchParams.get('myLocation');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [sourceNode, setSourceNode] = useState<string>('MENS_HOSTEL');
  const [destinationNode, setDestinationNode] = useState<string>(destQuery || selectQuery || 'SJT');
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9718, lng: 79.1633 });
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState<boolean>(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [routeInfo, setRouteInfo] = useState<{
    source: string;
    destination: string;
    distanceMeters: number;
    estimatedMinutes: number;
    path: string[];
    nodes?: any[];
  } | null>(null);

  const filteredLocations = campusLocations.filter((loc) => {
    const matchesQuery =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.building?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || loc.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesQuery && matchesCategory;
  });

  // Active Geolocation Tracking with Unmount Cleanup
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserCoords({ lat, lng });

          if (userMarkerRef.current && mapInstanceRef.current) {
            userMarkerRef.current.setLatLng([lat, lng]);
          }
        },
        (error) => {
          let msg = "Location permission is required to show your current position.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Location permission denied. Showing default VIT campus position.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location unavailable. Please check GPS settings.";
          }
          setLocationStatusMessage(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
      watchIdRef.current = watchId;
    }

    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const requestLocationAccess = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserCoords({ lat, lng });
          setIsPermissionModalOpen(false);
          setLocationStatusMessage(null);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 17);
            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([lat, lng]);
            }
          }
        },
        () => {
          setLocationStatusMessage("Location permission denied. Showing default VIT campus position.");
          setIsPermissionModalOpen(false);
        }
      );
    } else {
      setIsPermissionModalOpen(false);
    }
  };

  useEffect(() => {
    if (myLocQuery === 'true') {
      setIsPermissionModalOpen(true);
    }
  }, [myLocQuery]);

  // Calculate Dijkstra Shortest Path
  const handleCalculateRoute = async (src = sourceNode, dest = destinationNode) => {
    const route = await navigationService.calculateRoute(src, dest);
    if (route && !route.error) {
      setRouteInfo(route);
      drawRoutePolyline(route);
    } else {
      setLocationStatusMessage(route?.error || "Could not calculate route.");
    }
  };

  useEffect(() => {
    const target = destQuery || selectQuery;
    if (target) {
      const found = campusLocations.find(
        (l) => l.code.toLowerCase() === target.toLowerCase() || l.name.toLowerCase().includes(target.toLowerCase())
      );
      if (found) {
        setSelectedLocation(found);
        setDestinationNode(found.code);
        handleCalculateRoute(sourceNode, found.code);
      } else {
        handleCalculateRoute(sourceNode, target);
      }
    } else {
      handleCalculateRoute('MENS_HOSTEL', 'SJT');
    }
  }, [destQuery, selectQuery]);

  const drawRoutePolyline = (routeData: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }
    if (routeMarkersGroupRef.current) {
      routeMarkersGroupRef.current.clearLayers();
    } else {
      routeMarkersGroupRef.current = L.layerGroup().addTo(map);
    }

    let latLngs: [number, number][] = [];

    if (routeData.nodes && routeData.nodes.length > 0) {
      latLngs = routeData.nodes.map((n: any) => [n.lat, n.lng]);

      routeData.nodes.forEach((n: any, idx: number) => {
        const isStart = idx === 0;
        const isEnd = idx === routeData.nodes.length - 1;
        const color = isStart ? '#0A9396' : isEnd ? '#EE9B00' : '#005F73';
        const marker = L.marker([n.lat, n.lng], { icon: createCustomMarkerIcon(color) })
          .bindPopup(`<div style="font-weight: bold; text-align: center;">${idx + 1}. ${n.name}</div>`);
        routeMarkersGroupRef.current?.addLayer(marker);
      });
    } else {
      const destLoc = selectedLocation || campusLocations[0];
      latLngs = [
        [userCoords.lat, userCoords.lng],
        [(userCoords.lat + destLoc.lat) / 2, (userCoords.lng + destLoc.lng) / 2],
        [destLoc.lat, destLoc.lng]
      ];
    }

    const polyline = L.polyline(latLngs, {
      color: '#005F73',
      weight: 6,
      opacity: 0.95,
      dashArray: '8, 8'
    }).addTo(map);

    routePolylineRef.current = polyline;
    map.fitBounds(polyline.getBounds(), { padding: [60, 60] });
    setTimeout(() => map.invalidateSize(), 150);
  };

  // Initialize Leaflet Map with CartoDB Voyager tiles (High Reliability + Fast Load)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userCoords.lat, userCoords.lng],
        zoom: 16,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Voyager tiles (Ultra-reliable vector raster tiles)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors | VIT Vellore',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);

      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userLocationMarkerIcon })
        .bindPopup('<div style="font-weight: bold; color: #0A9396;">● You are here (Live Position)</div>')
        .addTo(map);

      mapInstanceRef.current = map;
    }

    const timer1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    const timer2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300);

    renderMarkers();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const renderMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    filteredLocations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const marker = L.marker([loc.lat, loc.lng], {
        icon: isSelected ? activeMarkerIcon : defaultMarkerIcon,
      });

      const popupContent = `
        <div style="padding: 4px; min-width: 170px;">
          <div style="font-size: 10px; font-weight: bold; color: #005F73; text-transform: uppercase;">${loc.code}</div>
          <div style="font-size: 13px; font-weight: bold; color: #1E293B;">${loc.name}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${loc.category}</div>
          <div style="font-size: 10px; color: #005F73; margin-top: 4px; font-weight: bold;">● Click to navigate route</div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedLocation(loc);
        setDestinationNode(loc.code);
        handleCalculateRoute(sourceNode, loc.code);
      });

      markersGroupRef.current?.addLayer(marker);
    });
  };

  useEffect(() => {
    renderMarkers();
  }, [selectedLocation, searchQuery, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Location Status Warning Toast */}
      {locationStatusMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationStatusMessage}</span>
          </span>
          <button onClick={() => setLocationStatusMessage(null)} className="font-bold underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Campus Route Planner & Search Control Header */}
      <Card className="p-5 border border-slate-200/80 space-y-4 shadow-sm bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#005F73] uppercase tracking-wider">
            <Compass className="w-4.5 h-4.5 text-[#005F73]" />
            <span>VIT Vellore Campus Map & Route Navigation</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={<Crosshair className="w-4 h-4 text-[#005F73]" />}
            onClick={requestLocationAccess}
          >
            My GPS Position
          </Button>
        </div>

        {/* Route Selectors Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Starting Point (Current Location)</label>
            <select
              value={sourceNode}
              onChange={(e) => setSourceNode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73]"
            >
              <option value="MENS_HOSTEL">Men's Hostel Blocks</option>
              <option value="MAIN_GATE">Main Entrance Gate</option>
              <option value="LIBRARY_JUNCTION">Library Crossroads</option>
              <option value="NORTH_JUNCTION">North Campus Junction</option>
              <option value="SJT_GATE">SJT Plaza Entrance</option>
              <option value="SJT">Silver Jubilee Tower (SJT)</option>
              <option value="TT">Technology Tower (TT)</option>
              <option value="SMV">Sir M Visvesvaraya (SMV)</option>
              <option value="LIBRARY">Periyar Central Library</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Destination / Building</label>
            <select
              value={destinationNode}
              onChange={(e) => setDestinationNode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73]"
            >
              <option value="SJT">Silver Jubilee Tower (SJT)</option>
              <option value="SJT208">SJT208 (Software Lab)</option>
              <option value="SJT204">SJT204 (Big Data Lab)</option>
              <option value="SJT218">SJT218 (DevOps Lab)</option>
              <option value="TT">Technology Tower (TT)</option>
              <option value="TT-624">TT-624 (Smart Classroom)</option>
              <option value="SMV">Sir M. Visvesvaraya (SMV)</option>
              <option value="LIBRARY">Periyar Central Library</option>
              <option value="MENS_HOSTEL">Men's Hostel Blocks</option>
              <option value="MAIN_GATE">Main Entrance Gate</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="primary"
              size="md"
              className="w-full h-[38px]"
              icon={<Navigation2 className="w-4 h-4" />}
              onClick={() => handleCalculateRoute(sourceNode, destinationNode)}
            >
              Calculate Route
            </Button>
          </div>
        </div>

        {/* Hotspots & Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search building, block or service..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005F73]"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto text-xs font-bold">
            {['all', 'academic', 'facility', 'dining', 'services'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  selectedCategory === cat ? 'bg-[#005F73] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Dijkstra Calculated Pathway Banner */}
      {routeInfo && (
        <div className="bg-gradient-to-r from-[#005F73] to-[#0A9396] text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-100">
              <Sparkles className="w-4 h-4 text-[#94D2BD]" />
              <span>Dijkstra Shortest Path Computed</span>
            </div>
            <div className="text-sm font-extrabold mt-0.5">
              Route from {routeInfo.source} to {routeInfo.destination} ({routeInfo.distanceMeters} m • ~{routeInfo.estimatedMinutes} min walk)
            </div>
            <div className="text-[11px] text-teal-100/90 mt-1 font-mono flex items-center flex-wrap gap-1">
              <span>Path:</span>
              {routeInfo.path.map((node, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded text-[10px]">
                  <span>{node}</span>
                  {i < routeInfo.path.length - 1 && <ArrowRight className="w-3 h-3 text-teal-200" />}
                </span>
              ))}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() => setRouteInfo(null)}
          >
            Clear Route
          </Button>
        </div>
      )}

      {/* Leaflet OpenStreetMap Container */}
      <Card className="p-0 overflow-hidden border-2 border-slate-300 relative shadow-md h-[540px]">
        <div ref={mapContainerRef} className="w-full h-full min-h-[540px] relative z-0" />
      </Card>

      {/* Permission Request Modal */}
      <Modal isOpen={isPermissionModalOpen} onClose={() => setIsPermissionModalOpen(false)} title="Location Permission Required">
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Location permission is required to show your live GPS position on the VIT Vellore campus map.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsPermissionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={requestLocationAccess}>
              Grant Location Permission
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
