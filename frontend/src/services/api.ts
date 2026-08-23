import axios from 'axios';
import { campusLocations, emptyClassrooms, studentTimetable, lostItemsList, directoryEntries, notificationsList } from '../data/mockData';
import type { CampusLocation, Room, TimetableEntry, LostItem, DirectoryEntry, NotificationItem, ChatMessage, User } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
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
        avatar: u.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        savedLocationIds: u.profile?.saved_locations || ['loc_tt', 'loc_lib'],
        recentSearches: u.profile?.recent_searches || ['TT-624', 'Periyar Library'],
        role: (u.isStaff === true || u.is_staff === true) ? 'admin' : 'student'
      };
      return { user: userObj, token: res.data.token };
    } catch {
      // Demo Fallback Users
      let userObj: User = {
        id: 'usr_1024',
        name: 'Chris',
        regNo: '22BCE1024',
        program: 'B.Tech Computer Science and Engineering',
        school: 'SCOPE (School of Computer Science and Engineering)',
        year: '3rd Year (Semester VI)',
        email: 'chris.student2022@vitstudent.ac.in',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        savedLocationIds: ['loc_tt', 'loc_lib', 'loc_med'],
        recentSearches: ['TT-624', 'Periyar Library', 'Medical Centre'],
        role: 'student'
      };

      if (identifier.includes('23BCE0512') || identifier.toLowerCase().includes('rahul')) {
        userObj = {
          id: 'usr_0512',
          name: 'Rahul Sharma',
          regNo: '23BCE0512',
          program: 'B.Tech Computer Science and Engineering (Data Science)',
          school: 'SCOPE (School of Computer Science and Engineering)',
          year: '2nd Year (Semester IV)',
          email: 'rahul.sharma2023@vitstudent.ac.in',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
          savedLocationIds: ['loc_sjt', 'loc_fc'],
          recentSearches: ['SJT-302', 'Food Mall', 'Medical Centre'],
          role: 'student'
        };
      } else if (identifier.includes('21BCE0199') || identifier.toLowerCase().includes('ananya')) {
        userObj = {
          id: 'usr_0199',
          name: 'Ananya Patel',
          regNo: '21BCE0199',
          program: 'B.Tech Electronics and Communication Engineering',
          school: 'SENSE (School of Electronics Engineering)',
          year: '4th Year (Semester VIII)',
          email: 'ananya.patel2021@vitstudent.ac.in',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
          savedLocationIds: ['loc_tt', 'loc_med'],
          recentSearches: ['TT-412', 'SENSE Lab'],
          role: 'student'
        };
      } else if (identifier.includes('admin')) {
        userObj.role = 'admin';
        userObj.name = 'Staff Admin';
      }

      return { user: userObj, token: `vitos_token_demo_${userObj.regNo}` };
    }
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
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        savedLocationIds: ['loc_tt', 'loc_lib'],
        recentSearches: ['TT-624', 'Periyar Library'],
        role: 'student'
      };
      return { user: userObj, token: res.data.token };
    } catch {
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: data.fullName,
        regNo: data.regNo,
        program: data.programme,
        school: 'SCOPE (School of Computer Science and Engineering)',
        year: data.yearSemester,
        email: data.email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        savedLocationIds: ['loc_tt', 'loc_lib'],
        recentSearches: ['TT-624', 'Central Library'],
        role: 'student'
      };
      return { user: newUser, token: `vitos_token_${data.regNo}` };
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
      return res.data;
    } catch {
      return studentTimetable;
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
  async getEntries(): Promise<DirectoryEntry[]> {
    try {
      const res = await api.get('/directory/');
      return res.data;
    } catch {
      return directoryEntries;
    }
  }
};

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await api.get('/notifications/');
      return res.data;
    } catch {
      return notificationsList;
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
  async calculateRoute(source: string, destination: string): Promise<any> {
    try {
      const res = await api.post('/locations/navigate/', { source, destination });
      return res.data;
    } catch (err: any) {
      return {
        source,
        destination,
        distanceMeters: 650,
        estimatedMinutes: 8,
        path: ['MAIN_GATE', 'LIBRARY_JUNCTION', 'NORTH_JUNCTION', 'SJT_GATE', 'SJT']
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
  }
};

export const aiAssistantService = {
  async sendMessage(messageText: string): Promise<ChatMessage> {
    try {
      const res = await api.post('/assistant/chat/', { message: messageText });
      return res.data;
    } catch {
      return generateFallbackAiResponse(messageText);
    }
  }
};

function generateFallbackAiResponse(query: string): ChatMessage {
  const q = query.toLowerCase();
  let text = "I am VIT CampusOS Assistant. I can guide you through classrooms, locations, timings, and services at VIT Vellore.";
  let suggestedLocations: CampusLocation[] = [];
  let quickActions: { label: string; action: string; payload?: string }[] = [];

  if (q.includes('tt-624') || (q.includes('tt') && q.includes('624'))) {
    const ttLoc = campusLocations.find(l => l.code === 'TT');
    text = "📍 **TT-624** is located on the **6th Floor of Technology Tower (TT)**. It is equipped with dual projectors, central AC, and smart boards. Walking distance from Central Library is approx. **8 mins (450m)**.";
    if (ttLoc) suggestedLocations = [ttLoc];
    quickActions = [{ label: 'Navigate to TT-624', action: 'navigate', payload: 'TT' }];
  } else if (q.includes('medical') || q.includes('doctor') || q.includes('health')) {
    const medLoc = campusLocations.find(l => l.code === 'MED');
    text = "🏥 **VIT Health & Medical Centre** is open 24/7. It is located near the Main Gate and Sports Complex.";
    if (medLoc) suggestedLocations = [medLoc];
    quickActions = [{ label: 'Navigate to Medical Centre', action: 'navigate', payload: 'MED' }];
  } else if (q.includes('sjt') || q.includes('silver jubilee')) {
    const sjtLoc = campusLocations.find(l => l.code === 'SJT');
    text = "🏢 **Silver Jubilee Tower (SJT)** is an 8-storey academic building housing SCOPE faculty offices, modern computer labs, and project suites.";
    if (sjtLoc) suggestedLocations = [sjtLoc];
    quickActions = [{ label: 'Navigate to SJT', action: 'navigate', payload: 'SJT' }];
  } else if (q.includes('printer') || q.includes('print')) {
    const printLoc = campusLocations.find(l => l.code === 'PRINT_TT');
    text = "🖨️ The nearest printing facility is **TT Ground Floor Express Printing (TT-004)**.";
    if (printLoc) suggestedLocations = [printLoc];
    quickActions = [{ label: 'Navigate to Printing Shop', action: 'navigate', payload: 'PRINT_TT' }];
  } else if (q.includes('classroom') && (q.includes('free') || q.includes('empty') || q.includes('available'))) {
    text = "🏫 Classrooms currently free for study:\n- **TT-624** (70 capacity, available until 12:00 PM)\n- **SJT-302** (60 capacity, available until 01:30 PM)";
    quickActions = [{ label: 'View Empty Classroom Finder', action: 'route', payload: '/classrooms' }];
  } else if (q.includes('next class') || q.includes('my class')) {
    const nextClass = studentTimetable.find(t => t.isNext) || studentTimetable[0];
    text = `📚 Your next class is **${nextClass.courseCode} - ${nextClass.courseName}** in **${nextClass.roomNumber}** at **${nextClass.startTime}**. Walking time is approx. **${nextClass.walkingTimeMinutes} mins**. You are currently ~650m away.`;
    quickActions = [{ label: `Navigate to ${nextClass.roomNumber}`, action: 'navigate', payload: nextClass.buildingCode }];
  } else {
    text = `I searched VIT Vellore records for "${query}". You can use the map search, view available classrooms, or explore the directory.`;
    quickActions = [
      { label: 'Explore Interactive Map', action: 'route', payload: '/map' },
      { label: 'Open Directory', action: 'route', payload: '/directory' }
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
