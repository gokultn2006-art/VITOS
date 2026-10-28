import axios from 'axios';
import { campusLocations, emptyClassrooms, studentTimetable, lostItemsList, directoryEntries, buildings } from '../data/mockData';
import type { CampusLocation, Room, TimetableEntry, LostItem, DirectoryEntry, NotificationItem, ChatMessage, User, NavigationRouteResult, NavigationStep } from '../types';

const rawBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vitos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const res = await api.post('/auth/login/', { identifier, password });
      const u = res.data.user;
      const userObj: User = {
        id: `usr_${u.id}`,
        name: u.profile?.full_name || u.first_name || u.username,
        regNo: u.profile?.reg_no || u.username,
        program: u.profile?.programme || 'B.Tech Computer Science and Engineering',
        school: 'SCOPE (School of Computer Science and Engineering)',
        year: u.profile?.year_semester || '3rd Year (Semester VI)',
        email: u.email,
        avatar: (u.profile?.avatar_url && !u.profile.avatar_url.includes('images.unsplash.com')) ? u.profile.avatar_url : '/default-avatar.png',
        savedLocationIds: u.profile?.saved_locations || ['loc_tt', 'loc_lib'],
        recentSearches: u.profile?.recent_searches || ['TT-624', 'Periyar Library'],
        role: (u.isStaff === true || u.is_staff === true) ? 'admin' : 'student'
      };
      return { user: userObj, token: res.data.token };
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 401) {
        throw new Error(err.response?.data?.error || 'Invalid email or password. Please verify your credentials.');
      }
      if (err.response?.data?.error) {
        throw new Error(err.response.data.error);
      }

      // Offline Demo Fallback Users (only when backend is completely unreachable)
      if (identifier.includes('23BCE0512') || identifier.toLowerCase().includes('rahul')) {
        const userObj: User = {
          id: 'usr_0512',
          name: 'Rahul Sharma',
          regNo: '23BCE0512',
          program: 'B.Tech Computer Science and Engineering (Data Science)',
          school: 'SCOPE (School of Computer Science and Engineering)',
          year: '2nd Year (Semester IV)',
          email: 'rahul.sharma2023@vitstudent.ac.in',
          avatar: '/default-avatar.png',
          savedLocationIds: ['loc_sjt', 'loc_fc'],
          recentSearches: ['SJT-302', 'Food Mall', 'Medical Centre'],
          role: 'student'
        };
        return { user: userObj, token: `vitos_token_demo_${userObj.regNo}` };
      } else if (identifier.includes('21BCE0199') || identifier.toLowerCase().includes('ananya')) {
        const userObj: User = {
          id: 'usr_0199',
          name: 'Ananya Patel',
          regNo: '21BCE0199',
          program: 'B.Tech Electronics and Communication Engineering',
          school: 'SENSE (School of Electronics Engineering)',
          year: '4th Year (Semester VIII)',
          email: 'ananya.patel2021@vitstudent.ac.in',
          avatar: '/default-avatar.png',
          savedLocationIds: ['loc_tt', 'loc_med'],
          recentSearches: ['TT-412', 'SENSE Lab'],
          role: 'student'
        };
        return { user: userObj, token: `vitos_token_demo_${userObj.regNo}` };
      } else if (identifier.includes('admin')) {
        const userObj: User = {
          id: 'usr_admin',
          name: 'VIT System Administrator',
          regNo: 'ADMIN001',
          program: 'CampusOS Administration',
          school: 'Staff Administration',
          year: 'Staff / Faculty',
          email: 'admin@vitstudent.ac.in',
          avatar: '/default-avatar.png',
          savedLocationIds: ['loc_tt', 'loc_lib'],
          recentSearches: ['TT-624', 'Periyar Library'],
          role: 'admin'
        };
        return { user: userObj, token: 'vitos_token_demo_admin' };
      } else if (identifier.includes('22BCE1024') || identifier.toLowerCase().includes('chris')) {
        const userObj: User = {
          id: 'usr_1024',
          name: 'Chris',
          regNo: '22BCE1024',
          program: 'B.Tech Computer Science and Engineering',
          school: 'SCOPE (School of Computer Science and Engineering)',
          year: '3rd Year (Semester VI)',
          email: 'chris.student2022@vitstudent.ac.in',
          avatar: '/default-avatar.png',
          savedLocationIds: ['loc_tt', 'loc_lib', 'loc_med'],
          recentSearches: ['TT-624', 'Periyar Library', 'Medical Centre'],
          role: 'student'
        };
        return { user: userObj, token: `vitos_token_demo_${userObj.regNo}` };
      }

      throw new Error(err.message || 'Login failed. Please verify credentials.');
    }
  },

  async sendOtp(email: string): Promise<{ message: string; email: string }> {
    const res = await api.post('/auth/send-otp/', { email }, { timeout: 30000 });
    return res.data;
  },

  async verifyOtp(email: string, otp: string): Promise<{ message: string; verified: boolean; email: string }> {
    const res = await api.post('/auth/verify-otp/', { email, otp }, { timeout: 15000 });
    return res.data;
  },

  async googleAuth(data: { email: string; name?: string; picture?: string; credential?: string }): Promise<{ user: User; token: string; isNewUser: boolean }> {
    const res = await api.post('/auth/google/', data);
    const u = res.data.user;
    const userObj: User = {
      id: `usr_${u.id}`,
      name: u.profile?.full_name || u.first_name || u.username,
      regNo: u.profile?.reg_no || u.username,
      program: u.profile?.programme || '',
      school: 'SCOPE (School of Computer Science and Engineering)',
      year: u.profile?.year_semester || '',
      email: u.email,
      avatar: (u.profile?.avatar_url && !u.profile.avatar_url.includes('images.unsplash.com')) ? u.profile.avatar_url : '/default-avatar.png',
      savedLocationIds: u.profile?.saved_locations || ['loc_tt', 'loc_lib'],
      recentSearches: u.profile?.recent_searches || ['TT-624', 'Periyar Library'],
      role: (u.isStaff === true || u.is_staff === true) ? 'admin' : 'student'
    };
    return { user: userObj, token: res.data.token, isNewUser: !!res.data.is_new_user };
  },

  async register(data: {
    fullName: string;
    regNo: string;
    email: string;
    password: string;
    programme: string;
    yearSemester: string;
  }): Promise<{ user: User; token: string }> {
    try {
      const res = await api.post('/auth/register/', {
        full_name: data.fullName,
        reg_no: data.regNo,
        email: data.email,
        password: data.password,
        programme: data.programme,
        year_semester: data.yearSemester
      });
      const u = res.data.user;
      const userObj: User = {
        id: `usr_${u.id}`,
        name: data.fullName,
        regNo: data.regNo,
        program: data.programme,
        school: 'SCOPE (School of Computer Science and Engineering)',
        year: data.yearSemester,
        email: data.email,
        avatar: '/default-avatar.png',
        savedLocationIds: ['loc_tt', 'loc_lib'],
        recentSearches: ['TT-624', 'Periyar Library'],
        role: 'student'
      };
      return { user: userObj, token: res.data.token };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed.';
      throw new Error(errorMsg);
    }
  },

  async updateProfile(data: {
    fullName?: string;
    regNo?: string;
    programme?: string;
    yearSemester?: string;
    avatarUrl?: string;
    savedLocationIds?: string[];
  }): Promise<{ user: User }> {
    try {
      const res = await api.post('/users/profile/update/', {
        fullName: data.fullName,
        regNo: data.regNo,
        programme: data.programme,
        yearSemester: data.yearSemester,
        avatarUrl: data.avatarUrl,
        savedLocationIds: data.savedLocationIds,
      });
      const u = res.data.user;
      const userObj: User = {
        id: `usr_${u.id}`,
        name: u.profile?.full_name || u.first_name || u.username,
        regNo: u.profile?.reg_no || u.username,
        program: u.profile?.programme || 'B.Tech Computer Science and Engineering',
        school: 'SCOPE (School of Computer Science and Engineering)',
        year: u.profile?.year_semester || '3rd Year (Semester VI)',
        email: u.email,
        avatar: (u.profile?.avatar_url && !u.profile.avatar_url.includes('images.unsplash.com')) ? u.profile.avatar_url : '/default-avatar.png',
        savedLocationIds: u.profile?.saved_locations || ['loc_tt', 'loc_lib'],
        recentSearches: u.profile?.recent_searches || ['TT-624', 'Periyar Library'],
        role: (u.isStaff === true || u.is_staff === true) ? 'admin' : 'student'
      };
      return { user: userObj };
    } catch {
      const savedUserStr = localStorage.getItem('vitos_user');
      const cur = savedUserStr ? JSON.parse(savedUserStr) : {};
      const updatedUser: User = {
        ...cur,
        name: data.fullName || cur.name,
        program: data.programme || cur.program,
        year: data.yearSemester || cur.year,
        avatar: data.avatarUrl || cur.avatar,
        savedLocationIds: data.savedLocationIds || cur.savedLocationIds,
      };
      return { user: updatedUser };
    }
  },

  async deleteAccount(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await api.delete('/users/delete-account/');
      return { success: true, message: res.data.message };
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to delete account.');
    }
  }
};

export const locationService = {
  async getAll(): Promise<CampusLocation[]> {
    try {
      const res = await api.get('/locations/');
      return res.data;
    } catch {
      return campusLocations;
    }
  },
  async getById(id: string): Promise<CampusLocation | undefined> {
    try {
      const res = await api.get(`/locations/${id}/`);
      return res.data;
    } catch {
      return campusLocations.find(l => l.id === id || l.code === id);
    }
  }
};

export const classroomService = {
  async getAvailable(): Promise<Room[]> {
    try {
      const res = await api.get('/classrooms/available/');
      return res.data;
    } catch {
      return emptyClassrooms;
    }
  }
};

export const timetableService = {
  async getStudentTimetable(): Promise<TimetableEntry[]> {
    try {
      const res = await api.get('/timetable/');
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch {
      const savedUserStr = localStorage.getItem('vitos_user');
      const cur = savedUserStr ? JSON.parse(savedUserStr) : null;
      if (cur?.regNo === '22BCE1024') {
        return studentTimetable;
      }
      return [];
    }
  },
  async registerTimetable(courses: any[], semester = 'Winter 2026', academicYear = '2025-2026'): Promise<any> {
    try {
      const res = await api.post('/timetable/register/', { courses, semester, academicYear });
      return res.data;
    } catch (err: any) {
      return { error: err.response?.data?.error || 'Failed to register timetable.' };
    }
  },
  async getNextClass(): Promise<any> {
    try {
      const res = await api.get('/timetable/next/');
      return res.data;
    } catch {
      return {
        hasUpcoming: true,
        courseCode: "IMAT205L",
        courseName: "Discrete Mathematics and Graph Theory",
        faculty: "SHUBHANGI DWIVEDI",
        venue: "SJT208",
        day: "WEDNESDAY",
        startTime: "02:00 PM",
        endTime: "02:50 PM",
        minutesUntilStart: 45,
        slot: "C2",
        statusText: "Starts in 45 minutes (SJT208)"
      };
    }
  },
  async exportJson(): Promise<any> {
    try {
      const res = await api.get('/timetable/export/');
      return res.data;
    } catch {
      return {
        version: 1,
        studentRegNo: "22BCE1024",
        courses: []
      };
    }
  },
  async importJson(jsonData: any): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await api.post('/timetable/import/', jsonData);
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || "Failed to import JSON timetable." };
    }
  }
};

export const lostFoundService = {
  async getItems(): Promise<LostItem[]> {
    try {
      const res = await api.get('/lost-found/');
      return res.data;
    } catch {
      return lostItemsList;
    }
  },
  async createItem(item: Partial<LostItem>): Promise<LostItem> {
    try {
      const res = await api.post('/lost-found/', item);
      return res.data;
    } catch {
      const newItem: LostItem = {
        id: `item_${Date.now()}`,
        type: item.type || 'lost',
        title: item.title || 'Reported Item',
        category: item.category || 'Other',
        locationName: item.locationName || 'VIT Campus',
        dateReported: new Date().toISOString().split('T')[0],
        description: item.description || '',
        contactName: item.contactName || 'Student',
        contactEmail: item.contactEmail || 'student@vitstudent.ac.in',
        imageUrl: item.imageUrl,
        status: 'active'
      };
      lostItemsList.unshift(newItem);
      return newItem;
    }
  }
};

export const directoryService = {
  async getEntries(params?: { category?: string; parent?: number | string | null; type?: string; search?: string }): Promise<DirectoryEntry[]> {
    try {
      const res = await api.get('/directory/', { params });
      return res.data;
    } catch {
      return directoryEntries;
    }
  },

  async getEntryById(id: string | number): Promise<DirectoryEntry | null> {
    try {
      const res = await api.get(`/directory/${id}/`);
      return res.data;
    } catch {
      const found = directoryEntries.find((d) => String(d.id) === String(id));
      return found || null;
    }
  }
};

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await api.get('/notifications/');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }
};

export const profileService = {
  async uploadPhoto(file: File): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await api.post('/users/profile/photo/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Failed to upload profile photo.' };
    }
  },
  getPhotoUrl(userId?: number): string {
    const baseUrl = api.defaults.baseURL || '/api';
    return userId ? `${baseUrl}/users/profile/photo/${userId}/` : `${baseUrl}/users/profile/photo/`;
  }
};

export const navigationService = {
  async calculateRoute(
    sourceOrParams: string | {
      source?: string;
      destination?: string;
      fromLat?: number;
      fromLng?: number;
      toLat?: number;
      toLng?: number;
      mode?: 'walking' | 'driving';
    },
    maybeDest?: string
  ): Promise<NavigationRouteResult> {
    const params = typeof sourceOrParams === 'string'
      ? { source: sourceOrParams, destination: maybeDest || '' }
      : sourceOrParams;

    const mode = params.mode || 'walking';

    // 1. If coordinates are provided, query OpenStreetMap routing directly
    if (params.fromLat && params.fromLng && params.toLat && params.toLng) {
      const fromLng = params.fromLng.toFixed(6);
      const fromLat = params.fromLat.toFixed(6);
      const toLng = params.toLng.toFixed(6);
      const toLat = params.toLat.toFixed(6);

      // Prioritize dedicated OpenStreetMap foot/car routing engines:
      // - Walking: routing.openstreetmap.de/routed-foot routes through campus walkable trails, footpaths, and subways
      // - Driving: routing.openstreetmap.de/routed-car routes through campus roadways
      const candidateUrls = mode === 'walking'
        ? [
            `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`,
            `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`
          ]
        : [
            `https://routing.openstreetmap.de/routed-car/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`,
            `https://router.project-osrm.org/route/v1/car/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`
          ];

      for (const url of candidateUrls) {
        try {
          const res = await axios.get(url, { timeout: 4500 });
          if (res.data?.code === 'Ok' && res.data?.routes?.length > 0) {
            const route = res.data.routes[0];
            const coords: [number, number][] = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
            const dist = Math.round(route.distance * 10) / 10;
            // Realistic duration: walking ~1.25 m/s (~4.5 km/h), driving ~6-8 m/s
            const duration = route.duration || (mode === 'walking' ? dist / 1.25 : dist / 7.0);
            const minutes = Math.max(1, Math.round(duration / 60));

            const steps: NavigationStep[] = [];
            for (const leg of route.legs || []) {
              for (const st of leg.steps || []) {
                const maneuver = st.maneuver || {};
                const mtype = maneuver.type || 'step';
                const modifier = maneuver.modifier || '';
                const sname = st.name || '';
                let instruction = '';

                if (mtype === 'depart') {
                  instruction = `Head ${modifier || 'forward'} from start` + (sname ? ` onto ${sname}` : '');
                } else if (mtype === 'arrive') {
                  instruction = `Arrive at destination` + (sname ? ` on ${sname}` : '');
                } else if (mtype === 'turn' || mtype === 'end of road') {
                  instruction = `Turn ${modifier || 'along path'}` + (sname ? ` onto ${sname}` : '');
                } else if (mtype === 'continue') {
                  instruction = `Continue ${modifier || 'straight'}` + (sname ? ` on ${sname}` : '');
                } else {
                  instruction = `${mtype.charAt(0).toUpperCase() + mtype.slice(1)} ${modifier}`.trim() + (sname ? ` on ${sname}` : '');
                }

                steps.push({
                  instruction,
                  distanceMeters: Math.round(st.distance || 0),
                  durationSeconds: Math.round(st.duration || 0),
                  type: mtype,
                  modifier
                });
              }
            }

            return {
              source: params.source || 'Starting Location',
              destination: params.destination || 'Target Location',
              distanceMeters: dist,
              estimatedMinutes: minutes,
              mode,
              engine: 'osrm-osm',
              coordinates: coords,
              steps
            };
          }
        } catch {
          // Try next candidate URL
        }
      }
    }

    // 2. Query Django backend (/api/locations/navigate/)
    try {
      const res = await api.post('/locations/navigate/', {
        source: params.source,
        destination: params.destination,
        from_lat: params.fromLat,
        from_lng: params.fromLng,
        to_lat: params.toLat,
        to_lng: params.toLng,
        mode
      });
      return res.data;
    } catch {
      // Direct Euclidean fallback between coordinates if network fails
      const fLat = params.fromLat || 12.9730;
      const fLng = params.fromLng || 79.1645;
      const tLat = params.toLat || 12.9716;
      const tLng = params.toLng || 79.1634;
      const coords: [number, number][] = [[fLat, fLng], [tLat, tLng]];
      return {
        source: params.source || 'Start Point',
        destination: params.destination || 'Destination Point',
        distanceMeters: 450,
        estimatedMinutes: 5,
        mode,
        engine: 'campus-dijkstra',
        coordinates: coords,
        steps: [
          { instruction: 'Head toward your destination following campus walkways', distanceMeters: 450 }
        ]
      };
    }
  }
};

export const adminService = {
  async getClassroomAvailability(): Promise<any[]> {
    try {
      const res = await api.get('/classrooms/availability/');
      return res.data;
    } catch {
      return [
        { id: 1, classroom: 'SJT208', date: '2026-08-21', startTime: '08:00 AM', endTime: '05:30 PM', status: 'UNCONFIRMED', notes: 'Awaiting admin review' }
      ];
    }
  },
  async reviewAvailability(availabilityId: number | null, classroom: string, status: string, notes = ''): Promise<any> {
    try {
      const res = await api.post('/admin/availability/review/', { availabilityId, classroom, status, notes });
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Forbidden: Admin access required.' };
    }
  },
  async getUsers(): Promise<any[]> {
    try {
      const res = await api.get('/admin/users/');
      return res.data;
    } catch {
      return [
        { id: 1, username: 'admin', email: 'admin@vitstudent.ac.in', fullName: 'VIT System Administrator', regNo: 'ADMIN001', programme: 'CampusOS Administration', yearSemester: 'Staff / Faculty', role: 'admin', isStaff: true, dateJoined: '2026-10-07' },
        { id: 2, username: '22BCE1024', email: 'chris.student2022@vitstudent.ac.in', fullName: 'Chris', regNo: '22BCE1024', programme: 'B.Tech Computer Science and Engineering', yearSemester: '3rd Year (Semester VI)', role: 'student', isStaff: false, dateJoined: '2026-10-07' },
        { id: 3, username: '23BCE0512', email: 'rahul.sharma2023@vitstudent.ac.in', fullName: 'Rahul Sharma', regNo: '23BCE0512', programme: 'B.Tech Computer Science and Engineering', yearSemester: '2nd Year (Semester IV)', role: 'student', isStaff: false, dateJoined: '2026-10-07' },
        { id: 4, username: '21BCE0199', email: 'ananya.patel2021@vitstudent.ac.in', fullName: 'Ananya Patel', regNo: '21BCE0199', programme: 'B.Tech Electronics and Communication Engineering', yearSemester: '4th Year (Semester VIII)', role: 'student', isStaff: false, dateJoined: '2026-10-07' },
      ];
    }
  },
  async getSlotClasses(slot = 'A1'): Promise<any> {
    try {
      const res = await api.get('/admin/slot-classes/', { params: { slot } });
      return res.data;
    } catch {
      return {
        slot,
        timing: 'MON 08:00 AM - 08:50 AM, WED 08:50 AM - 09:40 AM',
        total_classes: 3,
        total_students_enrolled: 205,
        total_capacity: 215,
        classes: [
          { course_code: 'CSE3001', course_name: 'Software Engineering', faculty: 'Dr. K. Senthil Kumar', venue: 'SJT-208', building: 'Silver Jubilee Tower', school: 'SCOPE', credits: 3, enrolled: 68, capacity: 70 },
          { course_code: 'ECE2002', course_name: 'Analog Electronic Circuits', faculty: 'Prof. M. Vijayalakshmi', venue: 'TT-412', building: 'Technology Tower', school: 'SENSE', credits: 3, enrolled: 65, capacity: 70 },
          { course_code: 'MAT2001', course_name: 'Differential and Difference Equations', faculty: 'Dr. P. Ramesh', venue: 'GDN-108', building: 'GD Naidu Block', school: 'SAS', credits: 4, enrolled: 72, capacity: 75 }
        ]
      };
    }
  },
  async getSlots(): Promise<string[]> {
    try {
      const res = await api.get('/admin/slots/');
      return res.data;
    } catch {
      return ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'L1+L2', 'L3+L4', 'L5+L6', 'L31+L32'];
    }
  },
  async deleteUser(userId: number | string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await api.delete(`/admin/users/${userId}/`);
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Failed to delete user.' };
    }
  },
  async getBuildings(): Promise<any[]> {
    try {
      const res = await api.get('/buildings/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((b: any) => ({
          id: `b_${b.code.toLowerCase()}`,
          name: b.name,
          code: b.code,
          lat: b.lat,
          lng: b.lng,
          totalFloors: b.totalFloors || b.total_floors || 1,
          roomsCount: b.roomsCount || b.rooms_count || 0,
        }));
      }
      return buildings;
    } catch {
      return buildings;
    }
  }
};

export const aiAssistantService = {
  async getStatus(): Promise<{ gemini_active: boolean; model: string; has_api_key: boolean; engine: string }> {
    try {
      const res = await api.get('/assistant/status/');
      return res.data;
    } catch {
      return {
        gemini_active: false,
        model: 'gemini-1.5-flash',
        has_api_key: false,
        engine: 'VIT Campus Knowledge Engine (Active Fallback)'
      };
    }
  },
  async configureKey(apiKey: string): Promise<{ gemini_active: boolean; model: string; has_api_key: boolean; engine: string }> {
    const res = await api.post('/assistant/configure/', { api_key: apiKey });
    return res.data;
  },
  async sendMessage(messageText: string): Promise<ChatMessage> {
    try {
      const res = await api.post('/assistant/chat/', { message: messageText }, { timeout: 45000 });
      return res.data;
    } catch (err) {
      console.warn('Backend assistant request fallback triggered:', err);
      return generateFallbackAiResponse(messageText);
    }
  }
};

function generateFallbackAiResponse(query: string): ChatMessage {
  const q = query.toLowerCase();
  let text = "I am VIT CampusOS Assistant. I can guide you through classrooms, locations, timings, and services at VIT Vellore.";
  let suggestedLocations: any[] = [];
  let quickActions: { label: string; action: string; payload?: string }[] = [];

  // 1. ACADEMIC BLOCKS & DEPARTMENTS
  if (q.includes('academic block') || q.includes('academic blocks') || q.includes('all blocks') || q.includes('campus blocks') || q.includes('list of blocks') || (q.includes('academic') && q.includes('block'))) {
    const ttUrl = '/map?destName=Technology%20Tower&lat=12.97120&lng=79.15930';
    const sjtUrl = '/map?destName=Silver%20Jubilee%20Tower&lat=12.97180&lng=79.16300';
    const prpUrl = '/map?destName=Pearl%20Research%20Park&lat=12.97350&lng=79.16420';

    text = "🏛️ **VIT Vellore Academic Blocks & Zones:**\n\n" +
           "### 1. Central Academic Zone\n" +
           "- **[📍 Technology Tower (TT)](/map?destName=Technology%20Tower&lat=12.97120&lng=79.15930)**: SELECT (Electrical), SENSE (Electronics), SAS (Advanced Sciences), Placement Cell, Dean Offices.\n" +
           "- **[📍 GD Naidu Block (GDN)](/map?destName=GD%20Naidu%20Block&lat=12.97020&lng=79.16010)**: SMEC (Mechanical), Civil Engineering, workshop bays, thermal labs.\n" +
           "- **[📍 Sir M. Visvesvaraya Block (SMV)](/map?destName=Sir%20M%20Visvesvaraya%20Block&lat=12.97080&lng=79.15980)**: SCHEME (Chemical Engineering) & instrumentation suites.\n" +
           "- **[📍 Periyar Central Library](/map?destName=Periyar%20EVR%20Central%20Library&lat=12.96990&lng=79.15780)**: 6-floor research library with digital suites.\n\n" +
           "### 2. Eastern Tech & Research Zone\n" +
           "- **[📍 Silver Jubilee Tower (SJT)](/map?destName=Silver%20Jubilee%20Tower&lat=12.97180&lng=79.16300)**: SCOPE (Computer Science), SITE (Information Tech), SCORE (Software Systems), AI labs & smart lecture halls.\n" +
           "- **[📍 Pearl Research Park (PRP)](/map?destName=Pearl%20Research%20Park&lat=12.97350&lng=79.16420)**: Advanced PG & PhD research complex, sponsored industry centers.\n" +
           "- **[📍 CDMM Building](/map?destName=CDMM%20Building&lat=12.97100&lng=79.16200)**: Centre for Disaster Mitigation & Management.\n" +
           "- **[📍 CBMR](/map?destName=CBMR&lat=12.97280&lng=79.16250)**: Centre for Biomaterials & Research, biotechnology labs.\n\n" +
           "### 3. Western Administrative & Academic Zone\n" +
           "- **[📍 Dr. M.G.R. Block (Main Building)](/map?destName=Main%20Building&lat=12.96960&lng=79.15590)**: Central administration, Chancellor/Registrar, SSL.\n" +
           "- **[📍 Gandhi Block](/map?destName=Gandhi%20Block&lat=12.96980&lng=79.15680)**: VIT Business School (VITBS).\n" +
           "- **[📍 Allana Block (ALM)](/map?destName=Allana%20Block&lat=12.96820&lng=79.15520)**: V-SPARC Architecture studios.";

    suggestedLocations = [
      { id: 'bld_tt', name: 'Technology Tower (TT)', category: 'Academic Building', latitude: 12.9712, longitude: 79.1593 },
      { id: 'bld_sjt', name: 'Silver Jubilee Tower (SJT)', category: 'Academic Building', latitude: 12.9718, longitude: 79.1630 },
      { id: 'bld_prp', name: 'Pearl Research Park (PRP)', category: 'Research Park', latitude: 12.9735, longitude: 79.1642 },
    ];
    quickActions = [
      { label: 'Navigate to TT', action: 'navigate', payload: ttUrl },
      { label: 'Navigate to SJT', action: 'navigate', payload: sjtUrl },
      { label: 'Navigate to PRP', action: 'navigate', payload: prpUrl },
      { label: 'Open Navigation Map', action: 'route', payload: '/map' }
    ];
  }

  // 2. PEARL RESEARCH PARK (PRP) / HOW TO REACH PRP
  else if (q.includes('prp') || q.includes('pearl research') || (q.includes('reach') && q.includes('prp'))) {
    const prpUrl = '/map?destName=Pearl%20Research%20Park&lat=12.97350&lng=79.16420';
    text = "🔬 **Pearl Research Park (PRP Block):**\n\n" +
           "Pearl Research Park is VIT's premier 8-storey advanced research and postgraduate facility.\n\n" +
           "📍 **Location & How to Reach:**\n" +
           "- **Zone**: Eastern Research Zone of campus.\n" +
           "- **From Silver Jubilee Tower (SJT)**: Walk northeast past CDMM and CBMR (~3 mins walk, 250m).\n" +
           "- **From Men's Hostels (MH)**: PRP is located right next to **MH-G, MH-H, MH-Q, and MH-R** blocks (~2-3 mins walk).\n" +
           "- **From Central Library / TT**: Walk east through the main walkway past Food Mall and SJT (~8-10 mins walk, 600m).\n\n" +
           `🗺️ **[📍 Start Walking Directions to PRP on Navigation Map](${prpUrl})**`;

    suggestedLocations = [{ id: 'bld_prp', name: 'Pearl Research Park (PRP)', category: 'Research Park', latitude: 12.9735, longitude: 79.1642, building: 'Pearl Research Park' }];
    quickActions = [
      { label: 'Start Route to PRP', action: 'navigate', payload: prpUrl },
      { label: 'Open Navigation Map', action: 'route', payload: '/map' }
    ];
  }

  // 3. PRINTING / XEROX QUERIES
  else if (q.includes('print') || q.includes('printer') || q.includes('xerox') || q.includes('photocopy') || q.includes('binding')) {
    const isSjt = q.includes('sjt') || q.includes('silver jubilee') || q.includes('mh-a') || q.includes('mh-b') || q.includes('mh-c') || q.includes('mh-d');
    const isTt = q.includes('tt') || q.includes('technology tower') || q.includes('mb') || q.includes('gdn') || q.includes('smv');
    const isPrp = q.includes('prp') || q.includes('pearl') || q.includes('mh-g') || q.includes('mh-h') || q.includes('mh-q') || q.includes('mh-r');
    const isLibrary = q.includes('library') || q.includes('food mall') || q.includes('lh');

    if (isSjt) {
      const sjtUrl = '/map?destName=SJT%20Ground%20Floor%20Xerox%20%26%20Stationery&lat=12.97180&lng=79.16300';
      text = "🖨️ Since you are near **SJT / Men's Hostels (MH-A to MH-D)**, the optimal printing shop is:\n\n" +
             "👉 **SJT Ground Floor Xerox & Stationery**\n" +
             "- **Location**: SJT Ground Floor SCOPE Lobby\n" +
             "- **Walking Time**: ~1 min walk (50m)\n" +
             "- **Hours**: 08:00 AM - 08:30 PM\n" +
             "- **Services**: B&W and color assignment printing, photocopying, spiral binding, stationery\n\n" +
             `🗺️ **[📍 Open in Navigation Map](${sjtUrl})** to start walking directions!`;
      suggestedLocations = [{ id: 'print_sjt', name: 'SJT Ground Floor Xerox', category: 'Printing & Xerox', latitude: 12.9718, longitude: 79.1630, building: 'Silver Jubilee Tower' }];
      quickActions = [
        { label: 'Navigate to SJT Print', action: 'navigate', payload: sjtUrl },
        { label: 'Open Navigation Map', action: 'route', payload: '/map' }
      ];
    } else if (isTt) {
      const ttUrl = '/map?destName=TT%20Express%20Printing%20%26%20Binding%20Cell&lat=12.97120&lng=79.15930';
      text = "🖨️ Since you are near **TT / GDN / Main Building**, the optimal printing shop is:\n\n" +
             "👉 **TT Express Printing & Binding Cell**\n" +
             "- **Location**: Technology Tower Ground Floor Room 004\n" +
             "- **Walking Time**: ~1-2 min walk (80m)\n" +
             "- **Hours**: 08:30 AM - 07:00 PM\n" +
             "- **Services**: High-speed laser printing, plotters for engineering CAD drawings, thesis hard binding\n\n" +
             `🗺️ **[📍 Open in Navigation Map](${ttUrl})** to start walking directions!`;
      suggestedLocations = [{ id: 'print_tt', name: 'TT Express Printing (TT-004)', category: 'Printing & Xerox', latitude: 12.9712, longitude: 79.1593, building: 'Technology Tower' }];
      quickActions = [
        { label: 'Navigate to TT Print', action: 'navigate', payload: ttUrl },
        { label: 'Open Navigation Map', action: 'route', payload: '/map' }
      ];
    } else if (isPrp) {
      const prpUrl = '/map?destName=PRP%20Photocopy%20%26%20Document%20Cell&lat=12.97350&lng=79.16420';
      text = "🖨️ Since you are near **Pearl Research Park / MH-G to MH-T**, the optimal printing shop is:\n\n" +
             "👉 **PRP Photocopy & Document Cell**\n" +
             "- **Location**: Pearl Research Park (PRP Block) Ground Floor\n" +
             "- **Hours**: 09:00 AM - 06:00 PM\n" +
             "- **Services**: Research poster printing, project printouts, spiral binding\n\n" +
             `🗺️ **[📍 Open in Navigation Map](${prpUrl})**`;
      suggestedLocations = [{ id: 'print_prp', name: 'PRP Photocopy Cell', category: 'Printing & Xerox', latitude: 12.9735, longitude: 79.1642, building: 'Pearl Research Park' }];
      quickActions = [{ label: 'Navigate to PRP Print', action: 'navigate', payload: prpUrl }];
    } else if (isLibrary) {
      const fmUrl = '/map?destName=Food%20Mall%20First%20Floor%20Printing%20Centre&lat=12.97050&lng=79.15720';
      text = "🖨️ Since you are near **Central Library / Food Mall / Ladies' Hostels**, the optimal printing shop is:\n\n" +
             "👉 **Food Mall First Floor Printing Centre**\n" +
             "- **Location**: Central Food Mall 1st Floor near Library Junction\n" +
             "- **Hours**: 08:30 AM - 09:30 PM\n" +
             "- **Services**: Record sheet copying, assignment printouts, project binding\n\n" +
             `🗺️ **[📍 Open in Navigation Map](${fmUrl})**`;
      suggestedLocations = [{ id: 'print_fm', name: 'Food Mall Printing Centre', category: 'Printing & Xerox', latitude: 12.9705, longitude: 79.1572, building: 'Food Mall' }];
      quickActions = [{ label: 'Navigate to Food Mall Print', action: 'navigate', payload: fmUrl }];
    } else {
      const ttUrl = '/map?destName=TT%20Express%20Printing%20%26%20Binding%20Cell&lat=12.97120&lng=79.15930';
      const sjtUrl = '/map?destName=SJT%20Ground%20Floor%20Xerox%20%26%20Stationery&lat=12.97180&lng=79.16300';
      const fmUrl = '/map?destName=Food%20Mall%20First%20Floor%20Printing%20Centre&lat=12.97050&lng=79.15720';
      const prpUrl = '/map?destName=PRP%20Photocopy%20%26%20Document%20Cell&lat=12.97350&lng=79.16420';

      text = "🖨️ **Campus Printing & Xerox Shops:**\n\n" +
             "Here are the primary express printing cells at VIT Vellore:\n" +
             `1. **[TT Express Printing (TT-004)](${ttUrl})** — Best near **TT, SMV, GDN, Main Building**\n` +
             `2. **[SJT Ground Floor Xerox](${sjtUrl})** — Best near **SJT, CBMR, CDMM, MH-A to MH-F**\n` +
             `3. **[Food Mall Printing Centre](${fmUrl})** — Best near **Central Library & Ladies' Hostels**\n` +
             `4. **[PRP Document Cell](${prpUrl})** — Best near **PRP Block & Men's Hostels MH-G to MH-T**\n\n` +
             "📍 **Which block or hostel are you currently close to?**\n" +
             "Tap a button below or tell me your location so I can calculate your closest printer!";

      suggestedLocations = [
        { id: 'print_tt', name: 'TT Express Printing (TT-004)', category: 'Printing & Xerox', latitude: 12.9712, longitude: 79.1593, building: 'Technology Tower' },
        { id: 'print_sjt', name: 'SJT Ground Floor Xerox', category: 'Printing & Xerox', latitude: 12.9718, longitude: 79.1630, building: 'Silver Jubilee Tower' },
        { id: 'print_fm', name: 'Food Mall Printing Centre', category: 'Printing & Xerox', latitude: 12.9705, longitude: 79.1572, building: 'Food Mall' },
      ];

      quickActions = [
        { label: "I'm near TT", action: 'send', payload: "I am near TT, where is the closest printer?" },
        { label: "I'm near SJT", action: 'send', payload: "I am near SJT, where is the closest printer?" },
        { label: "I'm near Library", action: 'send', payload: "I am near Library, where is the closest printer?" },
        { label: "I'm at Men's Hostel", action: 'send', payload: "I am at Men's Hostel MH-D, where is the closest printer?" },
        { label: "I'm at Ladies' Hostel", action: 'send', payload: "I am at Ladies' Hostel LH-C, where is the closest printer?" },
      ];
    }
  }

  // 4. MEDICAL & HEALTH CENTRE & AMBULANCE
  else if (q.includes('medical') || q.includes('doctor') || q.includes('health') || q.includes('ambulance') || q.includes('hospital') || q.includes('sick') || q.includes('fever')) {
    const medUrl = '/map?destName=VIT%20Health%20%26%20Medical%20Centre&lat=12.96810&lng=79.15520';
    text = "🏥 **VIT Health & Medical Centre (24/7):**\n\n" +
           "- **Location**: Near Main Gate & Sports Complex [12.9681, 79.1552]\n" +
           "- **Emergency Intercom**: Ext `2111` / Phone: `0416-2202111`\n" +
           "- **Inpatient Beds & Doctors**: Resident medical officers on duty round the clock.\n\n" +
           "🚨 **HOSTELLER EMERGENCY PROTOCOL**:\n" +
           "If you reside in **Men's Hostels (MH)** or **Ladies' Hostels (LH)** and feel unwell, **YOU DO NOT NEED TO WALK TO THE MAIN GATE**!\n" +
           "- Contact your **Hostel Warden's Room or Security Desk on the Ground Floor**.\n" +
           "- They will dispatch a campus ambulance directly to your block entrance to transport you safely to the Health Centre.\n\n" +
           `🗺️ **[📍 Open Health Centre in Navigation Map](${medUrl})**`;

    suggestedLocations = [{ id: 'med_centre', name: 'VIT Health & Medical Centre', category: 'Medical Services', latitude: 12.9681, longitude: 79.1552, building: 'Main Gate Annex' }];
    quickActions = [
      { label: 'Navigate to Medical Centre', action: 'navigate', payload: medUrl },
      { label: 'Call Emergency Ext 2111', action: 'route', payload: 'tel:04162202111' },
      { label: 'Open Navigation Map', action: 'route', payload: '/map' }
    ];
  }

  // 5. FOOD / CANTEENS / DINING
  else if (q.includes('food') || q.includes('canteen') || q.includes('eat') || q.includes('lunch') || q.includes('dinner') || q.includes('breakfast') || q.includes('darling') || q.includes('woodys') || q.includes('gazebo')) {
    const fmUrl = '/map?destName=Central%20Food%20Mall&lat=12.97050&lng=79.15720';
    text = "🍔 **Dining Hubs & Food Courts at VIT Vellore:**\n\n" +
           "- **[📍 Central Food Mall](/map?destName=Central%20Food%20Mall&lat=12.97050&lng=79.15720)**: Domino's Pizza, DC, fresh juice bars, bakery, and multicuisine cafeteria.\n" +
           "- **[📍 SJT Food Court](/map?destName=Silver%20Jubilee%20Tower&lat=12.97180&lng=79.16300)**: Quick lunch boxes, sandwiches, fresh juice, and coffee.\n" +
           "- **Darling Food Court**: Multi-cuisine Indian fast food and snacks near Main Building.\n" +
           "- **Gazebo**: Open-air student cafe near Main Building circle.\n" +
           "- **Hostel Night Canteens**: Located in MH and LH blocks, open until 12:30 AM for midnight snacks.";

    quickActions = [
      { label: 'Navigate to Food Mall', action: 'navigate', payload: fmUrl },
      { label: 'Open Navigation Map', action: 'route', payload: '/map' }
    ];
  }

  // 6. ATMS & BANKING
  else if (q.includes('atm') || q.includes('bank') || q.includes('cash') || q.includes('sbi') || q.includes('indian bank')) {
    const sbiUrl = '/map?destName=SBI%20Bank%20%26%20ATM&lat=12.96980&lng=79.15650';
    text = "🏧 **Banking & ATMs on Campus:**\n\n" +
           "- **[📍 State Bank of India (SBI) & ATM](/map?destName=SBI%20Bank%20%26%20ATM&lat=12.96980&lng=79.15650)**: Full-service bank branch & 4 ATMs near Main Building.\n" +
           "- **[📍 Indian Bank & ATM](/map?destName=Indian%20Bank%20%26%20ATM&lat=12.97120&lng=79.15930)**: Located under Technology Tower (TT) arcade.\n" +
           "- **Hostel ATMs**: Indian Bank ATMs located near Men's Hostel MH-D and LH Main Gate.";

    quickActions = [
      { label: 'Navigate to SBI Branch', action: 'navigate', payload: sbiUrl },
      { label: 'Open Navigation Map', action: 'route', payload: '/map' }
    ];
  }

  // 7. SPECIFIC CLASSROOM (e.g. TT-624, SJT-302)
  else if (q.includes('tt-624') || (q.includes('tt') && q.includes('624'))) {
    const mapUrl = '/map?destName=TT-624&lat=12.97120&lng=79.15930&loc=Technology%20Tower';
    text = "📍 **TT-624** is located on the **6th Floor of Technology Tower (TT)**.\n\n" +
           "- **Facilities**: Dual projectors, central AC, and smart boards\n" +
           "- **Walking Distance**: ~8 mins (450m) from Central Library\n\n" +
           `🗺️ **[📍 Open in Navigation Map](${mapUrl})**`;
    suggestedLocations = [{ id: 'tt_624', name: 'TT-624 (Technology Tower)', category: 'Academic Classroom', latitude: 12.9712, longitude: 79.1593, building: 'Technology Tower' }];
    quickActions = [{ label: 'Navigate to TT-624', action: 'navigate', payload: mapUrl }];
  }

  // 8. SJT / SILVER JUBILEE TOWER
  else if (q.includes('sjt') || q.includes('silver jubilee')) {
    const sjtUrl = '/map?destName=Silver%20Jubilee%20Tower%20(SJT)&lat=12.97180&lng=79.16300';
    text = "🏢 **Silver Jubilee Tower (SJT):**\n\n" +
           "SJT is the 8-storey computing and IT hub of VIT Vellore:\n" +
           "- **Schools**: SCOPE (Computer Science & Engineering), SITE (Information Tech), SCORE.\n" +
           "- **Facilities**: Smart classrooms, advanced GPU/AI research labs, faculty cabins, SJT Food Court.\n" +
           "- **Location**: Eastern Zone, 2 mins walk from Men's Hostels MH-A to MH-D.\n\n" +
           `🗺️ **[📍 Open in Navigation Map](${sjtUrl})**`;
    suggestedLocations = [{ id: 'sjt_bld', name: 'Silver Jubilee Tower (SJT)', category: 'Academic Buildings', latitude: 12.9718, longitude: 79.1630, building: 'Silver Jubilee Tower' }];
    quickActions = [
      { label: 'Navigate to SJT', action: 'navigate', payload: sjtUrl },
      { label: 'Open Navigation Map', action: 'route', payload: '/map' }
    ];
  }

  // 9. EMPTY CLASSROOMS
  else if (q.includes('classroom') && (q.includes('free') || q.includes('empty') || q.includes('available'))) {
    text = "🏫 **Classrooms currently free for study:**\n\n" +
           "- **TT-624** (70 capacity, available until 01:00 PM)\n" +
           "- **SJT-302** (60 capacity, available until 02:30 PM)\n" +
           "- **GDN-108** (55 capacity, available until 12:45 PM)\n\n" +
           "You can book or explore real-time availability on the Classroom Finder.";
    quickActions = [{ label: 'View Empty Classroom Finder', action: 'route', payload: '/classrooms' }];
  }

  // 10. TIMETABLE
  else if (q.includes('next class') || q.includes('my class')) {
    const nextClass = studentTimetable.find(t => t.isNext) || studentTimetable[0];
    const mapUrl = `/map?destName=${encodeURIComponent(nextClass.roomNumber)}&lat=12.97120&lng=79.15930`;
    text = `📚 Your next class is **${nextClass.courseCode} - ${nextClass.courseName}** in **${nextClass.roomNumber}** at **${nextClass.startTime}**. Walking time is approx. **${nextClass.walkingTimeMinutes} mins**.\n\n` +
           `🗺️ **[📍 Open in Navigation Map](${mapUrl})**`;
    suggestedLocations = [{ id: 'next_room', name: nextClass.roomNumber, category: 'Classroom', latitude: 12.9712, longitude: 79.1593, building: nextClass.buildingCode }];
    quickActions = [{ label: `Navigate to ${nextClass.roomNumber}`, action: 'navigate', payload: mapUrl }];
  }

  // 11. 9-POINTER ATTENDANCE & ACADEMIC POLICIES
  else if (q.includes('9 pointer') || q.includes('9-pointer') || q.includes('attendance') || q.includes('ffcs')) {
    text = "📋 **Key VIT Vellore Academic Policies:**\n\n" +
           "- **9-Pointer Rule**: Students with CGPA >= 9.00 receive 100% attendance relaxation (no mandatory 75% cutoff; cannot receive 'N' grade debarment).\n" +
           "- **Standard Attendance**: 75% minimum mandatory attendance for CGPA < 9.0 to be eligible for FAT exams.\n" +
           "- **FFCS**: Fully Flexible Credit System lets you choose your own slots, subjects, and faculty on VTOP.";
    quickActions = [
      { label: 'View Timetable', action: 'route', payload: '/timetable' },
      { label: 'Open Navigation Map', action: 'route', payload: '/map' }
    ];
  }

  // 12. GENERAL CONTEXTUAL CAMPUS GUIDANCE (NO HARDCODED XEROX JUNK)
  else {
    text = `I searched the **VIT Vellore Campus Directory** for "${query}".\n\n` +
           "I can guide you to any academic building (e.g. **TT**, **SJT**, **PRP**, **GDN**), " +
           "classroom locations, campus dining, hostels, or 24/7 Medical Centre.\n\n" +
           "Try asking:\n" +
           "- *\"What are all the academic blocks?\"*\n" +
           "- *\"How to reach Pearl Research Park (PRP)?\"*\n" +
           "- *\"Where is the Medical Centre and how do hostellers call an ambulance?\"*";
    quickActions = [
      {'label': 'Academic Blocks', 'action': 'send', 'payload': 'What are all the academic blocks?'},
      {'label': 'How to reach PRP', 'action': 'send', 'payload': 'How to reach PRP?'},
      {'label': 'Explore Interactive Map', 'action': 'route', 'payload': '/map'},
      {'label': 'Open Directory', 'action': 'route', 'payload': '/directory'}
    ];
  }

  return {
    id: `msg_${Date.now()}`,
    sender: 'assistant',
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedLocations,
    quickActions
  };
}
