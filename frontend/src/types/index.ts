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
  id: string;
  name: string;
  category: string;
  locationName: string;
  buildingCode?: string;
  roomNumber?: string;
  description: string;
  openingHours: string;
  contact?: string;
  iconName?: string;
  locationId?: string;
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

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedLocations?: CampusLocation[];
  quickActions?: {
    label: string;
    action: string;
    payload?: string;
  }[];
}
