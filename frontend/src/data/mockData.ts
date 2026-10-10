import type { CampusLocation, Building, Room, TimetableEntry, LostItem, DirectoryEntry, NotificationItem, User } from '../types';

export const currentUser: User = {
  id: 'usr_1024',
  name: 'Chris',
  regNo: '22BCE1024',
  program: 'B.Tech Computer Science and Engineering',
  school: 'SCOPE (School of Computer Science and Engineering)',
  year: '3rd Year (Semester VI)',
  email: 'chris.student2022@vitstudent.ac.in',
  avatar: '/default-avatar.png',
  savedLocationIds: ['loc_tt', 'loc_lib', 'loc_med'],
  recentSearches: ['TT-624', 'Periyar Library', 'Medical Centre', 'SJT 3rd Floor', 'Food Mall'],
  role: 'student'
};

export const campusLocations: CampusLocation[] = [
  {
    id: 'loc_tt',
    name: 'Technology Tower (TT)',
    code: 'TT',
    category: 'academic',
    lat: 12.9712,
    lng: 79.1593,
    description: '7-storey flagship academic building housing CSE & ECE classrooms, advanced research labs, and faculty offices.',
    building: 'Technology Tower',
    facilities: ['Wi-Fi', 'Elevator', 'Central AC', 'Smart Boards', 'Water Cooler', 'Restrooms'],
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=600',
    openingHours: '08:00 AM - 07:30 PM',
    isSaved: true
  },
  {
    id: 'loc_sjt',
    name: 'Silver Jubilee Tower (SJT)',
    code: 'SJT',
    category: 'academic',
    lat: 12.9718,
    lng: 79.1633,
    description: 'State-of-the-art 8-floor academic block for SCOPE, modern computer labs, and project demonstration halls.',
    building: 'Silver Jubilee Tower',
    facilities: ['High-speed Fiber', 'Elevators', 'Auditorium', 'Printers', 'Cafeteria Ground Floor'],
    image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=600',
    openingHours: '08:00 AM - 08:00 PM',
    isSaved: false
  },
  {
    id: 'loc_mb',
    name: 'Main Building (MB)',
    code: 'MB',
    category: 'service',
    lat: 12.9696,
    lng: 79.1559,
    description: 'Administrative central hub housing the Chancellor Office, Admissions, Student Welfare, Examination Cell, and Registrar.',
    building: 'Main Building',
    facilities: ['Helpdesk', 'Admissions Cell', 'Finance Desk', 'ATM'],
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600',
    openingHours: '09:00 AM - 05:30 PM',
    isSaved: false
  },
  {
    id: 'loc_lib',
    name: 'Periyar E.V.R. Central Library',
    code: 'LIB',
    category: 'facility',
    lat: 12.9699,
    lng: 79.1578,
    description: '6-floor central library with over 300,000 volumes, e-journals, digital reading rooms, and quiet study pods.',
    building: 'Central Library',
    facilities: ['Quiet Zones', 'Digital Kiosks', 'Discussion Rooms', 'AC', 'Book Return Kiosk'],
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=600',
    openingHours: '08:00 AM - 12:00 Midnight',
    isSaved: true
  },
  {
    id: 'loc_med',
    name: 'VIT Health & Medical Centre',
    code: 'MED',
    category: 'service',
    lat: 12.9680,
    lng: 79.1550,
    description: '24/7 medical facility with resident doctors, emergency trauma desk, ambulance service, and pharmacy.',
    building: 'Medical Centre',
    facilities: ['24/7 Emergency', 'Ambulance', 'Pharmacy', 'Inpatient Wards', 'Physiotherapy'],
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600',
    openingHours: 'Open 24/7',
    isSaved: true
  },
  {
    id: 'loc_fc',
    name: 'VIT Central Food Mall',
    code: 'FC',
    category: 'dining',
    lat: 12.9705,
    lng: 79.1605,
    description: 'Multi-cuisine dining food court featuring Dominoes, Subway, North & South Indian stalls, fresh juice bars.',
    building: 'Food Mall',
    facilities: ['Seating 800+', 'UPI Payment', 'Air Conditioned Section', 'Juice Bar'],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600',
    openingHours: '09:00 AM - 10:30 PM',
    isSaved: false
  },
  {
    id: 'loc_print',
    name: 'TT Ground Floor Express Printing',
    code: 'PRINT_TT',
    category: 'utility',
    lat: 12.9710,
    lng: 79.1591,
    description: 'High-volume document printing, project report binding, lamination, and stationery supplies shop.',
    building: 'Technology Tower',
    facilities: ['Color Printing', 'Hard Binding', 'Stationery', 'Online File Upload Desk'],
    openingHours: '08:30 AM - 07:00 PM',
    isSaved: false
  },
  {
    id: 'loc_atm_sbi',
    name: 'SBI & Indian Bank ATM Hub',
    code: 'ATM_MB',
    category: 'utility',
    lat: 12.9688,
    lng: 79.1552,
    description: '24/7 ATM kiosks near VIT Main Gate with cash deposit and passbook updating machines.',
    building: 'Main Gate Complex',
    facilities: ['24/7 ATM', 'Cash Recycler', 'Passbook Printer'],
    openingHours: 'Open 24/7',
    isSaved: false
  },
  {
    id: 'loc_mh_b',
    name: "Men's Hostel B-Block",
    code: 'MH-B',
    category: 'hostel',
    lat: 12.9725,
    lng: 79.1570,
    description: "Men's hostel block with single & double occupancy rooms, badminton court, and mess dining hall.",
    building: 'MH Block B',
    facilities: ['Mess Hall', 'Laundry Desk', 'Badminton Court', 'Night Canteen'],
    openingHours: 'Hostel Gates close at 09:00 PM',
    isSaved: false
  },
  {
    id: 'loc_lh_a',
    name: "Ladies' Hostel A-Block",
    code: 'LH-A',
    category: 'hostel',
    lat: 12.9675,
    lng: 79.1590,
    description: "Ladies' residential block with attached mess hall, study lounges, security desk, and gym access.",
    building: 'LH Block A',
    facilities: ['Mess', 'Indoor Gym', 'Study Room', 'Security Guard 24/7'],
    openingHours: 'Hostel Gates close at 08:30 PM',
    isSaved: false
  }
];

export const buildings: Building[] = [
  { id: 'b_tt', name: 'Technology Tower', code: 'TT', lat: 12.9712, lng: 79.1593, totalFloors: 7, roomsCount: 140 },
  { id: 'b_sjt', name: 'Silver Jubilee Tower', code: 'SJT', lat: 12.9718, lng: 79.1633, totalFloors: 8, roomsCount: 180 },
  { id: 'b_smv', name: 'Sir M. Visvesvaraya Block', code: 'SMV', lat: 12.9708, lng: 79.1582, totalFloors: 6, roomsCount: 90 },
  { id: 'b_mgb', name: 'Mahatma Gandhi Block (MGB)', code: 'MGB', lat: 12.9734, lng: 79.1610, totalFloors: 5, roomsCount: 75 },
  { id: 'b_mb', name: 'Main Building', code: 'MB', lat: 12.9696, lng: 79.1559, totalFloors: 4, roomsCount: 65 },
  { id: 'b_lib', name: 'Central Library', code: 'LIB', lat: 12.9699, lng: 79.1578, totalFloors: 6, roomsCount: 24 }
];

export const emptyClassrooms: Room[] = [
  {
    id: 'r_tt624',
    roomNumber: 'TT-624',
    buildingCode: 'TT',
    buildingName: 'Technology Tower',
    floor: 6,
    capacity: 70,
    availabilityStatus: 'available',
    availableUntil: '12:00 PM (Next: SWE Lab at 12:15 PM)',
    facilities: ['Projector', 'Smart Board', 'Central AC', '60 Power Sockets', 'Wi-Fi Access Point'],
    currentCourse: 'Free Slot'
  },
  {
    id: 'r_tt412',
    roomNumber: 'TT-412',
    buildingCode: 'TT',
    buildingName: 'Technology Tower',
    floor: 4,
    capacity: 85,
    availabilityStatus: 'available',
    availableUntil: '02:00 PM',
    facilities: ['Dual Projectors', 'Podium Mic', 'AC', 'Elevator Access'],
    currentCourse: 'Free Slot'
  },
  {
    id: 'r_sjt302',
    roomNumber: 'SJT-302',
    buildingCode: 'SJT',
    buildingName: 'Silver Jubilee Tower',
    floor: 3,
    capacity: 60,
    availabilityStatus: 'available',
    availableUntil: '01:30 PM',
    facilities: ['Projector', 'LAN Outlets', 'AC', 'Whiteboard'],
    currentCourse: 'Free Slot'
  },
  {
    id: 'r_sjt515',
    roomNumber: 'SJT-515',
    buildingCode: 'SJT',
    buildingName: 'Silver Jubilee Tower',
    floor: 5,
    capacity: 100,
    availabilityStatus: 'available',
    availableUntil: '03:00 PM',
    facilities: ['Tiered Gallery Seating', 'Surround Audio', 'Dual Screens', 'AC'],
    currentCourse: 'Free Slot'
  },
  {
    id: 'r_mb112',
    roomNumber: 'MB-112',
    buildingCode: 'MB',
    buildingName: 'Main Building',
    floor: 1,
    capacity: 50,
    availabilityStatus: 'available',
    availableUntil: '11:30 AM',
    facilities: ['Projector', 'Natural Light', 'AC'],
    currentCourse: 'Free Slot'
  },
  {
    id: 'r_sjt210',
    roomNumber: 'SJT-210',
    buildingCode: 'SJT',
    buildingName: 'Silver Jubilee Tower',
    floor: 2,
    capacity: 75,
    availabilityStatus: 'occupied',
    availableUntil: 'Currently Occupied (Class till 11:00 AM)',
    facilities: ['Projector', 'AC'],
    currentCourse: 'Database Systems (CSE3001)'
  }
];

export const studentTimetable: TimetableEntry[] = [
  {
    id: 'tt_1',
    day: 'Friday',
    startTime: '10:00 AM',
    endTime: '10:50 AM',
    courseCode: 'CSE3001',
    courseName: 'Software Engineering',
    faculty: 'Dr. R. Selvaraj',
    roomNumber: 'TT-624',
    buildingCode: 'TT',
    buildingName: 'Technology Tower',
    walkingTimeMinutes: 8,
    isNext: true
  },
  {
    id: 'tt_2',
    day: 'Friday',
    startTime: '11:00 AM',
    endTime: '11:50 AM',
    courseCode: 'CSE3002',
    courseName: 'Artificial Intelligence & Machine Learning',
    faculty: 'Prof. K. Meenakshi',
    roomNumber: 'SJT-302',
    buildingCode: 'SJT',
    buildingName: 'Silver Jubilee Tower',
    walkingTimeMinutes: 12,
    isNext: false
  },
  {
    id: 'tt_3',
    day: 'Friday',
    startTime: '02:00 PM',
    endTime: '03:40 PM',
    courseCode: 'CSE3001-LAB',
    courseName: 'Software Engineering Lab (DevOps & CI/CD)',
    faculty: 'Dr. R. Selvaraj',
    roomNumber: 'SJT-618',
    buildingCode: 'SJT',
    buildingName: 'Silver Jubilee Tower',
    walkingTimeMinutes: 12,
    isNext: false
  },
  {
    id: 'tt_4',
    day: 'Friday',
    startTime: '04:00 PM',
    endTime: '04:50 PM',
    courseCode: 'MAT2002',
    courseName: 'Applications of Differential Equations',
    faculty: 'Dr. V. Anand',
    roomNumber: 'TT-412',
    buildingCode: 'TT',
    buildingName: 'Technology Tower',
    walkingTimeMinutes: 8,
    isNext: false
  }
];

export const lostItemsList: LostItem[] = [
  {
    id: 'item_1',
    type: 'lost',
    title: 'VIT Student ID Card',
    category: 'ID Card',
    locationName: 'Near Periyar Library Staircase',
    dateReported: '2026-08-20',
    description: 'Red lanyard with VIT student ID card in transparent holder. Lost near library entrance around 4 PM.',
    contactName: 'Chris',
    contactEmail: 'chris.student2022@vitstudent.ac.in',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
    status: 'active'
  },
  {
    id: 'item_2',
    type: 'found',
    title: 'Casio Scientific Calculator FX-991EX',
    category: 'Calculator',
    locationName: 'TT-624 Desk 3B',
    dateReported: '2026-08-21',
    description: 'Black Casio scientific calculator found on desk after 9 AM Software Engineering class. Handed to TT security desk.',
    contactName: 'Security Desk TT',
    contactEmail: 'security.tt@vit.ac.in',
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=400',
    status: 'active'
  },
  {
    id: 'item_3',
    type: 'found',
    title: 'Apple AirPods Pro 2 (White Case with Spigen Cover)',
    category: 'Electronics',
    locationName: 'Food Mall Central Seating Area',
    dateReported: '2026-08-20',
    description: 'Found white AirPods charging case with dark grey silicone Spigen protective cover. Claim at MB Student Welfare Office.',
    contactName: 'DSW Office',
    contactEmail: 'dsw@vit.ac.in',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=400',
    status: 'active'
  },
  {
    id: 'item_4',
    type: 'lost',
    title: 'Titan Fastrack Black Leather Wallet',
    category: 'Wallet',
    locationName: 'SJT Ground Floor Cafeteria',
    dateReported: '2026-08-19',
    description: 'Contains driving license, SBI debit card, and cash. Reward offered for return.',
    contactName: 'Arjun M.',
    contactEmail: 'arjun.m2023@vitstudent.ac.in',
    status: 'active'
  }
];

export const directoryEntries: DirectoryEntry[] = [
  {
    id: 'dir_med',
    name: 'VIT Health & Medical Centre',
    category: 'Medical Services',
    locationName: 'Near Main Gate / Sports Complex',
    buildingCode: 'MED',
    description: '24-hour outpatient clinic, trauma room, ambulance service, and subsidized student pharmacy.',
    openingHours: '24 hours / 7 days',
    contact: '0416-2202111 / Ext: 2111',
    iconName: 'Activity',
    locationId: 'loc_med'
  },
  {
    id: 'dir_lib',
    name: 'Periyar E.V.R. Central Library',
    category: 'Academic Facilities',
    locationName: 'Opposite Technology Tower',
    buildingCode: 'LIB',
    description: 'Central campus library with digital reference desks, stack rooms, quiet reading zones, and book lending kiosks.',
    openingHours: '08:00 AM - 12:00 Midnight',
    contact: 'library@vit.ac.in',
    iconName: 'BookOpen',
    locationId: 'loc_lib'
  },
  {
    id: 'dir_print',
    name: 'TT Express Printing & Binding Cell',
    category: 'Student Utilities',
    locationName: 'Technology Tower Ground Floor Room 004',
    buildingCode: 'TT',
    roomNumber: 'TT-004',
    description: 'High-speed laser printing, plotters for engineering drawings, spiral & hard project report binding.',
    openingHours: '08:30 AM - 07:00 PM',
    contact: 'tt.printing@vit.ac.in',
    iconName: 'Printer',
    locationId: 'loc_print'
  },
  {
    id: 'dir_atm',
    name: 'State Bank of India (SBI) ATM & Branch',
    category: 'Banking & ATMs',
    locationName: 'VIT Main Gate Administrative Annex',
    buildingCode: 'MB',
    description: 'Full-service SBI branch with 3 cash deposit/withdrawal ATMs and student account helpdesk.',
    openingHours: 'ATM: 24/7 | Branch: 10:00 AM - 04:00 PM',
    contact: '0416-2242000',
    iconName: 'CreditCard',
    locationId: 'loc_atm_sbi'
  },
  {
    id: 'dir_exam',
    name: 'Office of the Controller of Examinations (CoE)',
    category: 'Administrative Offices',
    locationName: 'Main Building 1st Floor Right Wing',
    buildingCode: 'MB',
    roomNumber: 'MB-108',
    description: 'CAT/FAT exam scheduling, official grade transcript requests, re-evaluation applications, and hall tickets.',
    openingHours: '09:00 AM - 05:00 PM (Lunch break: 1:00 PM - 2:00 PM)',
    contact: 'coe@vit.ac.in',
    iconName: 'FileCheck'
  },
  {
    id: 'dir_placement',
    name: 'Career Development Centre (Placement Cell)',
    category: 'Career & Placements',
    locationName: 'Silver Jubilee Tower 1st Floor Admin Suite',
    buildingCode: 'SJT',
    roomNumber: 'SJT-101',
    description: 'Campus placement drives, internship coordination, resume vetting, and corporate interview suites.',
    openingHours: '09:00 AM - 06:00 PM',
    contact: 'cdc@vit.ac.in',
    iconName: 'Briefcase'
  }
];

export const notificationsList: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Upcoming Class Alert',
    message: 'Software Engineering (CSE3001) in TT-624 starts at 10:00 AM (8 min walk).',
    timestamp: '10 mins ago',
    type: 'timetable',
    isRead: false
  },
  {
    id: 'notif_2',
    title: 'Lost & Found Update',
    message: 'A Casio FX-991EX calculator was reported found in TT-624.',
    timestamp: '35 mins ago',
    type: 'lost_found',
    isRead: false
  },
  {
    id: 'notif_3',
    title: 'Library Hours Extended',
    message: 'Central Library will remain open until 2:00 AM for ongoing CAT-2 preparation.',
    timestamp: '2 hours ago',
    type: 'info',
    isRead: true
  }
];

export const sampleAiQuestions = [
  "Where is TT-624?",
  "Where is the Medical Centre?",
  "How do I get to SJT?",
  "Where is the nearest printer?",
  "Which classroom is free right now?",
  "What is my next class?"
];

export const DEFAULT_VIT_REGISTRATION_DATA = `
IMAT205L - Discrete Mathematics and Graph Theory
( Theory Only )
C2+TC2+TCC2 - SJT208
SHUBHANGI DWIVEDI - SAS

ISTS201P - Qualitative Skills Practice II
( Soft Skill )
G2+TG2 - SJT124
SIXPHRASE (APT) - SSL

ISWE302L - Artificial Intelligence
( Theory Only )
D2+TD2 - SJT205
SUGANYA D - SCORE

ISWE302P - Artificial Intelligence Lab
( Lab Only )
L11+L12 - SJT218
SUGANYA D - SCORE

ISWE305L - Software Testing
( Theory Only )
F2+TF2 - SJT223
VINOTHKUMAR V - SCORE

ISWE305P - Software Testing Lab
( Lab Only )
L23+L24 - SJT121
VINOTHKUMAR V - SCORE

ISWE403L - Software Configuration Management
( Theory Only )
E2+TE2 - SJT204
SENTHIL KUMAR P - SCORE

ISWE406L - Agile Development Process and Devops
( Theory Only )
A2+TA2 - SJT204
SWETA BHATTACHARYA - SCORE

ISWE406P - Agile Development Process and Devops Lab
( Lab Only )
L19+L20 - SJT218
SWETA BHATTACHARYA - SCORE

ISWE416L - Big Data Analytics
( Theory Only )
B2+TB2 - SJT204
CHANDRA MOULISWARAN S - SCORE
`;

