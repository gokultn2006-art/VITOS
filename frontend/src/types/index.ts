export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  category: 'academic' | 'facility' | 'hostel' | 'service' | 'dining' | 'sports' | 'utility';
  lat: number;
  lng: number;
  description: string;
  building?: string;
  floor?: string;
  roomNumber?: string;
  facilities?: string[];
  image?: string;
  openingHours?: string;
  isSaved?: boolean;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  totalFloors: number;
  roomsCount: number;
}

export interface Room {
  id: string;
  roomNumber: string;
  buildingCode: string;
  buildingName: string;
  floor: number;
  capacity: number;
  availabilityStatus: 'available' | 'occupied' | 'reserved';
  availableUntil?: string;
  facilities: string[];
  currentCourse?: string;
}

export interface TimetableEntry {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  faculty: string;
  roomNumber: string;
  buildingCode: string;
  buildingName: string;
  walkingTimeMinutes: number;
  isNext?: boolean;
  isCurrent?: boolean;
}

export interface LostItem {
  id: string;
  type: 'lost' | 'found';
  title: string;
  category: 'ID Card' | 'Electronics' | 'Wallet' | 'Keys' | 'Calculator' | 'Bag' | 'Accessories' | 'Other';
  locationName: string;
  dateReported: string;
  description: string;
  contactName: string;
  contactEmail: string;
  imageUrl?: string;
  status: 'active' | 'claimed' | 'resolved';
}

export interface DirectoryEntry {
  id: string | number;
  name: string;
  short_name?: string;
  category: string;
  subcategory?: string;
  location_name?: string;
  locationName?: string;
  building_code?: string;
  buildingCode?: string;
  building?: string;
  floor?: string;
  room_number?: string;
  roomNumber?: string;
  room?: string;
  description: string;
  opening_hours?: string;
  openingHours?: string;
  contact?: string;
  phone?: string;
  email?: string;
  website?: string;
  icon_name?: string;
  iconName?: string;
  location_id?: string;
  locationId?: string;
  latitude?: number | null;
  longitude?: number | null;
  parent?: number | string | null;
  parent_name?: string;
  entry_type?: 'group' | 'subgroup' | 'entry';
  children_count?: number;
  has_coordinates?: boolean;
  aliases?: string[];
  search_keywords?: string[];
  services?: string[];
  facilities?: string[];
  source_url?: string;
  source_name?: string;
  last_verified?: string;
  osm_id?: string;
  osm_type?: string;
  osm_source_url?: string;
  last_osm_sync?: string;
  source_type?: string;
  gender_target?: 'Men' | 'Women' | 'Both' | string;
  facility_count?: number;
}

export interface NavigationPoint {
  type: 'current' | 'directory' | 'custom' | 'pin';
  id?: string | number;
  name: string;
  latitude: number;
  longitude: number;
  locationName?: string;
}

export interface NavigationState {
  origin: NavigationPoint | null;
  destination: NavigationPoint | null;
  mode: 'walking' | 'driving';
}

export interface NavigationStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds?: number;
  type?: string;
  modifier?: string;
}

export interface NavigationRouteResult {
  source: string;
  destination: string;
  distanceMeters: number;
  estimatedMinutes: number;
  mode: 'walking' | 'driving';
  engine: 'osrm-osm' | 'campus-dijkstra' | 'direct';
  coordinates: [number, number][];
  steps: NavigationStep[];
  path?: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'lost_found' | 'timetable';
  isRead: boolean;
}

export interface User {
  id: string;
  name: string;
  regNo: string;
  program: string;
  school: string;
  year: string;
  email: string;
  avatar: string;
  savedLocationIds: string[];
  recentSearches: string[];
  role: 'student' | 'admin';
}

export interface ChatSuggestedLocation {
  id: string | number;
  name: string;
  category?: string;
  code?: string;
  building?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedLocations?: (CampusLocation | ChatSuggestedLocation)[];
  quickActions?: {
    label: string;
    action: string;
    payload?: string;
  }[];
}
